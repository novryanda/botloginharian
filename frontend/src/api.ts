import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 15000,
});

// Account
export const getAccounts = (page = 1, size = 20) =>
    api.get('/accounts', { params: { page, size } });

export const createAccount = (data: any) => api.post('/accounts', data);

export const updateAccount = (id: number, data: any) =>
    api.put(`/accounts/${id}`, data);

export const deleteAccount = (id: number) => api.delete(`/accounts/${id}`);

export const downloadTemplate = () =>
    api.get('/accounts/template', { responseType: 'blob' });

export const importAccounts = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/accounts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
    });
};

// Worker
export const startAllWorkers = () => api.post('/workers/start-all');
export const startOneWorker = (id: number) => api.post(`/workers/${id}/start`);
export const stopAllWorkers = () => api.post('/workers/stop-all');
export const getWorkerStatus = () => api.get('/workers/status');

// Logs
export const getLogs = (page = 1, size = 20, accountId?: number) =>
    api.get('/logs', { params: { page, size, accountId } });

export const getLogsByAccount = (id: number, page = 1, size = 20) =>
    api.get(`/logs/account/${id}`, { params: { page, size } });

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data: Record<string, string>) =>
    api.put('/settings', data);

export default api;
