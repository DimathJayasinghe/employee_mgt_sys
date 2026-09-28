import { authService, dashboardService, adminService } from './services/supabaseService';

// Helper to extract query parameters from URL string
function parseQueryParams(url) {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return {};
  const queryString = url.slice(queryIndex + 1);
  const params = {};
  new URLSearchParams(queryString).forEach((val, key) => {
    params[key] = val;
  });
  return params;
}

// Clean endpoint path by removing base and query string
function cleanPath(url) {
  let path = url.replace(/^https?:\/\/[^/]+/, ''); // remove origin if present
  path = path.replace(/^\/api/, ''); // remove leading /api
  const queryIndex = path.indexOf('?');
  if (queryIndex !== -1) {
    path = path.substring(0, queryIndex);
  }
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return path;
}

// Direct Supabase API Adapter conforming to Axios-like interface
const API = {
  async get(url) {
    const path = cleanPath(url);
    const params = parseQueryParams(url);

    try {
      if (path === '/dashboard/summary') {
        const userId = params.user_id;
        const data = await dashboardService.getDashboardSummary(userId);
        return { data };
      }

      if (path === '/work-entry/history') {
        const userId = params.user_id;
        const data = await dashboardService.getWorkHistory(userId);
        return { data: data?.entries || data || [] };
      }

      if (path === '/leave/history') {
        const userId = params.user_id;
        const data = await dashboardService.getLeaveHistory(userId);
        return { data: data?.requests || data || [] };
      }

      if (path === '/admin/summary') {
        const data = await adminService.getAdminSummary();
        return { data };
      }

      if (path === '/admin/employees') {
        const data = await adminService.getAdminEmployees();
        return { data: data?.employees || data || [] };
      }

      if (path === '/admin/work-activity') {
        const data = await adminService.getAdminWorkActivity();
        return { data: data?.activities || data || [] };
      }

      if (path === '/admin/leave-calendar') {
        const year = parseInt(params.year) || new Date().getFullYear();
        const month = parseInt(params.month) || (new Date().getMonth() + 1);
        const data = await adminService.getAdminLeaveCalendar(year, month);
        return { data: data?.leaves || data || [] };
      }

      throw new Error(`Unhandled GET route: ${path}`);
    } catch (err) {
      console.error(`API GET error on ${url}:`, err);
      const customErr = new Error(err.message || 'API request failed');
      customErr.response = { data: { error: err.message || 'API request failed' }, status: 500 };
      throw customErr;
    }
  },

  async post(url, body = {}) {
    const path = cleanPath(url);

    try {
      if (path === '/auth/login') {
        const data = await authService.login(body.email, body.password);
        return { data };
      }

      if (path === '/auth/send-otp') {
        const data = await authService.sendOtp(body.email, body.type);
        return { data };
      }

      if (path === '/auth/verify-otp-register') {
        const data = await authService.verifyOtpRegister(body);
        return { data };
      }

      if (path === '/auth/verify-otp-reset-password') {
        const data = await authService.verifyOtpResetPassword(body);
        return { data };
      }

      if (path === '/work-entry') {
        const data = await dashboardService.saveWorkEntry(body.user_id, body.work_description);
        return { data };
      }

      if (path === '/leave/apply') {
        const data = await dashboardService.applyLeave(body);
        return { data };
      }

      if (path === '/leave/cancel') {
        const data = await dashboardService.cancelLeave(body.id, body.user_id);
        return { data };
      }

      if (path === '/admin/leave/approve') {
        const data = await adminService.approveLeave(body.id);
        return { data };
      }

      if (path === '/admin/leave/reject') {
        const data = await adminService.rejectLeave(body.id);
        return { data };
      }

      throw new Error(`Unhandled POST route: ${path}`);
    } catch (err) {
      console.error(`API POST error on ${url}:`, err);
      const customErr = new Error(err.message || 'API request failed');
      customErr.response = { data: { error: err.message || 'API request failed' }, status: 400 };
      throw customErr;
    }
  },

  async patch(url, body = {}) {
    const path = cleanPath(url);

    try {
      if (path === '/user/status') {
        const data = await dashboardService.updateUserStatus(body.user_id, body.status);
        return { data };
      }

      throw new Error(`Unhandled PATCH route: ${path}`);
    } catch (err) {
      console.error(`API PATCH error on ${url}:`, err);
      const customErr = new Error(err.message || 'API request failed');
      customErr.response = { data: { error: err.message || 'API request failed' }, status: 400 };
      throw customErr;
    }
  }
};

export default API;
