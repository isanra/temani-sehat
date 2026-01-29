import { browser } from '$app/environment';
import { goto } from '$app/navigation';

export function checkAuth() {
    // 1. PENGAMAN: Server-side skip
    if (!browser) return;

    // 2. Cek Token (GUNAKAN KEY YANG KONSISTEN: 'auth_token')
    const token = localStorage.getItem('auth_token');

    if (!token) {
        console.log('Belum login, redirecting...');
        goto('/login'); // Tendang ke login jika tidak ada token
    } else {
        // Optional: Cek validitas token (expiry) di sini kalau mau lebih canggih
        console.log('Sudah login');
    }
}

// Tambahan: Fungsi Logout Helper
export function logout() {
    if (!browser) return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_role');
    goto('/login');
}