import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: false,
});

// ✅ Always attach latest token before every request
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
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
