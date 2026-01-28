<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';
	import { fade } from 'svelte/transition';

	let orders: any[] = [];
	let loading = true;
	let processingId: number | null = null;

	// 1. Ambil Data Pesanan
	async function loadOrders() {
		loading = true;
		try {
			const res = await fetchApi('/orders');
			orders = Array.isArray(res) ? res : res?.data || [];

			// Urutkan: Pesanan baru (paid/pending) paling atas
			orders.sort((a, b) => {
				const priority = ['paid', 'pending'];
				if (priority.includes(a.status) && !priority.includes(b.status)) return -1;
				if (!priority.includes(a.status) && priority.includes(b.status)) return 1;
				return 0;
			});
		} catch (error) {
			console.error('Gagal load orders:', error);
			orders = [];
		} finally {
			loading = false;
		}
	}

	// 2. Update Status Pesanan (PATCH)
	async function updateStatus(id: number, newStatus: string) {
		let confirmMsg = `Ubah status menjadi "${newStatus}"?`;
		if (newStatus === 'shipped') confirmMsg = 'Konfirmasi barang sudah dikirim?';

		if (!confirm(`Pesanan #${id}: ${confirmMsg}`)) return;

		processingId = id;
		try {
			const body = { status: newStatus };
			await fetchApi(`/orders/${id}/status`, 'PATCH', body);
			await loadOrders(); // Refresh data
		} catch (error) {
			console.error(error);
			alert('Gagal update status pesanan.');
		} finally {
			processingId = null;
		}
	}

	// Helper: Warna Badge Status
	function getStatusBadge(status: string) {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'bg-slate-100 text-slate-600';
			case 'paid':
				return 'bg-yellow-50 text-yellow-700 border border-yellow-100'; // Udah bayar, perlu dikirim
			case 'shipped':
				return 'bg-blue-50 text-blue-700 border border-blue-100'; // Sedang dikirim
			case 'completed':
				return 'bg-green-50 text-green-700 border border-green-100'; // Sampai/Selesai
			case 'cancelled':
				return 'bg-red-50 text-red-700 border border-red-100';
			default:
				return 'bg-slate-50 text-slate-500';
		}
	}

	// Helper: Label Bahasa Indonesia
	function getStatusLabel(status: string) {
		const map: any = {
			pending: 'Belum Bayar',
			paid: 'Siap Kirim',
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
	<div
		class="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50"
	>
		<div>
			<h2 class="text-2xl font-bold text-gray-800">Daftar Pesanan</h2>
			<p class="text-sm text-gray-500">Pantau status pembayaran dan pengiriman barang.</p>
		</div>
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
				<p class="mt-4 text-sm font-medium text-gray-500">Memuat pesanan...</p>
			</div>
		{:else if orders.length === 0}
			<div class="flex flex-col items-center p-16 text-center text-slate-400">
				<i class="fa-solid fa-cart-arrow-down mb-3 text-4xl text-slate-300"></i>
				<h3 class="text-lg font-medium text-gray-600">Belum ada pesanan</h3>
				<p class="text-sm">Pesanan baru akan muncul di sini.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead
						class="bg-slate-50/50 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase"
					>
						<tr>
							<th class="px-8 py-4">Order ID</th>
							<th class="px-8 py-4">Pembeli</th>
							<th class="px-8 py-4">Total</th>
							<th class="px-8 py-4">Status</th>
							<th class="px-8 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-50 bg-white text-sm font-medium">
						{#each orders as item}
							<tr class="transition hover:bg-slate-50/50">
								<td class="px-8 py-5">
									<span
										class="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-500"
										>#{item.id}</span
									>
								</td>

								<td class="px-8 py-5">
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400"
										>
											<i class="fa-solid fa-user text-xs"></i>
										</div>
										<div>
											<div class="font-bold text-slate-800">
												{item.user?.name || 'User #' + item.user_id}
											</div>
											<div class="text-xs text-slate-400">{item.items_count || 0} Barang</div>
										</div>
									</div>
								</td>

								<td class="px-8 py-5 font-mono font-bold text-slate-700">
									Rp {parseInt(item.total_price || 0).toLocaleString('id-ID')}
								</td>

								<td class="px-8 py-5">
									<span
										class={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${getStatusBadge(item.status)}`}
									>
										{getStatusLabel(item.status)}
									</span>
								</td>

								<td class="px-8 py-5 text-right">
									{#if processingId === item.id}
										<span class="animate-pulse text-xs font-medium text-slate-400"
											>Memproses...</span
										>
									{:else if item.status === 'paid'}
										<button
											on:click={() => updateStatus(item.id, 'shipped')}
											class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
										>
											<i class="fa-solid fa-truck-fast"></i> Kirim Barang
										</button>
									{:else if item.status === 'shipped'}
										<button
											on:click={() => updateStatus(item.id, 'completed')}
											class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-green-200 transition hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-lg"
										>
											<i class="fa-solid fa-check-double"></i> Selesai
										</button>
									{:else if item.status === 'pending'}
										<button
											on:click={() => updateStatus(item.id, 'cancelled')}
											class="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
										>
											<i class="fa-solid fa-ban"></i> Batal
										</button>
									{:else}
										<span class="text-xs font-bold tracking-wider text-slate-300 uppercase"
											>Selesai</span
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
