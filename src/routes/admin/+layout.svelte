<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { fetchApi } from '$lib/utils/api'; // Pastikan path utils benar

	async function handleLogout() {
		if (!confirm('Apakah Anda yakin ingin keluar?')) return;

		try {
			// Panggil API Logout (Method POST)
			await fetchApi('/logout', 'POST');
		} catch (error) {
			console.error('Logout error (API):', error);
			// Tetap lanjut logout di frontend walau API error (misal token udah expired duluan)
		} finally {
			// Bersihkan Data Lokal
			localStorage.removeItem('auth_token');
			localStorage.removeItem('user_data');
			localStorage.removeItem('user_role');

			// Redirect ke Login
			goto('/login');
		}
	}
</script>

<div class="flex h-screen bg-slate-50 font-sans text-slate-800">
	<aside
		class="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-100 bg-white shadow-xl shadow-slate-200/50"
	>
		<div class="flex h-20 items-center justify-center border-b border-slate-50">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-white"
				>
					TS
				</div>
				<h1
					class="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-xl font-extrabold text-transparent"
				>
					Temani Sehat
				</h1>
			</div>
		</div>

		<nav class="flex-1 space-y-1 overflow-y-auto p-4">
			<p class="mb-2 px-4 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
				Main Menu
			</p>

			{#each [{ name: 'Dashboard', href: '/admin', icon: 'fa-solid fa-house' }, { name: 'Konsultasi', href: '/admin/consultations', icon: 'fa-solid fa-user-doctor' }, { name: 'Experts', href: '/admin/experts', icon: 'fa-solid fa-users-viewfinder' }, { name: 'Produk', href: '/admin/products', icon: 'fa-solid fa-box-open' }, { name: 'Pesanan', href: '/admin/orders', icon: 'fa-solid fa-cart-shopping' }, { name: 'Konten', href: '/admin/contents', icon: 'fa-solid fa-newspaper' }] as item}
				<a
					href={item.href}
					class="group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300
                    {$page.url.pathname === item.href
						? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-200'
						: 'text-slate-500 hover:bg-slate-50 hover:text-cyan-600'}"
				>
					<i
						class="{item.icon} w-5 text-center {$page.url.pathname === item.href
							? 'text-white'
							: 'text-slate-400 group-hover:text-cyan-500'}"
					></i>
					<span>{item.name}</span>
				</a>
			{/each}
		</nav>

		<div class="border-t border-slate-50 p-4">
			<div
				class="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 shadow-sm"
			>
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-400"
					>
						<i class="fa-solid fa-user"></i>
					</div>
					<div>
						<p class="text-xs font-bold text-slate-700">Administrator</p>
						<p class="text-[10px] text-slate-400">Super Admin</p>
					</div>
				</div>

				<button
					on:click={handleLogout}
					class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
					title="Keluar"
				>
					<i class="fa-solid fa-arrow-right-from-bracket"></i>
				</button>
			</div>
		</div>
	</aside>

	<div class="ml-64 flex flex-1 flex-col">
		<main class="scrollbar-hide flex-1 overflow-y-auto bg-slate-50">
			<header
				class="relative z-10 overflow-hidden rounded-bl-[3rem] bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-700 p-10 pb-24 text-white shadow-xl shadow-cyan-900/10"
			>
				<div
					class="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"
				></div>
				<div
					class="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl"
				></div>

				<div class="relative z-10 flex items-center justify-between">
					<div>
						<h2 class="text-3xl font-extrabold tracking-tight">Assalamualaikum, Admin 👋</h2>
						<p class="mt-2 font-medium text-cyan-100">Panel Kontrol Utama Temani Sehat.</p>
					</div>
				</div>
			</header>

			<div class="relative z-20 -mt-16 px-10 pb-20">
				<slot />
			</div>
		</main>
	</div>
</div>
