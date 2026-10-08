/**
 * ============================================================================
 * Session Manager Service (Singleton Pattern)
 * ============================================================================
 * Industry-standard client-side session lifecycle management:
 * - JWT expiration decoding & verification
 * - Inactivity auto-logout watcher (default: 30 mins)
 * - Centralized storage accessor with validation
 * - Observer pattern for session expiration events
 */

const STORAGE_KEY_USER = 'emp_mgt_user';
const STORAGE_KEY_TOKEN = 'emp_mgt_token';
const STORAGE_KEY_LAST_ACTIVITY = 'emp_mgt_last_active';
const DEFAULT_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

class SessionManager {
  constructor() {
    this.inactivityTimer = null;
    this.inactivityListenersRegistered = false;
    this.onTimeoutCallback = null;
  }

  /**
   * Safe Base64URL decoder for JWT payload without external library dependencies
   */
  decodeJwtPayload(token) {
    if (!token || typeof token !== 'string') return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * Checks whether a given JWT token is expired based on its 'exp' claim
   */
  isTokenExpired(token) {
    if (!token) return true;
    const payload = this.decodeJwtPayload(token);
    if (!payload || !payload.exp) {
      // Require explicit exp claim for security
      return true;
    }
    // exp is in seconds, convert to milliseconds with 10s clock skew buffer
    const expirationTimeMs = payload.exp * 1000;
    return Date.now() >= expirationTimeMs - 10000;
  }

  /**
   * Retrieves the current stored user object
   */
  getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Retrieves the active JWT token
   */
  getToken() {
    try {
      const directToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (directToken) return directToken;

      const user = this.getUser();
      return user?.token || null;
    } catch {
      return null;
    }
  }

  /**
   * Validates if the current session exists and is unexpired
   */
  isSessionValid() {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  /**
   * Stores authenticated user and session token
   */
  setSession(user, token) {
    if (!user) return;
    try {
      const sessionToken = token || user.token || '';
      const userPayload = { ...user };
      if (sessionToken) {
        userPayload.token = sessionToken;
        localStorage.setItem(STORAGE_KEY_TOKEN, sessionToken);
      }
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userPayload));
      this.recordActivity();
    } catch (err) {
      console.warn('Failed to persist session to localStorage:', err);
    }
  }

  /**
   * Completely clears all session records from client storage
   */
  clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
      sessionStorage.clear();
    } catch (err) {
      console.warn('Failed to clear storage:', err);
    }
    this.stopInactivityWatcher();
  }

  /**
   * Records timestamp of user activity
   */
  recordActivity() {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(Date.now()));
    } catch {}
  }

  /**
   * Checks if user has been inactive beyond threshold
   */
  checkInactivity(timeoutMs = DEFAULT_INACTIVITY_TIMEOUT_MS) {
    try {
      const last = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
      if (!last) return false;
      const lastTime = parseInt(last, 10);
      if (isNaN(lastTime)) return false;
      return Date.now() - lastTime > timeoutMs;
    } catch {
      return false;
    }
  }

  /**
   * Broadcasts session expiration event to UI subscribers
   */
  notifySessionExpired(reason = 'Session has expired. Please sign in again.') {
    this.clearSession();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('auth:session_expired', {
          detail: { reason }
        })
      );
    }
  }

  /**
   * Subscribes a listener callback to session expiration events
   */
  onSessionExpired(callback) {
    if (typeof window === 'undefined') return () => {};
    const handler = (e) => {
      callback(e.detail?.reason || 'Session expired');
    };
    window.addEventListener('auth:session_expired', handler);
    return () => window.removeEventListener('auth:session_expired', handler);
  }

  /**
   * Starts user activity watcher for automatic idle logout
   */
  startInactivityWatcher(onTimeout, timeoutMinutes = 30) {
    const timeoutMs = timeoutMinutes * 60 * 1000;
    this.onTimeoutCallback = onTimeout;

    const resetTimer = () => {
      this.recordActivity();
      if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
      this.inactivityTimer = setTimeout(() => {
        if (this.isSessionValid()) {
          console.warn(`[Security] Session timed out after ${timeoutMinutes} minutes of inactivity.`);
          this.notifySessionExpired('You have been logged out due to inactivity.');
          if (this.onTimeoutCallback) this.onTimeoutCallback();
        }
      }, timeoutMs);
    };

    resetTimer();

    if (!this.inactivityListenersRegistered && typeof window !== 'undefined') {
      const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      this.activityHandler = () => {
        this.recordActivity();
      };
      events.forEach((ev) => window.addEventListener(ev, this.activityHandler, { passive: true }));
      this.inactivityListenersRegistered = true;
    }
  }

  /**
   * Stops inactivity timer and removes event listeners
   */
  stopInactivityWatcher() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.inactivityListenersRegistered && typeof window !== 'undefined' && this.activityHandler) {
      const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      events.forEach((ev) => window.removeEventListener(ev, this.activityHandler));
      this.inactivityListenersRegistered = false;
      this.activityHandler = null;
    }
  }
}

// Export singleton instance
const sessionManager = new SessionManager();
export default sessionManager;
