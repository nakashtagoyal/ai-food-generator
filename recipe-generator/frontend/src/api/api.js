import axios from 'axios';

const api = axios.create({baseURL: import.meta.env.VITE_API_URL || '/api'});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const generateRecipes = (payload) => api.post('/recipes/generate', payload).then((r) => r.data);
export const saveRecipe = (recipe) => api.post('/recipes/save', recipe).then((r) => r.data);
export const toggleFavorite = (id) => api.post(`/recipes/${id}/favorite`).then((r) => r.data);
export const getFavorites = () => api.get('/recipes/favorites').then((r) => r.data);

export const signup = (payload) => api.post('/api/auth/signup', payload).then((r) => r.data);
export const login = (payload) => api.post('/api/auth/login', payload).then((r) => r.data);
export const getProfile = () => api.get('/api/auth/profile').then((r) => r.data);

export default api;
