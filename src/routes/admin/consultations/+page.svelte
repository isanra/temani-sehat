<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';

	let consultations: any[] = [];
	let loading = true;
	let processingId: number | null = null; // Untuk loading di tombol spesifik

	// 1. Ambil Data Konsultasi
	async function loadData() {
		loading = true;
		const res = await fetchApi('/consultations');
		// Jaga-jaga formatnya { data: [...] } atau langsung array
		consultations = Array.isArray(res) ? res : res?.data || [];

		// Sorting: Taruh yang 'pending' di paling atas biar admin notice
		consultations.sort((a, b) => (a.status === 'pending' ? -1 : 1));

		loading = false;
	}

	// 2. Update Status (Terima / Tolak / Selesai)
	async function updateStatus(id: number, newStatus: string) {
		if (!confirm(`Ubah status menjadi "${newStatus}"?`)) return;

		processingId = id; // Aktifkan loading di tombol baris ini
		try {
			const body = { status: newStatus };
			// Sesuai Postman pakai PUT
			await fetchApi(`/consultations/${id}/status`, 'PUT', body);

			// Refresh data tanpa reload page
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
				return 'bg-yellow-100 text-yellow-700 border-yellow-200';
			case 'confirmed':
				return 'bg-blue-100 text-blue-700 border-blue-200';
			case 'done':
				return 'bg-green-100 text-green-700 border-green-200';
			case 'cancelled':
				return 'bg-red-100 text-red-700 border-red-200';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	// Helper: Label Status Bahasa Indonesia
	function getStatusLabel(status: string) {
		const labels: any = {
			pending: 'Menunggu Konfirmasi',
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
	<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
		<h2 class="text-xl font-bold text-gray-800">Daftar Konsultasi</h2>
		<p class="text-sm text-gray-500">Setujui booking dari pasien yang masuk.</p>
	</div>

	<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
		{#if loading}
			<div class="animate-pulse p-8 text-center text-gray-500">Memuat data konsultasi...</div>
		{:else if consultations.length === 0}
			<div class="p-10 text-center text-gray-400">Belum ada booking konsultasi.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead class="bg-gray-50 text-xs font-semibold tracking-wider text-gray-600 uppercase">
						<tr>
							<th class="px-6 py-4">Pasien</th>
							<th class="px-6 py-4">Dokter / Ahli</th>
							<th class="px-6 py-4">Jadwal</th>
							<th class="px-6 py-4">Status</th>
							<th class="px-6 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each consultations as item}
							<tr class="transition hover:bg-blue-50/50">
								<td class="px-6 py-4">
									<div class="font-medium text-gray-900">
										{item.user?.name || 'User #' + item.user_id}
									</div>
									<div class="text-xs text-gray-500">Keluhan: {item.complaint || '-'}</div>
								</td>

								<td class="px-6 py-4 text-gray-600">
									{item.expert?.name || 'Expert #' + item.expert_id}
								</td>

								<td class="px-6 py-4 text-sm text-gray-600">
									<div class="font-medium">{item.date || 'TBA'}</div>
									<div class="text-xs">{item.time || ''}</div>
								</td>

								<td class="px-6 py-4">
									<span
										class={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadge(item.status)}`}
									>
										{getStatusLabel(item.status)}
									</span>
								</td>

								<td class="px-6 py-4 text-right">
									{#if processingId === item.id}
										<span class="text-xs text-gray-400">Loading...</span>
									{:else if item.status === 'pending'}
										<div class="flex justify-end gap-2">
											<button
												on:click={() => updateStatus(item.id, 'confirmed')}
												class="rounded-lg bg-green-100 px-3 py-1 text-xs font-medium text-green-700 transition hover:bg-green-200"
												title="Terima Booking"
											>
												✓ Terima
											</button>
											<button
												on:click={() => updateStatus(item.id, 'cancelled')}
												class="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100"
												title="Tolak Booking"
											>
												✕ Tolak
											</button>
										</div>
									{:else if item.status === 'confirmed'}
										<button
											on:click={() => updateStatus(item.id, 'done')}
											class="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
										>
											Selesaikan
										</button>
									{:else}
										<span class="text-xs text-gray-400">-</span>
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
