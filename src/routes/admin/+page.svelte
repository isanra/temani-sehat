<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';
	import { fade } from 'svelte/transition';

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
			// Kita panggil 3 API sekaligus: Dashboard, Monitoring, DAN Experts
			const [resStats, resMonitor, resExperts] = await Promise.all([
				fetchApi('/dashboard'),
				fetchApi('/stats/monitoring'),
				fetchApi('/experts') // Kita ambil data expert biar bisa hitung sendiri
			]);

			// 1. Ambil Data Statistik Dasar
			if (resStats) {
				const data = resStats.data || resStats;
				stats = {
					total_users: data.total_users || 0,
					total_consultations: data.total_consultations || 0,
					total_orders: data.total_orders || 0,
					// Jangan percaya data active_experts dari backend dulu, nanti kita timpa
					active_experts: 0
				};
			}

			// 2. LOGIKA FIX: Hitung Manual Jumlah Expert dari List API
			if (resExperts) {
				// Pastikan format array
				const expertList = Array.isArray(resExperts) ? resExperts : resExperts.data || [];

				// Hitung jumlah Expert yang ada di list (ini pasti akurat)
				// Kalau mau yang statusnya online saja: expertList.filter((e: any) => e.is_online).length
				stats.active_experts = expertList.length;
			}

			// 3. Ambil Data Monitoring
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
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">Ringkasan Statistik</h2>
			<p class="text-sm text-gray-500">Pantau perkembangan aplikasi hari ini.</p>
		</div>
		<div
			class="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400"
		>
			{new Date().toLocaleDateString('id-ID', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		</div>
	</div>

	{#if loading}
		<div class="py-20 text-center">
			<div
				class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
			<p class="mt-4 text-sm font-medium text-gray-500">Sedang memuat data...</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" transition:fade>
			<div
				class="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
			>
				<div class="mb-1 text-sm font-medium text-gray-500">Total Pengguna</div>
				<div class="text-3xl font-bold text-blue-600">{stats.total_users}</div>
				<div class="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-blue-50 opacity-50"></div>
			</div>

			<div
				class="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
			>
				<div class="mb-1 text-sm font-medium text-gray-500">Total Konsultasi</div>
				<div class="text-3xl font-bold text-orange-500">{stats.total_consultations}</div>
				<div
					class="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-orange-50 opacity-50"
				></div>
			</div>

			<div
				class="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
			>
				<div class="mb-1 text-sm font-medium text-gray-500">Total Pesanan</div>
				<div class="text-3xl font-bold text-green-500">{stats.total_orders}</div>
				<div
					class="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-green-50 opacity-50"
				></div>
			</div>

			<div
				class="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
			>
				<div class="mb-1 text-sm font-medium text-gray-500">Ahli Aktif</div>
				<div class="text-3xl font-bold text-purple-500">{stats.active_experts}</div>
				<div
					class="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-purple-50 opacity-50"
				></div>
			</div>
		</div>

		<div
			class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
			transition:fade
		>
			<div
				class="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4"
			>
				<div>
					<h3 class="text-lg font-bold text-gray-800">Monitoring Kesehatan User</h3>
					<p class="text-xs text-gray-500">Daftar pengguna dengan risiko tinggi (High Risk)</p>
				</div>
				{#if monitoring.total_risk_users > 0}
					<span
						class="animate-pulse rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-bold text-red-600"
					>
						{monitoring.total_risk_users} Perlu Perhatian
					</span>
				{:else}
					<span
						class="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
					>
						Aman
					</span>
				{/if}
			</div>

			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead class="bg-gray-50 text-xs font-semibold tracking-wider text-gray-500 uppercase">
						<tr>
							<th class="px-6 py-3">Nama User</th>
							<th class="px-6 py-3">Email</th>
							<th class="px-6 py-3">Status</th>
							<th class="px-6 py-3 text-right">Skor Kesehatan</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 bg-white text-sm">
						{#if monitoring.data && monitoring.data.length > 0}
							{#each monitoring.data as user}
								<tr class="transition hover:bg-gray-50">
									<td class="px-6 py-4 font-medium text-gray-900">{user.name || 'Tanpa Nama'}</td>
									<td class="px-6 py-4 text-gray-600">{user.email}</td>
									<td class="px-6 py-4">
										<span
											class="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-1 text-xs font-medium text-red-600"
										>
											High Risk
										</span>
									</td>
									<td class="px-6 py-4 text-right font-mono font-bold text-red-500">
										{user.health_score || 0}%
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="4" class="bg-slate-50/30 px-6 py-12 text-center text-gray-400">
									<div class="flex flex-col items-center justify-center">
										<span class="mb-2 block text-3xl">🛡️</span>
										<p class="font-medium text-gray-600">Alhamdulillah, Aman</p>
										<p class="mt-1 text-xs">Tidak ada user berisiko tinggi saat ini.</p>
									</div>
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
