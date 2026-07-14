import axios from 'axios';

// Create a centralized Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

export default api;
