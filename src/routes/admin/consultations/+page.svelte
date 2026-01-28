<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';
	import { fade } from 'svelte/transition';

	let consultations: any[] = [];
	let loading = true;
	let processingId: number | null = null;

	// 1. Ambil Data Konsultasi
	async function loadData() {
		loading = true;
		const res = await fetchApi('/consultations');
		consultations = Array.isArray(res) ? res : res?.data || [];
		consultations.sort((a, b) => (a.status === 'pending' ? -1 : 1));
		loading = false;
	}

	// 2. Update Status
	async function updateStatus(id: number, newStatus: string) {
		if (!confirm(`Ubah status menjadi "${newStatus}"?`)) return;
		processingId = id;
		try {
			const body = { status: newStatus };
			await fetchApi(`/consultations/${id}/status`, 'PUT', body);
			await loadData();
		} catch (error) {
			console.error(error);
			alert('Gagal mengupdate status.');
		} finally {
			processingId = null;
		}
	}

	// Helper: Warna Badge Status
	function getStatusBadge(status: string) {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-700';
			case 'confirmed':
				return 'bg-blue-100 text-blue-700';
			case 'done':
				return 'bg-green-100 text-green-700';
			case 'cancelled':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	// Helper: Label Status
	function getStatusLabel(status: string) {
		const labels: any = {
			pending: 'Menunggu',
			confirmed: 'Disetujui',
			done: 'Selesai',
			cancelled: 'Dibatalkan'
		};
		return labels[status.toLowerCase()] || status;
	}

	onMount(loadData);
</script>

<svelte:head>
	<title>Jadwal Konsultasi - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div
		class="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50"
	>
		<div>
			<h2 class="text-2xl font-bold text-gray-800">Daftar Konsultasi</h2>
			<p class="text-sm text-gray-500">Kelola booking dan jadwal konsultasi pasien.</p>
		</div>
		<div class="flex gap-2"></div>
	</div>

	<div
		class="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50"
		transition:fade
	>
		{#if loading}
			<div class="py-20 text-center">
				<div
					class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<p class="mt-4 text-sm font-medium text-gray-500">Memuat data...</p>
			</div>
		{:else if consultations.length === 0}
			<div class="py-20 text-center">
				<div
					class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300"
				>
					<i class="fa-regular fa-calendar-xmark text-3xl"></i>
				</div>
				<p class="font-medium text-gray-500">Belum ada booking konsultasi.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead
						class="bg-slate-50/50 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase"
					>
						<tr>
							<th class="px-8 py-4">Pasien</th>
							<th class="px-8 py-4">Dokter / Ahli</th>
							<th class="px-8 py-4">Jadwal</th>
							<th class="px-8 py-4">Status</th>
							<th class="px-8 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-50 bg-white text-sm">
						{#each consultations as item}
							<tr class="transition hover:bg-slate-50/50">
								<td class="px-8 py-5">
									<div class="font-bold text-slate-800">
										{item.user?.name || 'User #' + item.user_id}
									</div>
									<div
										class="mt-1 line-clamp-1 max-w-[200px] text-xs text-slate-500"
										title={item.complaint}
									>
										Keluhan: {item.complaint || '-'}
									</div>
								</td>

								<td class="px-8 py-5">
									<div class="flex items-center gap-2">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600"
										>
											<i class="fa-solid fa-user-doctor text-xs"></i>
										</div>
										<span class="font-medium text-slate-700"
											>{item.expert?.name || 'Expert #' + item.expert_id}</span
										>
									</div>
								</td>

								<td class="px-8 py-5">
									<div class="flex flex-col">
										<span class="font-medium text-slate-700">{item.date || 'TBA'}</span>
										<span class="text-xs text-slate-400">{item.time || ''}</span>
									</div>
								</td>

								<td class="px-8 py-5">
									<span
										class={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${getStatusBadge(item.status)}`}
									>
										{getStatusLabel(item.status)}
									</span>
								</td>

								<td class="px-8 py-5 text-right">
									{#if processingId === item.id}
										<span class="animate-pulse text-xs font-medium text-slate-400"
											>Memproses...</span
										>
									{:else if item.status === 'pending'}
										<div class="flex justify-end gap-2">
											<button
												on:click={() => updateStatus(item.id, 'confirmed')}
												class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:bg-green-500 hover:text-white hover:shadow-md hover:shadow-green-200"
												title="Terima Booking"
											>
												<i class="fa-solid fa-check"></i>
											</button>
											<button
												on:click={() => updateStatus(item.id, 'cancelled')}
												class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-500 hover:text-white hover:shadow-md hover:shadow-red-200"
												title="Tolak Booking"
											>
												<i class="fa-solid fa-xmark"></i>
											</button>
										</div>
									{:else if item.status === 'confirmed'}
										<button
											on:click={() => updateStatus(item.id, 'done')}
											class="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-500 hover:text-white"
										>
											Selesaikan
										</button>
									{:else}
										<span class="text-xs font-medium text-slate-300">Selesai</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
