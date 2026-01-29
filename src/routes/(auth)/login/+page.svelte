<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { PUBLIC_API_URL } from '$env/static/public';

	// --- STATE ---
	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);

	let showPassword = $state(false);
	let isLoading = $state(false);
	let errorMessage = $state('');

	// --- LOGIC ---

	onMount(() => {
		// 1. LOGIK BIAR GAK LOGIN LOGIN LAGI (Cek Token & Role)
		const token = localStorage.getItem('auth_token');
		const userRole = localStorage.getItem('user_role');

		if (token) {
			// Redirect cerdas berdasarkan role
			if (userRole === 'admin') {
				goto('/admin');
			} else {
				goto('/app/dashboard');
			}
			return;
		}

		// 2. Cek "Ingatkan Saya"
		const savedEmail = localStorage.getItem('saved_email');
		if (savedEmail) {
			email = savedEmail;
			rememberMe = true;
		}
	});

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	async function handleLogin() {
		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch(`${PUBLIC_API_URL}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'ngrok-skip-browser-warning': 'true'
					// HAPUS 'Access-Control-Allow-Origin' di sini, itu tugas Backend!
				},
				body: JSON.stringify({ email, password })
			});

			const result = await response.json();

			if (response.ok) {
				// --- SIMPAN DATA PENTING ---
				const token = result.token || result.access_token;
				if (token) {
					localStorage.setItem('auth_token', token);
					if (result.user) {
						localStorage.setItem('user_data', JSON.stringify(result.user));
					}
				} else {
					throw new Error('Token tidak ditemukan dalam respon server.');
				}

				// --- LOGIKA ROLE ---
				// Sebaiknya role juga dikembalikan dari backend (result.user.role)
				// Tapi logika hardcode email ini sementara oke.
				const isAdmin =
					email === 'adminkuasa@temanisehat.com' || (result.user && result.user.role === 'admin');

				localStorage.setItem('user_role', isAdmin ? 'admin' : 'user');

				// --- LOGIKA REMEMBER ME ---
				if (rememberMe) {
					localStorage.setItem('saved_email', email);
				} else {
					localStorage.removeItem('saved_email');
				}

				// --- REDIRECT ---
				if (isAdmin) {
					await goto('/admin'); // Pakai await biar transisi smooth
				} else {
					await goto('/app/dashboard');
				}
			} else {
				errorMessage = result.message || 'Email atau password salah.';
			}
		} catch (error) {
			console.error('Error:', error);
			errorMessage = 'Gagal terhubung ke server. Cek koneksi internet.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 font-sans text-slate-800"
>
	<div
		class="absolute bottom-0 left-1/2 z-0 h-[65%] w-[150%] -translate-x-1/2 rounded-t-[100%] bg-gradient-to-t from-sky-500 to-cyan-400 shadow-[0_-10px_40px_rgba(14,165,233,0.3)]"
	></div>

	<div class="relative z-10 w-full max-w-lg p-6">
		<div class="rounded-3xl border border-slate-100 bg-white px-8 py-10 shadow-2xl">
			<div class="mb-8 text-center">
				<div
					class="mx-auto mb-4 flex h-14 w-14 rotate-3 transform items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 shadow-sm"
				>
					<span class="-rotate-3 text-2xl font-bold text-sky-500">TS</span>
				</div>
				<h2 class="text-3xl font-extrabold tracking-tight text-slate-900">Masuk Akun</h2>
				<p class="mt-2 text-sm text-slate-400">Lanjutkan perjalanan sehatmu bersama kami</p>
			</div>

			{#if errorMessage}
				<div
					class="mb-6 animate-pulse rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-500"
				>
					{errorMessage}
				</div>
			{/if}

			<form class="space-y-6" on:submit|preventDefault={handleLogin}>
				<div>
					<label for="email" class="mb-2 ml-1 block text-sm font-bold text-slate-700"
						>Email Address</label
					>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						required
						class="block w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-slate-900 placeholder-slate-400 transition-all outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
						placeholder="nama@email.com"
					/>
				</div>

				<div>
					<label for="password" class="mb-2 ml-1 block text-sm font-bold text-slate-700"
						>Password</label
					>
					<div class="relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							required
							class="block w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 pr-12 text-slate-900 placeholder-slate-400 transition-all outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
							placeholder="••••••••"
						/>

						<button
							type="button"
							on:click={togglePasswordVisibility}
							class="absolute top-1/2 right-4 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-sky-500"
						>
							{#if showPassword}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<div class="flex items-center justify-between text-sm">
					<div class="flex items-center">
						<input
							id="remember-me"
							name="remember-me"
							type="checkbox"
							bind:checked={rememberMe}
							class="h-4 w-4 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-sky-500"
						/>
						<label for="remember-me" class="ml-2 block cursor-pointer text-slate-500"
							>Ingatkan saya</label
						>
					</div>
					<a
						href="/forgot-password"
						class="font-bold text-sky-600 transition-colors hover:text-sky-500">Lupa Password?</a
					>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-4 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all hover:scale-[1.02] hover:shadow-sky-300 active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70"
				>
					{#if isLoading}
						<span class="flex items-center justify-center gap-2">
							<svg
								class="h-5 w-5 animate-spin text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Memproses...
						</span>
					{:else}
						Masuk Sekarang
					{/if}
				</button>
			</form>

			<p class="mt-8 text-center text-sm text-slate-500">
				Belum punya akun? <a
					href="/register"
					class="font-bold text-sky-600 transition-colors hover:text-sky-500">Daftar sekarang</a
				>
			</p>
		</div>
		<p class="relative z-10 mt-8 text-center text-xs font-medium text-white/80">
			&copy; 2026 Temani Sehat. All rights reserved.
		</p>
	</div>
</div>
