import axios from "axios";

const configuredApiBaseUrl =
    import.meta.env.VITE_API_BASE_URL?.trim();

export const apiBaseUrl = (
    configuredApiBaseUrl ||
    `http://${window.location.hostname}:5186`
).replace(/\/+$/, "");

export const api = axios.create({
    baseURL: apiBaseUrl,
    timeout: 15000,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = String(error?.config?.url ?? "");

        if (error?.response?.status === 401 &&
            !requestUrl.includes("/auth/login")) {
            window.dispatchEvent(new Event("era-auth-expired"));
        }

        return Promise.reject(error);
    },
);
