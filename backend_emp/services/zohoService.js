/**
 * Zoho CRM Custom Module Integration Service
 * Synchronizes employee profiles to Zoho CRM Custom Module.
 */

let cachedToken = null;
let tokenExpiresAt = 0; // Timestamp in ms

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
  // Reuse token if valid for at least another 60 seconds
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
    const orgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID;
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

    // Construct Zoho Books Contact / Employee Payload
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
 * Automatically checks whether to sync to Zoho Books, Zoho CRM, or both!
 */
async function syncEmployeeToZoho(employee) {
  if (!employee) {
    return { success: false, error: 'Employee data required' };
  }

  const results = {};

  // If Zoho Books Org ID is configured, sync to Zoho Books
  if (process.env.ZOHO_BOOKS_ORGANIZATION_ID) {
    results.books = await syncEmployeeToZohoBooks(employee);
  }

  // If Zoho CRM Custom Module API Name is configured, sync to Zoho CRM
  if (process.env.ZOHO_CUSTOM_MODULE_API_NAME) {
    results.crm = await syncEmployeeToZohoCrm(employee);
  }

  // Default fallback if neither specific param is set
  if (!process.env.ZOHO_BOOKS_ORGANIZATION_ID && !process.env.ZOHO_CUSTOM_MODULE_API_NAME) {
    return {
      success: false,
      error: 'Neither ZOHO_BOOKS_ORGANIZATION_ID nor ZOHO_CUSTOM_MODULE_API_NAME is configured in environment variables.'
    };
  }

  const overallSuccess = (results.books?.success !== false) && (results.crm?.success !== false);

  return {
    success: overallSuccess,
    results
  };
}

module.exports = {
  getZohoAccessToken,
  syncEmployeeToZohoBooks,
  syncEmployeeToZohoCrm,
  syncEmployeeToZoho
};
