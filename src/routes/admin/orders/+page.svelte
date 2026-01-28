<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';

	let orders: any[] = [];
	let loading = true;
	let processingId: number | null = null;

	// 1. Ambil Data Pesanan
	async function loadOrders() {
		loading = true;
		// Asumsi ada endpoint GET /orders untuk list semua pesanan
		const res = await fetchApi('/orders');
		orders = Array.isArray(res) ? res : res?.data || [];

		// Urutkan: Pesanan baru (paid/pending) paling atas
		orders.sort((a, b) => {
			const priority = ['paid', 'pending'];
			if (priority.includes(a.status) && !priority.includes(b.status)) return -1;
			if (!priority.includes(a.status) && priority.includes(b.status)) return 1;
			return 0;
		});

		loading = false;
	}

	// 2. Update Status Pesanan (PATCH)
	async function updateStatus(id: number, newStatus: string) {
		let confirmMsg = `Ubah status menjadi "${newStatus}"?`;
		if (newStatus === 'shipped') confirmMsg = 'Konfirmasi barang sudah dikirim?';

		if (!confirm(`Pesanan #${id}: ${confirmMsg}`)) return;

		processingId = id;
		try {
			const body = { status: newStatus };
			// Perhatikan method PATCH sesuai Postman
			await fetchApi(`/orders/${id}/status`, 'PATCH', body);

			await loadOrders(); // Refresh data
		} catch (error) {
			console.error(error);
			alert('Gagal update status pesanan.');
		} finally {
			processingId = null;
		}
	}

	// Helper: Warna Status
	function getStatusBadge(status: string) {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'bg-gray-100 text-gray-600';
			case 'paid':
				return 'bg-yellow-100 text-yellow-700 border-yellow-200'; // Udah bayar, perlu dikirim
			case 'shipped':
				return 'bg-blue-100 text-blue-700 border-blue-200'; // Sedang dikirim
			case 'completed':
				return 'bg-green-100 text-green-700 border-green-200'; // Sampai/Selesai
			case 'cancelled':
				return 'bg-red-100 text-red-700 border-red-200';
			default:
				return 'bg-gray-50 text-gray-500';
		}
	}

	// Helper: Label Bahasa Indonesia
	function getStatusLabel(status: string) {
		const map: any = {
			pending: 'Belum Bayar',
			paid: 'Dibayar (Perlu Kirim)',
			shipped: 'Dikirim',
			completed: 'Selesai',
			cancelled: 'Dibatalkan'
		};
		return map[status.toLowerCase()] || status;
	}

	onMount(loadOrders);
</script>

<svelte:head>
	<title>Pesanan Masuk - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
		<h2 class="text-xl font-bold text-gray-800">Daftar Pesanan</h2>
		<p class="text-sm text-gray-500">Pantau dan kelola pengiriman barang.</p>
	</div>

	<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
		{#if loading}
			<div class="animate-pulse p-8 text-center text-gray-500">Memuat pesanan...</div>
		{:else if orders.length === 0}
			<div class="p-10 text-center text-gray-400">Belum ada pesanan masuk.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead class="bg-gray-50 text-xs font-semibold tracking-wider text-gray-600 uppercase">
						<tr>
							<th class="px-6 py-4">Order ID</th>
							<th class="px-6 py-4">Pembeli</th>
							<th class="px-6 py-4">Total</th>
							<th class="px-6 py-4">Status</th>
							<th class="px-6 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each orders as item}
							<tr class="transition hover:bg-blue-50/50">
								<td class="px-6 py-4 font-mono text-sm text-gray-500">#{item.id}</td>

								<td class="px-6 py-4">
									<div class="font-medium text-gray-900">
										{item.user?.name || 'User #' + item.user_id}
									</div>
									<div class="text-xs text-gray-500">{item.items_count || 0} Barang</div>
								</td>

								<td class="px-6 py-4 font-semibold text-gray-900">
									Rp {parseInt(item.total_price || 0).toLocaleString('id-ID')}
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
									{:else if item.status === 'paid'}
										<button
											on:click={() => updateStatus(item.id, 'shipped')}
											class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
										>
											📦 Kirim Barang
										</button>
									{:else if item.status === 'shipped'}
										<button
											on:click={() => updateStatus(item.id, 'completed')}
											class="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-green-700"
										>
											✅ Selesai
										</button>
									{:else if item.status === 'pending'}
										<button
											on:click={() => updateStatus(item.id, 'cancelled')}
											class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
										>
											Batal
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
