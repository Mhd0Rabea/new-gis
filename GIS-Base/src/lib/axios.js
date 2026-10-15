import axios from 'axios';
import { useToast } from '../components/Toast.jsx';
import { runtimeConfig } from '../config/runtime.js';

const api = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function useApi() {
  const toast = useToast();

  const request = async (config) => {
    try {
      const response = await api(config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'حدث خطأ غير متوقع';
      toast.error(message);
      throw error;
    }
  };

  return {
    get: (url, config) => request({ ...config, method: 'GET', url }),
    post: (url, data, config) => request({ ...config, method: 'POST', url, data }),
    put: (url, data, config) => request({ ...config, method: 'PUT', url, data }),
    patch: (url, data, config) => request({ ...config, method: 'PATCH', url, data }),
    delete: (url, config) => request({ ...config, method: 'DELETE', url }),
    api,
  };
}

export { api };
export default api;
