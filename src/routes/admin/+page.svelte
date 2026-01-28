<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';
	import { fade, slide } from 'svelte/transition';

	let stats: any = {
		total_users: 0,
		total_consultations: 0,
		total_orders: 0,
		active_experts: 0
	};

	let monitoring: any = {
		total_risk_users: 0,
		data: []
	};

	let loading = true;

	onMount(async () => {
		try {
			// Panggil 3 API sekaligus
			const [resStats, resMonitor, resExperts] = await Promise.all([
				fetchApi('/dashboard'),
				fetchApi('/stats/monitoring'),
				fetchApi('/experts')
			]);

			// 1. Data Statistik
			if (resStats) {
				const data = resStats.data || resStats;
				stats = {
					total_users: data.total_users || 0,
					total_consultations: data.total_consultations || 0,
					total_orders: data.total_orders || 0,
					active_experts: 0
				};
			}

			// 2. Data Experts (Hitung manual array length)
			if (resExperts) {
				const expertList = Array.isArray(resExperts) ? resExperts : resExperts.data || [];
				stats.active_experts = expertList.length;
			}

			// 3. Data Monitoring
			if (resMonitor) {
				const monitorData = resMonitor.data || resMonitor;
				monitoring = {
					total_risk_users: monitorData.total_risk_users || 0,
					data: Array.isArray(monitorData.data) ? monitorData.data : []
				};
			}
		} catch (error) {
			console.error('Gagal memuat dashboard:', error);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Dashboard - Temani Sehat</title>
</svelte:head>

<div class="space-y-8">
	{#if loading}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			{#each Array(4) as _}
				<div class="h-32 animate-pulse rounded-3xl bg-slate-200"></div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" in:fade>
			<div
				class="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-2xl"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white"
				>
					<i class="fa-solid fa-users text-xl"></i>
				</div>
				<div class="relative z-10">
					<p class="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Pengguna</p>
					<h3 class="mt-1 text-3xl font-black text-slate-800">{stats.total_users}</h3>
				</div>
				<div
					class="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-blue-50/50 transition-transform group-hover:scale-150"
				></div>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-2xl"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-500 group-hover:text-white"
				>
					<i class="fa-solid fa-comments text-xl"></i>
				</div>
				<div class="relative z-10">
					<p class="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Konsultasi</p>
					<h3 class="mt-1 text-3xl font-black text-slate-800">{stats.total_consultations}</h3>
				</div>
				<div
					class="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-orange-50/50 transition-transform group-hover:scale-150"
				></div>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-2xl"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-500 group-hover:text-white"
				>
					<i class="fa-solid fa-cart-shopping text-xl"></i>
				</div>
				<div class="relative z-10">
					<p class="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Pesanan</p>
					<h3 class="mt-1 text-3xl font-black text-slate-800">{stats.total_orders}</h3>
				</div>
				<div
					class="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-green-50/50 transition-transform group-hover:scale-150"
				></div>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-2xl"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-500 group-hover:text-white"
				>
					<i class="fa-solid fa-user-doctor text-xl"></i>
				</div>
				<div class="relative z-10">
					<p class="text-xs font-bold tracking-wider text-slate-400 uppercase">Ahli Aktif</p>
					<h3 class="mt-1 text-3xl font-black text-slate-800">{stats.active_experts}</h3>
				</div>
				<div
					class="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-purple-50/50 transition-transform group-hover:scale-150"
				></div>
			</div>
		</div>
	{/if}

	<div
		class="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50"
		in:slide
	>
		<div class="flex items-center justify-between border-b border-slate-50 bg-white px-8 py-6">
			<div>
				<h3 class="text-lg font-extrabold text-slate-800">Monitoring Kesehatan User</h3>
				<p class="mt-1 text-xs font-medium text-slate-400">
					Daftar pengguna dengan risiko tinggi (High Risk)
				</p>
			</div>

			{#if monitoring.total_risk_users > 0}
				<span
					class="flex animate-pulse items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600"
				>
					<i class="fa-solid fa-triangle-exclamation"></i>
					{monitoring.total_risk_users} Perlu Perhatian
				</span>
			{:else}
				<span
					class="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-600"
				>
					<i class="fa-solid fa-shield-check"></i> Semua Aman
				</span>
			{/if}
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead
					class="bg-slate-50/50 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase"
				>
					<tr>
						<th class="px-8 py-4">Nama User</th>
						<th class="px-8 py-4">Email</th>
						<th class="px-8 py-4">Status Kesehatan</th>
						<th class="px-8 py-4 text-right">Skor Risiko</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-50 bg-white text-sm font-medium">
					{#if loading}
						<tr
							><td colspan="4" class="px-8 py-10 text-center text-slate-400">Memuat data...</td></tr
						>
					{:else if monitoring.data && monitoring.data.length > 0}
						{#each monitoring.data as user}
							<tr class="transition hover:bg-slate-50/50">
								<td class="px-8 py-5">
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400"
										>
											<i class="fa-solid fa-user text-xs"></i>
										</div>
										<span class="text-slate-700">{user.name || 'Tanpa Nama'}</span>
									</div>
								</td>
								<td class="px-8 py-5 text-slate-500">{user.email}</td>
								<td class="px-8 py-5">
									<span
										class="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-red-500 uppercase"
									>
										High Risk
									</span>
								</td>
								<td class="px-8 py-5 text-right font-mono font-bold text-red-500">
									{user.health_score || 0}%
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="4" class="px-8 py-16 text-center">
								<div class="flex flex-col items-center justify-center text-slate-300">
									<i class="fa-solid fa-clipboard-check mb-3 text-4xl"></i>
									<p class="font-bold text-slate-400">Alhamdulillah, Aman</p>
									<p class="text-xs">Tidak ada user berisiko tinggi saat ini.</p>
								</div>
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
