const supabase = require('../db');

// Default fallback client list when Zoho Books credentials are not yet set up
const DEFAULT_ZOHO_CLIENTS = [
  { id: 'cli_1', contact_id: '1001', contact_name: 'ABC Holdings', company_name: 'ABC Holdings PLC', email: 'contact@abcholdings.lk' },
  { id: 'cli_2', contact_id: '1002', contact_name: 'Ceylon Tea Exports', company_name: 'Ceylon Tea Exports Pvt Ltd', email: 'info@ceylontea.com' },
  { id: 'cli_3', contact_id: '1003', contact_name: 'Virtusa Sri Lanka', company_name: 'Virtusa Corporation', email: 'projects@virtusa.com' },
  { id: 'cli_4', contact_id: '1004', contact_name: 'Dialog Axiata', company_name: 'Dialog Axiata PLC', email: 'enterprise@dialog.lk' },
  { id: 'cli_5', contact_id: '1005', contact_name: 'PWH Logistics', company_name: 'PW Holdings Logistics', email: 'logistics@pwholdings.lk' },
  { id: 'cli_6', contact_id: '1006', contact_name: 'Brandix Apparel', company_name: 'Brandix Lanka Ltd', email: 'contact@brandix.com' }
];

let cachedToken = null;
let tokenExpiresAt = 0;
let workingAccountsUrl = null;
let workingApiDomain = null;

