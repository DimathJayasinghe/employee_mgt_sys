const supabase = require('../db');

/**
 * Zoho Integration Service
 * Handles employee profile sync to Zoho Books & Zoho CRM, and client analytics.
 */

let cachedToken = null;
let tokenExpiresAt = 0; // Timestamp in ms
let workingAccountsUrl = null;
let workingApiDomain = null;

// Default fallback client list when Zoho Books credentials are not yet set up
const DEFAULT_ZOHO_CLIENTS = [
  { id: 'cli_1', contact_id: '1001', contact_name: 'ABC Holdings', company_name: 'ABC Holdings PLC', email: 'contact@abcholdings.lk' },
  { id: 'cli_2', contact_id: '1002', contact_name: 'Ceylon Tea Exports', company_name: 'Ceylon Tea Exports Pvt Ltd', email: 'info@ceylontea.com' },
  { id: 'cli_3', contact_id: '1003', contact_name: 'Virtusa Sri Lanka', company_name: 'Virtusa Corporation', email: 'projects@virtusa.com' },
  { id: 'cli_4', contact_id: '1004', contact_name: 'Dialog Axiata', company_name: 'Dialog Axiata PLC', email: 'enterprise@dialog.lk' },
  { id: 'cli_5', contact_id: '1005', contact_name: 'PWH Logistics', company_name: 'PW Holdings Logistics', email: 'logistics@pwholdings.lk' },
  { id: 'cli_6', contact_id: '1006', contact_name: 'Brandix Apparel', company_name: 'Brandix Lanka Ltd', email: 'contact@brandix.com' }
];

/**
 * Obtain Zoho OAuth Access Token using Refresh Token with in-memory caching.
 */
async function getZohoAccessToken(forceRefresh = false) {
  const accountsUrl = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com').replace(/\/+$/, '');
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Zoho credentials missing in environment variables (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN).');
  }

  const now = Date.now();
  if (!forceRefresh && cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const tokenEndpoint = `${accountsUrl}/oauth/v2/token`;
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  });

  const response = await fetch(`${tokenEndpoint}?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Zoho access token (HTTP ${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data || !data.access_token) {
    const errMessage = data?.error || 'No access_token returned by Zoho OAuth endpoint';
    throw new Error(`Zoho token error: ${errMessage}`);
  }

  const expiresInSec = parseInt(data.expires_in || 3600, 10);
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + expiresInSec * 1000;

  return cachedToken;
}

/**
 * Format date string or Date object to YYYY-MM-DD
 */
function formatDate(dateValue) {
  if (!dateValue) return null;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch (err) {
    return null;
  }
}

/**
 * Sync employee profile to Zoho Books API (Contacts / Employees endpoint).
 */
async function syncEmployeeToZohoBooks(employee, isRetry = false) {
  try {
    const orgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID || process.env.ZOHO_ORGANIZATION_ID;
    if (!orgId) {
      return { success: false, error: 'ZOHO_BOOKS_ORGANIZATION_ID environment variable is missing.' };
    }

    const booksApiUrl = (process.env.ZOHO_BOOKS_API_URL || 'https://www.zohoapis.com/books/v3').replace(/\/+$/, '');
    const token = await getZohoAccessToken(isRetry);

    const name = employee.name || employee.full_name || 
      [employee.first_name, employee.last_name].filter(Boolean).join(' ') || 'Employee';
    
    const corporateEmail = employee.email || employee.corporate_email || employee.personal_email || null;
    const nic = employee.nic || null;
    const designation = employee.designation || null;
    const cardDesignation = employee.card_designation || null;
    const dateJoined = formatDate(employee.date_joined || employee.joined_date);
    const phone = employee.phone || employee.mobile_phone || null;
    const department = employee.department || 'P W Holdings';
    const schoolAttended = employee.school_attended || employee.school || null;
    const tshirtSize = employee.tshirt_size || employee.t_shirt_size || null;

    const booksPayload = {
      contact_name: name,
      company_name: department,
      contact_type: 'employee',
      email: corporateEmail,
      phone: phone,
      notes: `NIC: ${nic || 'N/A'} | Designation: ${designation || 'N/A'} | Card Desig: ${cardDesignation || 'N/A'} | Joined: ${dateJoined || 'N/A'} | School: ${schoolAttended || 'N/A'} | T-Shirt: ${tshirtSize || 'N/A'}`
    };

    const targetUrl = `${booksApiUrl}/contacts?organization_id=${encodeURIComponent(orgId)}`;
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        'X-com-zoho-books-organizationid': orgId
      },
      body: JSON.stringify(booksPayload)
    });

    if (response.status === 401 && !isRetry) {
      cachedToken = null;
      tokenExpiresAt = 0;
      return await syncEmployeeToZohoBooks(employee, true);
    }

    const resultText = await response.text();
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch {
      resultJson = { raw: resultText };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Zoho Books API HTTP ${response.status}: ${JSON.stringify(resultJson)}`
      };
    }

    return {
      success: true,
      service: 'Zoho Books',
      result: resultJson
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || String(err)
    };
  }
}

