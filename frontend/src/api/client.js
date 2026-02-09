import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    withCredentials: true, // Important for cookies
    headers: {
        'Content-Type': 'application/json'
    },
});

// Request interceptor to attach token
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for global error handling
client.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'Something went wrong';
        // You could trigger a toast notification here if you add a toast library
        if (error.response?.status !== 401) {
            console.error('API Error:', message, error.response?.status);
        } else {
            console.warn('Auth error - token may have expired');
        }
        return Promise.reject(error);
    }
);

export default client;
