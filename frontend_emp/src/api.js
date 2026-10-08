// Centralized API Client connecting exclusively to Backend API Gateway
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (window.location.port === '5173' ? '/api' : 'http://localhost:5000/api')
    : '/api'
);

// Helper to get stored auth token
function getAuthToken() {
  try {
    const storedUser = localStorage.getItem('emp_mgt_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      return parsed.token || null;
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return null;
}

// Universal fetch wrapper
async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    let data = null;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = (typeof data === 'object' && data?.error) ? data.error : response.statusText || 'Request failed';
      const error = new Error(errorMsg);
      error.response = { data, status: response.status };
      throw error;
    }

    return { data, status: response.status };
  } catch (err) {
    if (!err.response) {
      err.response = { data: { error: err.message || 'Network error occurred' }, status: 500 };
    }
    throw err;
  }
}

const API = {
  get(url, options = {}) {
    return request(url, { ...options, method: 'GET' });
  },
  post(url, body, options = {}) {
    return request(url, { ...options, method: 'POST', body });
  },
  put(url, body, options = {}) {
    return request(url, { ...options, method: 'PUT', body });
  },
  patch(url, body, options = {}) {
    return request(url, { ...options, method: 'PATCH', body });
  },
  delete(url, options = {}) {
    return request(url, { ...options, method: 'DELETE' });
  }
};

export default API;
