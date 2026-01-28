

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(),sveltekit()],
    server: {
        proxy: {
            // Setiap kali frontend panggil '/api', belokkan ke Ngrok
            '/api': {
                target: 'https://nondeprecatively-overdiligent-sonja.ngrok-free.dev',
                changeOrigin: true,
                secure: false,
                // Tambahkan header ngrok otomatis di sini biar ga ribet
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            }
        }
    }
});