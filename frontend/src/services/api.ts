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
});
