<script>
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/userStore.svelte.js';

	let userData = $state({
		name: 'Pengguna',
		package: 'Basic',
		photoUrl: null,
		initials: 'TS'
	});

	// AMBIL SKOR MURNI DARI STORE (0-100)
	// Tidak perlu dihitung manual lagi, karena Dashboard sudah kirim angka jadinya.
	let progressPercent = $derived(userStore.score);

	onMount(() => {
		const storedUser = localStorage.getItem('user_data');
		if (storedUser) {
			try {
				const parsed = JSON.parse(storedUser);
				userData.name = parsed.name || 'Pengguna';
				userData.package = parsed.is_premium ? 'Premium' : 'Free Plan';
				userData.photoUrl = parsed.photo_url || null;

				if (userData.name) {
					const parts = userData.name.trim().split(' ');
					userData.initials =
						parts.length >= 2
							? (parts[0][0] + parts[1][0]).toUpperCase()
							: userData.name.slice(0, 2).toUpperCase();
				}
			} catch (e) {
				console.error(e);
			}
		}
	});
</script>

<header
	class="relative overflow-hidden rounded-b-[3rem] bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-700 px-8 pt-12 pb-28 text-white shadow-2xl transition-all duration-500"
>
	<div
		class="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
	></div>

	<div class="relative z-10 mx-auto max-w-4xl">
		<div class="flex items-start justify-between">
			<div>
				<div class="mb-1 flex items-center gap-2">
					<p class="text-lg font-medium text-cyan-100">Assalamualaikum,</p>
					<span
						class="rounded-full border border-orange-300 bg-orange-400/90 px-3 py-1 text-xs font-bold text-white shadow-sm"
					>
						{userData.package}
					</span>
				</div>
				<h1
					class="mb-2 max-w-[250px] truncate text-4xl font-extrabold tracking-tight md:max-w-md md:text-5xl"
				>
					{userData.name}
				</h1>
			</div>

			<a
				href="/app/profile"
				class="cursor-pointer rounded-full bg-white/20 p-2 backdrop-blur-md transition hover:bg-white/30"
			>
				{#if userData.photoUrl}
					<img
						src={userData.photoUrl}
						alt={userData.name}
						class="h-14 w-14 rounded-full border-2 border-white/50 object-cover shadow-sm"
					/>
				{:else}
					<div
						class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/50 bg-cyan-50 text-xl font-bold text-cyan-600 shadow-sm"
					>
						{userData.initials}
					</div>
				{/if}
			</a>
		</div>

		<div
			class="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-md transition-all hover:bg-black/30"
		>
			<div class="mb-2 flex items-end justify-between px-1">
				<p class="text-lg font-medium text-cyan-50">Skor Sehat Hari Ini</p>
				<p class="text-3xl font-extrabold text-orange-300">
					{progressPercent}<span class="text-lg font-medium text-white/70">%</span>
				</p>
			</div>

			<div class="h-4 w-full overflow-hidden rounded-full bg-black/20 shadow-inner">
				<div
					class="h-4 rounded-full shadow-[0_0_15px_rgba(251,146,60,0.6)] transition-all duration-1000 ease-out
                    {progressPercent < 50
						? 'bg-red-500'
						: 'bg-gradient-to-r from-orange-400 to-green-400'}"
					style="width: {progressPercent}%"
				></div>
			</div>

			{#if progressPercent < 50}
				<p class="mt-2 animate-pulse px-1 text-xs font-bold text-red-200">
					⚠️ Skor masih rendah, yuk kejar targetmu!
				</p>
			{/if}
		</div>
	</div>
</header>
