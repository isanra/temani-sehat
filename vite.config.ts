import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	// Pertahankan plugins yang sudah ada (Tailwind + SvelteKit)
	plugins: [tailwindcss(), sveltekit()],

	// Tambahkan settingan Proxy di sini
	server: {
		proxy: {
			'/api': {
				// URL Ngrok temanmu
				target: 'https://nondeprecatively-overdiligent-sonja.ngrok-free.dev',
				changeOrigin: true,
				secure: false
			}
		}
	}
});