const zohoService = {
  /**
   * Fetch list of clients from Zoho Books API with pagination (fetching all 200+ clients)
   */
  async getZohoClients() {
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const orgId = process.env.ZOHO_ORGANIZATION_ID;

    // If API credentials are not provided, return cached fallback clients
    if (!clientId || !clientSecret || !refreshToken || !orgId) {
      return {
        is_live: false,
        message: 'Zoho Books credentials not configured. Showing default client list.',
        clients: DEFAULT_ZOHO_CLIENTS
      };
    }

    try {
      const now = Date.now();
      
      // Refresh Access Token if expired or null
      if (!cachedToken || now >= tokenExpiresAt) {
        const candidateAccounts = workingAccountsUrl 
          ? [workingAccountsUrl] 
          : [
              process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com',
              'https://accounts.zoho.in',
              'https://accounts.zoho.eu'
            ];

        let tokenData = null;
        let successfulAccountsUrl = null;

        for (const accountsUrl of candidateAccounts) {
          try {
            const params = new URLSearchParams();
            params.append('refresh_token', refreshToken ? refreshToken.trim() : '');
            params.append('client_id', clientId ? clientId.trim() : '');
            params.append('client_secret', clientSecret ? clientSecret.trim() : '');
            params.append('grant_type', 'refresh_token');

            const tokenRes = await fetch(`${accountsUrl}/oauth/v2/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: params
            });

            const resJson = await tokenRes.json();
            if (resJson.access_token) {
              tokenData = resJson;
              successfulAccountsUrl = accountsUrl;
              break;
            } else {
              console.warn(`Zoho token error at ${accountsUrl}:`, JSON.stringify(resJson));
            }
          } catch (err) {
            console.warn(`Token request failed at ${accountsUrl}:`, err.message);
          }
        }

        if (!tokenData || !tokenData.access_token) {
          console.warn('Could not refresh Zoho token across endpoints.');
          return { is_live: false, message: 'Invalid token credentials', clients: DEFAULT_ZOHO_CLIENTS };
        }

        workingAccountsUrl = successfulAccountsUrl;
        cachedToken = tokenData.access_token;
        tokenExpiresAt = now + ((tokenData.expires_in || 3600) - 300) * 1000;
        workingApiDomain = tokenData.api_domain || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
      }

      const apiDomain = workingApiDomain || 'https://www.zohoapis.com';

      // Paginated Fetch to retrieve ALL clients (e.g. 200+)
      let allContacts = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 15) {
        const contactsUrl = `${apiDomain}/books/v3/contacts?filter_by=Status.ActiveCustomers&per_page=200&page=${page}&organization_id=${orgId}`;
        const contactsRes = await fetch(contactsUrl, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${cachedToken}`
          }
        });

        const contactsData = await contactsRes.json();

        if (contactsData.code === 0 && Array.isArray(contactsData.contacts)) {
          allContacts.push(...contactsData.contacts);
          hasMore = contactsData.page_context ? contactsData.page_context.has_more_page : false;
          page++;
        } else {
          // If Status.ActiveCustomers yielded no result or error, fallback to Status.All
          if (page === 1) {
            const fallbackUrl = `${apiDomain}/books/v3/contacts?filter_by=Status.All&per_page=200&page=1&organization_id=${orgId}`;
            const fbRes = await fetch(fallbackUrl, {
              headers: { 'Authorization': `Zoho-oauthtoken ${cachedToken}` }
            });
            const fbData = await fbRes.json();
            if (fbData.code === 0 && Array.isArray(fbData.contacts)) {
              allContacts = fbData.contacts;
            }
          }
          hasMore = false;
        }
      }

      if (allContacts.length === 0) {
        return { is_live: true, clients: DEFAULT_ZOHO_CLIENTS };
      }

      const clients = allContacts.map((c) => ({
        id: c.contact_id,
        contact_id: c.contact_id,
        contact_name: c.contact_name || c.company_name || 'Client',
        company_name: c.company_name || c.contact_name || 'Client',
        email: c.email || ''
      }));

      return {
        is_live: true,
        clients: clients
      };
    } catch (err) {
      console.error('Zoho API Error:', err.message);
      return {
        is_live: false,
        message: err.message,
        clients: DEFAULT_ZOHO_CLIENTS
      };
    }
  },

  /**
   * Get Client Work Analytics for Admin Reports
   */
  async getClientAnalytics() {
    const { clients } = await this.getZohoClients();

    // Fetch all daily work entries with employee details
    const { data: entries, error } = await supabase
      .from('daily_work_entries')
      .select(`
        id, user_id, entry_date, work_description, created_at,
        users (id, name, initials, department)
      `)
      .order('entry_date', { ascending: false });

    if (error) throw new Error(error.message);

    const clientStatsMap = {};
    
    // Initialize map for all known Zoho clients
    (clients || []).forEach((c) => {
      const name = c.contact_name || c.company_name || c.id;
      clientStatsMap[name] = {
        client_name: name,
        company_name: c.company_name || name,
        contact_id: c.contact_id || c.id,
        email: c.email || '',
        total_work_entries: 0,
        unique_employees: new Set(),
        logs: [],
        latest_work_date: ''
      };
    });

    const normalize = (str) => (str || '').toLowerCase().trim();

    // Helper to find existing key or register new/custom client entry
    const getOrRegisterClientKey = (clientName) => {
      if (!clientName) return null;
      const normInput = normalize(clientName);

      // 1. Exact or case-insensitive match in clientStatsMap
      let existingKey = Object.keys(clientStatsMap).find(k => normalize(k) === normInput);
      if (existingKey) return existingKey;

      // 2. Check if input matches any Zoho client company_name or contact_name
      const matchedZoho = clients.find(c => 
        normalize(c.contact_name) === normInput || 
        normalize(c.company_name) === normInput ||
        normalize(c.contact_name).includes(normInput) ||
        normInput.includes(normalize(c.contact_name))
      );

      if (matchedZoho) {
        const key = matchedZoho.contact_name || matchedZoho.company_name;
        if (clientStatsMap[key]) return key;
      }

      // 3. Register custom client (e.g., 'Vechali') if not present in default Zoho list
      clientStatsMap[clientName] = {
        client_name: clientName,
        company_name: clientName,
        contact_id: 'custom',
        email: '',
        total_work_entries: 0,
        unique_employees: new Set(),
        logs: [],
        latest_work_date: ''
      };
      return clientName;
    };

    // Process work entries
    (entries || []).forEach((entry) => {
      const empName = entry.users?.name || 'Employee';
      const empDept = entry.users?.department || 'General';
      const empInitials = entry.users?.initials || empName.slice(0, 2).toUpperCase();
      const workDesc = entry.work_description || '';

      const assignedClients = new Set();

      // 1. Extract from [Clients: ClientA, ClientB] tag (highest priority)
      const tagMatch = workDesc.match(/\[Clients:\s*([^\]]+)\]/i);
      if (tagMatch && tagMatch[1]) {
        tagMatch[1].split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed) assignedClients.add(trimmed);
        });
      }

      // 2. Match case-insensitively against official Zoho clients and brand keywords
      const lowerDesc = normalize(workDesc);
      clients.forEach((c) => {
        const cName = c.contact_name || c.company_name;
        if (!cName) return;
        const normCName = normalize(cName);

        const isGenericWord = ['credit', 'demo', 'support', 'clean', 'system', 'project', 'client', 'manual', 'report'].includes(normCName);
        
        if (!isGenericWord && normCName.length >= 4 && lowerDesc.includes(normCName)) {
          assignedClients.add(cName);
        } else {
          // Core brand keywords
          const coreBrandKeywords = [
            'wycherley', 'tekzol', 'slagro', 'helans', 'plexus', 'mgm', 'bio grow', 
            'tranz pharma', 'clevr', 'cleaver', 'italy lanka', 'blue lotus', 'agoal',
            'dilshee', 'mihraj', 'connex', 'vechali', 'vecharly'
          ];
          for (const brand of coreBrandKeywords) {
            if (normCName.includes(brand) && lowerDesc.includes(brand)) {
              assignedClients.add(cName);
              break;
            }
          }
        }
      });

      // Record entry to stats map
      assignedClients.forEach((clientName) => {
        const targetKey = getOrRegisterClientKey(clientName);
        if (!targetKey || !clientStatsMap[targetKey]) return;

        const stat = clientStatsMap[targetKey];
        stat.total_work_entries += 1;
        stat.unique_employees.add(empName);
        if (!stat.latest_work_date || entry.entry_date > stat.latest_work_date) {
          stat.latest_work_date = entry.entry_date;
        }

        stat.logs.push({
          id: entry.id,
          user_id: entry.user_id,
          employee_name: empName,
          department: empDept,
          initials: empInitials,
          entry_date: entry.entry_date,
          work_description: entry.work_description
        });
      });
    });

    // Format response
    const clientAnalyticsList = Object.values(clientStatsMap).map((stat) => ({
      client_name: stat.client_name,
      company_name: stat.company_name,
      contact_id: stat.contact_id,
      email: stat.email,
      total_work_entries: stat.total_work_entries,
      total_employees_count: stat.unique_employees.size,
      employees: Array.from(stat.unique_employees),
      latest_work_date: stat.latest_work_date,
      logs: stat.logs
    })).sort((a, b) => b.total_work_entries - a.total_work_entries);

    return {
      total_clients: clients.length,
      active_clients_worked: clientAnalyticsList.filter(c => c.total_work_entries > 0).length,
      analytics: clientAnalyticsList
    };
  },

  /**
   * Create a new employee entry directly in Zoho Books Custom Module 'cm_employee'
   */
  async createZohoEmployeeRecord(empData = {}) {
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const orgId = process.env.ZOHO_ORGANIZATION_ID;

    if (!clientId || !clientSecret || !refreshToken || !orgId) {
      return {
        success: false,
        message: 'Zoho Books API credentials not configured in backend environment.'
      };
    }

    try {
      const now = Date.now();
      // Ensure token is fresh
      if (!cachedToken || now >= tokenExpiresAt) {
        const candidateAccounts = workingAccountsUrl 
          ? [workingAccountsUrl] 
          : [
              process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com',
              'https://accounts.zoho.in',
              'https://accounts.zoho.eu'
            ];

        let tokenData = null;
        let successfulAccountsUrl = null;

        for (const accountsUrl of candidateAccounts) {
          try {
            const params = new URLSearchParams();
            params.append('refresh_token', refreshToken ? refreshToken.trim() : '');
            params.append('client_id', clientId ? clientId.trim() : '');
            params.append('client_secret', clientSecret ? clientSecret.trim() : '');
            params.append('grant_type', 'refresh_token');

            const tokenRes = await fetch(`${accountsUrl}/oauth/v2/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: params
            });

            const resJson = await tokenRes.json();
            if (resJson.access_token) {
              tokenData = resJson;
              successfulAccountsUrl = accountsUrl;
              break;
            }
          } catch (err) {
            console.warn(`Token request failed at ${accountsUrl}:`, err.message);
          }
        }

        if (!tokenData || !tokenData.access_token) {
          return { success: false, message: 'Could not obtain Zoho Books access token.' };
        }

        workingAccountsUrl = successfulAccountsUrl;
        cachedToken = tokenData.access_token;
        tokenExpiresAt = now + ((tokenData.expires_in || 3600) - 300) * 1000;
        workingApiDomain = tokenData.api_domain || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
      }

      const apiDomain = workingApiDomain || 'https://www.zohoapis.com';

      // Zoho Books Custom Module 'cm_employee' requires top-level cf_* properties
      const payload = {
        cf_name: empData.name || '',
        cf_email: empData.email || ''
      };

      if (empData.emp_code) {
        payload.cf_emp_code = empData.emp_code;
      }
      if (empData.dob) {
        payload.cf_dob = empData.dob;
      }
      if (empData.date_joined || empData.date_of_joined) {
        payload.cf_date_of_joined = empData.date_joined || empData.date_of_joined;
      }
      if (empData.designation) {
        payload.cf_designation = empData.designation;
      }
      if (empData.card_designation) {
        payload.cf_card_designation = empData.card_designation;
      }

      const endpoint = `${apiDomain}/books/v3/cm_employee?organization_id=${orgId}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${cachedToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();

      if (resData.code === 0 || resData.module_record) {
        const empCode = resData.module_record?.cf_emp_code || resData.module_record?.record_name || '';
        return {
          success: true,
          message: `Employee entry created successfully in Zoho Books! (Assigned EMP CODE: ${empCode || 'Auto-assigned'})`,
          data: resData.module_record
        };
      } else {
        console.warn('Zoho Custom Module creation error:', JSON.stringify(resData));
        return {
          success: false,
          message: resData.message || 'Failed to create employee record in Zoho Books.'
        };
      }
    } catch (err) {
      console.error('Create Zoho employee error:', err.message);
      return { success: false, message: err.message };
    }
  }
};

module.exports = zohoService;
