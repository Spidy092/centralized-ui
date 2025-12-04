import { auth } from '@spidy092/auth-client';

export const securityApi = {
  getOverview: async () => {
    const res = await auth.api.get('/account/security');
    return res.data;
  },

  getEvents: async () => {
    const res = await auth.api.get('/account/security-events');
    return res.data;
  },

  getStatus: async () => {
    const res = await auth.api.get('/account/2fa/status');
    return res.data;
  },

  start2FASetup: async () => {
    const res = await auth.api.post('/account/2fa/setup-redirect');
    return res.data; // { redirectUrl }
  },

  check2FAConfigured: async () => {
    const res = await auth.api.get('/account/2fa/check');
    return res.data; // { configured: boolean }
  },

  disable2FA: async () => {
    const res = await auth.api.post('/account/2fa/disable');
    return res.data;
  },

  changePassword: async (payload) => {
    const res = await auth.api.post('/account/change-password', payload);
    return res.data;
  },
};
