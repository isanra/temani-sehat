import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		// paths: {
		// 	// Pastikan nama repo ini benar (huruf kecil/besar berpengaruh)
		// 	base: process.env.NODE_ENV === 'production' ? '/temani-sehat' : ''
		// },
		// // --- TAMBAHKAN BARIS INI ---
		// // Mengubah nama folder dari '_app' (hidden) menjadi 'app' (visible)
		// appDir: 'app'
	}
};

export default config;
