const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request(method, url, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = localStorage.getItem('emp_mgt_token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'API request failed');
    error.response = { data, status: response.status };
    if (response.status === 401) localStorage.removeItem('emp_mgt_token');
    throw error;
  }

  return { data, status: response.status };
}

export default {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  patch: (url, body) => request('PATCH', url, body)
};
