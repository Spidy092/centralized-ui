import { auth } from '@spidy092/auth-client';

export const devicesApi = {
  async getAll() {
    const res = await auth.api.get('/trusted-devices');
    return res.data;
  },
  async register(data) {
    const res = await auth.api.post('/trusted-devices/register', data);
    return res.data;
  },
  async trust(id, days = 30) {
    return auth.api.post(`/trusted-devices/${id}/trust`, { trustDays: days });
  },
  async revoke(id) {
    return auth.api.delete(`/trusted-devices/${id}`, { data: { reason: 'user_initiated' } });
  },
  async revokeAll() {
    return auth.api.post('/trusted-devices/emergency/revoke-all', {
      reason: 'User initiated',
    });
  },
};
