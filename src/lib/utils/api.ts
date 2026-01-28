// src/lib/utils/api.ts
import { browser } from '$app/environment';

export const API_BASE_URL = "https://nondeprecatively-overdiligent-sonja.ngrok-free.dev/api";

export async function fetchApi(endpoint: string, method = 'GET', body: any = null, isFormData = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    let token = '';

    if (browser) {
        token = localStorage.getItem('auth_token') || '';
    }

    const headers: any = {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const options: RequestInit = {
        method,
        headers,
    };

    if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const res = await fetch(url, options);

        // 1. Cek Auth (401) - Token expired
        if (res.status === 401 && browser) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
            return null;
        }

        // 2. Coba ambil JSON response
        const data = await res.json().catch(() => null);

        // 3. Jika Error (422 Validasi, 500 Server, dll)
        if (!res.ok) {
            // Ambil pesan error asli dari Laravel
            // Laravel biasanya kirim { "message": "...", "errors": {...} }
            const serverMessage = data?.message || `Terjadi kesalahan (Code: ${res.status})`;

            // Kita lempar error ini biar ditangkap di halaman Svelte
            throw new Error(serverMessage);
        }

        return data;

    } catch (error: any) {
        console.error("Fetch Error:", error);
        throw error; // Lempar ulang error ke UI
    }
}