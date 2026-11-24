import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
});

api.interceptors.request.use(c => {
  const t = localStorage.getItem('tiet-token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  r => r,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tiet-token');
      localStorage.removeItem('tiet-user');
    }
    return Promise.reject(error);
  }
);

export const get = (url: string, params?: object) =>
  api.get(url, { params }).then(r => r.data);

export const post = (url: string, data?: object) =>
  api.post(url, data).then(r => r.data);

export const patch = (url: string, data?: object) =>
  api.patch(url, data).then(r => r.data);

export const del = (url: string) =>
  api.delete(url).then(r => r.data);
