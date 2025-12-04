import {auth}  from '@spidy092/auth-client';


export const sessionsApi = {
    async getAll() {
        const res = await auth.api.get('/account/sessions');
        return res.data;
    },

    async terminate(id){
        const res = await auth.api.delete(`/account/sessions/${id}`);
        return res.data;
    },

    async logoutAll(){
        const res = await auth.api.post('/account/logout-all');
        return res.data;
    },
};