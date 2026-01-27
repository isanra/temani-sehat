import { browser } from '$app/environment'; // Import pengaman
import { goto } from '$app/navigation';

export function checkAuth() {
    // 1. PENGAMAN: Jika ini dijalankan di Server, BERHENTI.
    if (!browser) return;

    // 2. Kode di bawah ini hanya akan jalan di Browser (Aman)
    const token = localStorage.getItem('token');

    if (!token) {
        console.log('Belum login, redirecting...');
        // Redirect user ke halaman login
        goto('/login'); 
    } else {
        console.log('Sudah login');
    }
}