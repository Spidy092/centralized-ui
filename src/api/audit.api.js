import { auth } from '@spidy092/auth-client';

export const auditApi = {
  /**
   * Get audit logs with filters
   * @param {Object} params - Filter parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.action - Action filter
   * @param {string} params.startDate - Start date filter
   * @param {string} params.endDate - End date filter
   * @param {string} params.status - Status filter (SUCCESS, FAILED)
   * @param {string} params.search - Search query
   */
  async getAuditLogs(params = {}) {
    const res = await auth.api.get('/audit/audit-logs', { params });
    return res.data;
  },

  /**
   * Get user's login history
   * @param {number} limit - Number of records to return
   */
  async getLoginHistory(limit = 50) {
    const res = await auth.api.get('/audit/login-history', {
      params: { limit },
    });
    return res.data;
  },

  /**
   * Get user's security events
   * @param {number} limit - Number of records to return
   */
  async getSecurityEvents(limit = 50) {
    const res = await auth.api.get('/audit/security-events', {
      params: { limit },
    });
    return res.data;
  },

  /**
   * Get session statistics
   */
  async getSessionStats() {
    const res = await auth.api.get('/audit/sessions/stats');
    return res.data;
  },
};

