<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';
	import { fade, fly } from 'svelte/transition';

	let consultations: any[] = [];
	let loading = true;
	let processingId: number | null = null;

	// State Modal Detail
	let showDetailModal = false;
	let selectedItem: any = null;

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
		// Konfirmasi dulu
		const label =
			newStatus === 'confirmed' ? 'Setujui' : newStatus === 'cancelled' ? 'Tolak' : 'Selesaikan';
		if (!confirm(`Yakin ingin ${label} konsultasi ini?`)) return;

		processingId = id;
		try {
			const body = { status: newStatus };
			// Method PUT untuk update status
			await fetchApi(`/consultations/${id}/status`, 'PUT', body);

			// Refresh data & tutup modal
			await loadData();
			closeModal();
			alert(`Berhasil mengubah status menjadi: ${getStatusLabel(newStatus)}`);
		} catch (error) {
			console.error(error);
			alert('Gagal mengupdate status.');
		} finally {
			processingId = null;
		}
	}

	// Helper: Buka Modal Detail
	function openDetail(item: any) {
		selectedItem = item;
		showDetailModal = true;
	}

	function closeModal() {
		showDetailModal = false;
		selectedItem = null;
	}

	// Helper: Warna Badge Status
	function getStatusBadge(status: string) {
		switch (status?.toLowerCase()) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-700 border-yellow-200';
			case 'confirmed':
				return 'bg-blue-100 text-blue-700 border-blue-200';
			case 'done':
				return 'bg-green-100 text-green-700 border-green-200';
			case 'cancelled':
				return 'bg-red-100 text-red-700 border-red-200';
			default:
				return 'bg-gray-100 text-gray-600 border-gray-200';
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
		return labels[status?.toLowerCase()] || status;
	}

	onMount(loadData);
</script>

<svelte:head>
	<title>Jadwal Konsultasi - Admin</title>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<div class="space-y-6">
	<div
		class="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50"
	>
		<div>
			<h2 class="text-2xl font-bold text-gray-800">Daftar Konsultasi</h2>
			<p class="text-sm text-gray-500">Kelola booking dan jadwal konsultasi pasien.</p>
		</div>
		<button
			on:click={loadData}
			class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
			title="Refresh Data"
		>
			<i class="fa-solid fa-arrows-rotate {loading ? 'animate-spin' : ''}"></i>
		</button>
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
								<td class="group cursor-pointer px-8 py-5" on:click={() => openDetail(item)}>
									<div class="font-bold text-slate-800 transition group-hover:text-blue-600">
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
										<span class="font-medium text-slate-700"
											>{item.schedule_date
												? new Date(item.schedule_date).toLocaleDateString('id-ID')
												: 'TBA'}</span
										>
										<span class="text-xs text-slate-400"
											>{item.schedule_date
												? new Date(item.schedule_date).toLocaleTimeString('id-ID', {
														hour: '2-digit',
														minute: '2-digit'
													})
												: ''}</span
										>
									</div>
								</td>

								<td class="px-8 py-5">
									<span
										class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${getStatusBadge(item.status)}`}
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
									{:else}
										<button
											on:click={() => openDetail(item)}
											class="text-xs font-bold text-blue-500 hover:underline">Lihat Detail</button
										>
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

{#if showDetailModal && selectedItem}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
	>
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" on:click={closeModal}></div>

		<div
			class="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
			transition:fly={{ y: 20, duration: 300 }}
		>
			<div
				class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5"
			>
				<div>
					<h3 class="text-lg font-extrabold text-slate-800">Detail Konsultasi</h3>
					<p class="text-xs text-slate-500">ID: #{selectedItem.id}</p>
				</div>
				<button on:click={closeModal} class="text-slate-400 transition hover:text-red-500">
					<i class="fa-solid fa-xmark text-xl"></i>
				</button>
			</div>

			<div class="space-y-6 p-8">
				<div class="flex justify-center">
					<span
						class={`rounded-full border px-4 py-1.5 text-sm font-bold ${getStatusBadge(selectedItem.status)}`}
					>
						Status: {getStatusLabel(selectedItem.status)}
					</span>
				</div>

				<div class="grid grid-cols-2 gap-6">
					<div>
						<label class="mb-1 block text-xs font-bold text-slate-400 uppercase">Pasien</label>
						<div class="font-medium text-slate-800">{selectedItem.user?.name || '-'}</div>
						<div class="text-xs text-slate-500">{selectedItem.user?.email || '-'}</div>
					</div>
					<div>
						<label class="mb-1 block text-xs font-bold text-slate-400 uppercase"
							>Dokter / Ahli</label
						>
						<div class="font-medium text-slate-800">{selectedItem.expert?.name || '-'}</div>
						<div class="text-xs text-slate-500">{selectedItem.expert?.category || '-'}</div>
					</div>
				</div>

				<div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
					<label class="mb-2 block text-xs font-bold text-slate-400 uppercase"
						>Keluhan / Catatan</label
					>
					<p class="text-sm text-slate-700 italic">
						"{selectedItem.complaint || 'Tidak ada catatan keluhan.'}"
					</p>
				</div>

				<div>
					<label class="mb-1 block text-xs font-bold text-slate-400 uppercase">Jadwal Rencana</label
					>
					<div class="flex items-center gap-2 text-slate-800">
						<i class="fa-regular fa-clock text-blue-500"></i>
						<span class="font-medium">
							{selectedItem.schedule_date
								? new Date(selectedItem.schedule_date).toLocaleString('id-ID', {
										dateStyle: 'full',
										timeStyle: 'short'
									})
								: 'Belum ditentukan'}
						</span>
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
				{#if selectedItem.status === 'pending'}
					<button
						on:click={() => updateStatus(selectedItem.id, 'cancelled')}
						class="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
					>
						Tolak
					</button>
					<button
						on:click={() => updateStatus(selectedItem.id, 'confirmed')}
						class="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
					>
						Setujui Konsultasi
					</button>
				{:else if selectedItem.status === 'confirmed'}
					<button
						on:click={() => updateStatus(selectedItem.id, 'done')}
						class="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-200 hover:bg-green-700"
					>
						<i class="fa-solid fa-check-double mr-2"></i> Tandai Selesai
					</button>
				{:else}
					<button
						on:click={closeModal}
						class="w-full rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-300"
					>
						Tutup
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
