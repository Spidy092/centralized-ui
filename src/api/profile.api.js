import { auth } from '@spidy092/auth-client';

export const profileApi = {
  async get() {
    const res = await auth.api.get('/account/profile');
    return res.data;
  },

  async update(payload) {
    const res = await auth.api.put('/account/profile', payload);
    return res.data;
  },

  async getSummary() {
    const res = await auth.api.get('/account/profile/summary');
    return res.data;
  },

  async getOrganizations() {
    const res = await auth.api.get('/account/organizations');
    return res.data;
  },

  async getPermissions() {
    const res = await auth.api.get('/account/permissions');
    return res.data;
  },
};