/**
 * Sync employee profile to Zoho CRM Custom Module (Upsert on NIC).
 */
async function syncEmployeeToZohoCrm(employee, isRetry = false) {
  try {
    if (!employee) {
      return { success: false, error: 'Employee object is required for Zoho sync' };
    }

    const apiUrl = (process.env.ZOHO_API_URL || 'https://www.zohoapis.com').replace(/\/+$/, '');
    const moduleApiName = process.env.ZOHO_CUSTOM_MODULE_API_NAME;

    if (!moduleApiName) {
      return { success: false, error: 'ZOHO_CUSTOM_MODULE_API_NAME environment variable is not configured' };
    }

    const token = await getZohoAccessToken(isRetry);

    const name = employee.name || employee.full_name || 
      [employee.first_name, employee.last_name].filter(Boolean).join(' ') || 'Employee';
    
    const corporateEmail = employee.email || employee.corporate_email || employee.personal_email || null;
    const nic = employee.nic || null;
    const designation = employee.designation || null;
    const cardDesignation = employee.card_designation || null;
    const dateJoined = formatDate(employee.date_joined || employee.joined_date);
    const phone = employee.phone || employee.mobile_phone || null;
    const schoolAttended = employee.school_attended || employee.school || null;
    const tshirtSize = employee.tshirt_size || employee.t_shirt_size || null;

    const recordPayload = {
      Name: name,
      Corporate_Email: corporateEmail,
      NIC: nic,
      Designation: designation,
      Card_Designation: cardDesignation,
      Date_Joined: dateJoined,
      Phone: phone,
      School_Attended: schoolAttended,
      Tshirt_Size: tshirtSize
    };

    Object.keys(recordPayload).forEach(key => {
      if (recordPayload[key] === undefined) {
        recordPayload[key] = null;
      }
    });

    const upsertUrl = `${apiUrl}/crm/v3/${moduleApiName}/upsert`;
    const requestBody = {
      data: [recordPayload],
      duplicate_check_fields: ['NIC']
    };

    const response = await fetch(upsertUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (response.status === 401 && !isRetry) {
      cachedToken = null;
      tokenExpiresAt = 0;
      return await syncEmployeeToZohoCrm(employee, true);
    }

    const resultText = await response.text();
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch {
      resultJson = { raw: resultText };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Zoho CRM API HTTP ${response.status}: ${JSON.stringify(resultJson)}`
      };
    }

    return {
      success: true,
      service: 'Zoho CRM',
      result: resultJson
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || String(err)
    };
  }
}

/**
 * Unified Zoho Sync entrypoint.
 */
async function syncEmployeeToZoho(employee) {
  if (!employee) {
    return { success: false, error: 'Employee data required' };
  }

  const results = {};

  if (process.env.ZOHO_BOOKS_ORGANIZATION_ID || process.env.ZOHO_ORGANIZATION_ID) {
    results.books = await syncEmployeeToZohoBooks(employee);
  }

  if (process.env.ZOHO_CUSTOM_MODULE_API_NAME) {
    results.crm = await syncEmployeeToZohoCrm(employee);
  }

  if (!process.env.ZOHO_BOOKS_ORGANIZATION_ID && !process.env.ZOHO_ORGANIZATION_ID && !process.env.ZOHO_CUSTOM_MODULE_API_NAME) {
    return {
      success: false,
      error: 'Neither ZOHO_BOOKS_ORGANIZATION_ID nor ZOHO_CUSTOM_MODULE_API_NAME is configured.'
    };
  }

  const overallSuccess = (results.books?.success !== false) && (results.crm?.success !== false);

  return {
    success: overallSuccess,
    results
  };
}

/**
 * Fetch list of clients from Zoho Books API with pagination (fetching all 200+ clients)
 */
async function getZohoClients() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const orgId = process.env.ZOHO_ORGANIZATION_ID || process.env.ZOHO_BOOKS_ORGANIZATION_ID;

  if (!clientId || !clientSecret || !refreshToken || !orgId) {
    return {
      is_live: false,
      message: 'Zoho Books credentials not configured. Showing default client list.',
      clients: DEFAULT_ZOHO_CLIENTS
    };
  }

  try {
    const now = Date.now();
    
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
        return { is_live: false, message: 'Invalid token credentials', clients: DEFAULT_ZOHO_CLIENTS };
      }

      workingAccountsUrl = successfulAccountsUrl;
      cachedToken = tokenData.access_token;
      tokenExpiresAt = now + ((tokenData.expires_in || 3600) - 300) * 1000;
      workingApiDomain = tokenData.api_domain || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
    }

    const apiDomain = workingApiDomain || 'https://www.zohoapis.com';
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
}

/**
 * Get Client Work Analytics for Admin Reports
 */
async function getClientAnalytics() {
  const { clients } = await getZohoClients();

  const { data: entries, error } = await supabase
    .from('daily_work_entries')
    .select(`
      id, user_id, entry_date, work_description, created_at,
      users (id, name, initials, department)
    `)
    .order('entry_date', { ascending: false });

  if (error) throw new Error(error.message);

  const clientStatsMap = {};
  
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

  const getOrRegisterClientKey = (clientName) => {
    if (!clientName) return null;
    const normInput = normalize(clientName);

    let existingKey = Object.keys(clientStatsMap).find(k => normalize(k) === normInput);
    if (existingKey) return existingKey;

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

  (entries || []).forEach((entry) => {
    const empName = entry.users?.name || 'Employee';
    const empDept = entry.users?.department || 'General';
    const empInitials = entry.users?.initials || empName.slice(0, 2).toUpperCase();
    const workDesc = entry.work_description || '';

    const assignedClients = new Set();

    const tagMatch = workDesc.match(/\[Clients:\s*([^\]]+)\]/i);
    if (tagMatch && tagMatch[1]) {
      tagMatch[1].split(',').forEach(s => {
        const trimmed = s.trim();
        if (trimmed) assignedClients.add(trimmed);
      });
    }

    const lowerDesc = normalize(workDesc);
    clients.forEach((c) => {
      const cName = c.contact_name || c.company_name;
      if (!cName) return;
      const normCName = normalize(cName);

      const isGenericWord = ['credit', 'demo', 'support', 'clean', 'system', 'project', 'client', 'manual', 'report'].includes(normCName);
      
      if (!isGenericWord && normCName.length >= 4 && lowerDesc.includes(normCName)) {
        assignedClients.add(cName);
      } else {
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
}

module.exports = {
  getZohoAccessToken,
  syncEmployeeToZohoBooks,
  syncEmployeeToZohoCrm,
  syncEmployeeToZoho,
  getZohoClients,
  getClientAnalytics
};
