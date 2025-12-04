import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
});

// ✅ Cookies are automatically sent withCredentials: true
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional response interceptor for debugging
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API ERROR:", error);
        return Promise.reject(error);
    }
);

export default api;
