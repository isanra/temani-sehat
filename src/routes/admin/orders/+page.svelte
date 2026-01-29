<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';
	import { fade, fly } from 'svelte/transition';

	let orders: any[] = [];
	let loading = true;
	let processingId: number | null = null;

	// State untuk Tab Aktif
	// 'process' = Pending/Paid, 'shipping' = Shipped, 'history' = Completed/Cancelled
	let activeTab = 'process';

	// 1. Load Data
	async function loadOrders() {
		loading = true;
		try {
			const res = await fetchApi('/orders');

			// Handle struktur response Laravel yang dinamis
			if (res?.data?.data && Array.isArray(res.data.data)) {
				orders = res.data.data;
			} else if (res?.data && Array.isArray(res.data)) {
				orders = res.data;
			} else if (Array.isArray(res)) {
				orders = res;
			} else {
				orders = [];
			}

			// Urutkan dari yang terbaru
			if (orders.length > 0) {
				orders.sort((a, b) => b.id - a.id);
			}
		} catch (error: any) {
			console.error('Error loading orders:', error);
			orders = [];
		} finally {
			loading = false;
		}
	}

	// 2. Update Status (Pakai Endpoint yang SAMA)
	async function updateStatus(id: number, newStatus: string) {
		let confirmMsg = `Ubah status pesanan #${id}?`;

		if (newStatus === 'shipped') confirmMsg = 'Terima pesanan dan kirim barang sekarang?';
		if (newStatus === 'completed') confirmMsg = 'Pesanan sudah sampai dan selesai?';
		if (newStatus === 'cancelled') confirmMsg = 'Yakin ingin menolak/membatalkan pesanan ini?';

		if (!confirm(confirmMsg)) return;

		processingId = id;
		try {
			// Kita pakai endpoint yang sama, cuma beda body statusnya
			const body = { status: newStatus };
			await fetchApi(`/orders/${id}/status`, 'PATCH', body);

			alert('Status berhasil diperbarui!');
			await loadOrders();
		} catch (error: any) {
			console.error(error);
			alert(error.message || 'Gagal update status.');
		} finally {
			processingId = null;
		}
	}

	// --- Logic Filter Tab ---
	$: filteredOrders = orders.filter((order) => {
		const s = order.status.toLowerCase();
		if (activeTab === 'process') return s === 'pending' || s === 'paid' || s === 'unpaid';
		if (activeTab === 'shipping') return s === 'shipped';
		if (activeTab === 'history') return s === 'completed' || s === 'cancelled';
		return true;
	});

	// Helper UI
	function getStatusBadge(status: string) {
		switch (status?.toLowerCase()) {
			case 'pending':
				return 'bg-orange-50 text-orange-600 border-orange-200';
			case 'paid':
				return 'bg-blue-50 text-blue-600 border-blue-200';
			case 'shipped':
				return 'bg-purple-50 text-purple-600 border-purple-200';
			case 'completed':
				return 'bg-green-50 text-green-600 border-green-200';
			case 'cancelled':
				return 'bg-red-50 text-red-600 border-red-200';
			default:
				return 'bg-slate-50 text-slate-500';
		}
	}

	function getStatusLabel(status: string) {
		const map: any = {
			pending: 'Menunggu Bayar',
			paid: 'Siap Kirim',
			shipped: 'Dikirim',
			completed: 'Selesai',
			cancelled: 'Dibatalkan'
		};
		return map[status?.toLowerCase()] || status;
	}

	onMount(loadOrders);
</script>

<svelte:head>
	<title>Manajemen Pesanan - Admin</title>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<div class="space-y-6">
	<div
		class="flex flex-col justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 md:flex-row md:items-center"
	>
		<div>
			<h2 class="text-2xl font-bold text-gray-800">Manajemen Pesanan</h2>
			<p class="text-sm text-gray-500">Kelola arus pesanan dari masuk hingga selesai.</p>
		</div>
		<button
			on:click={loadOrders}
			class="flex h-10 w-10 items-center justify-center self-start rounded-full border border-slate-100 bg-slate-50 text-slate-500 shadow-sm transition hover:bg-blue-50 hover:text-blue-600 md:self-auto"
		>
			<i class="fa-solid fa-arrows-rotate {loading ? 'animate-spin' : ''}"></i>
		</button>
	</div>

	<div class="flex gap-2 overflow-x-auto pb-2">
		<button
			on:click={() => (activeTab = 'process')}
			class="rounded-full px-5 py-2.5 text-sm font-bold whitespace-nowrap transition {activeTab ===
			'process'
				? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
				: 'bg-white text-slate-500 hover:bg-slate-50'}"
		>
			<i class="fa-solid fa-box-open mr-2"></i> Perlu Proses
			{#if orders.filter((o) => ['pending', 'paid'].includes(o.status)).length > 0}
				<span class="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs"
					>{orders.filter((o) => ['pending', 'paid'].includes(o.status)).length}</span
				>
			{/if}
		</button>

		<button
			on:click={() => (activeTab = 'shipping')}
			class="rounded-full px-5 py-2.5 text-sm font-bold whitespace-nowrap transition {activeTab ===
			'shipping'
				? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
				: 'bg-white text-slate-500 hover:bg-slate-50'}"
		>
			<i class="fa-solid fa-truck-fast mr-2"></i> Dikirim
			{#if orders.filter((o) => o.status === 'shipped').length > 0}
				<span class="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs"
					>{orders.filter((o) => o.status === 'shipped').length}</span
				>
			{/if}
		</button>

		<button
			on:click={() => (activeTab = 'history')}
			class="rounded-full px-5 py-2.5 text-sm font-bold whitespace-nowrap transition {activeTab ===
			'history'
				? 'bg-green-600 text-white shadow-lg shadow-green-200'
				: 'bg-white text-slate-500 hover:bg-slate-50'}"
		>
			<i class="fa-solid fa-clock-rotate-left mr-2"></i> Riwayat
		</button>
	</div>

	<div
		class="min-h-[400px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50"
		transition:fade
	>
		{#if loading}
			<div class="flex h-64 flex-col items-center justify-center">
				<div
					class="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<p class="mt-4 text-sm font-medium text-gray-400">Memuat data...</p>
			</div>
		{:else if filteredOrders.length === 0}
			<div class="flex h-64 flex-col items-center justify-center text-center text-slate-400">
				<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
					<i class="fa-solid fa-clipboard-check text-2xl text-slate-300"></i>
				</div>
				<h3 class="text-lg font-medium text-gray-600">Tidak ada pesanan</h3>
				<p class="text-sm">Saat ini tidak ada pesanan di kategori ini.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead
						class="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase"
					>
						<tr>
							<th class="px-6 py-4">ID</th>
							<th class="px-6 py-4">Pelanggan</th>
							<th class="px-6 py-4">Total</th>
							<th class="px-6 py-4">Status</th>
							<th class="px-6 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-50 bg-white text-sm font-medium">
						{#each filteredOrders as item (item.id)}
							<tr class="transition hover:bg-blue-50/30">
								<td class="px-6 py-5 align-top">
									<span class="font-mono text-xs text-slate-400">#{item.id}</span>
								</td>

								<td class="px-6 py-5 align-top">
									<div class="flex items-start gap-3">
										<div
											class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400"
										>
											<i class="fa-solid fa-user text-xs"></i>
										</div>
										<div>
											<div class="font-bold text-slate-800">
												{item.user?.name || 'User #' + item.user_id}
											</div>
											<div class="mt-0.5 text-xs text-slate-400">
												{item.items ? item.items.length : 0} Barang
											</div>
											<div class="mt-1 max-w-[200px] truncate text-[10px] text-slate-400">
												{item.shipping_address || 'Alamat tidak tersedia'}
											</div>
										</div>
									</div>
								</td>

								<td class="px-6 py-5 align-top font-mono font-bold text-slate-700">
									Rp {parseInt(item.total_price || 0).toLocaleString('id-ID')}
								</td>

								<td class="px-6 py-5 align-top">
									<span
										class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${getStatusBadge(item.status)}`}
									>
										{getStatusLabel(item.status)}
									</span>
								</td>

								<td class="px-6 py-5 text-right align-top">
									{#if processingId === item.id}
										<span class="animate-pulse text-xs font-medium text-blue-500">Menyimpan...</span
										>
									{:else if activeTab === 'process'}
										<div class="flex justify-end gap-2">
											<button
												on:click={() => updateStatus(item.id, 'shipped')}
												class="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
												title="Terima & Kirim"
											>
												<i class="fa-solid fa-paper-plane"></i> Kirim
											</button>
											<button
												on:click={() => updateStatus(item.id, 'cancelled')}
												class="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
												title="Tolak Pesanan"
											>
												<i class="fa-solid fa-xmark"></i>
											</button>
										</div>
									{:else if activeTab === 'shipping'}
										<button
											on:click={() => updateStatus(item.id, 'completed')}
											class="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-green-200 transition hover:-translate-y-0.5 hover:bg-green-700"
										>
											<i class="fa-solid fa-check-double"></i> Selesai
										</button>
									{:else}
										<span class="text-xs font-bold tracking-wider text-slate-300 uppercase">
											{item.status === 'completed' ? 'Closed' : 'Void'}
										</span>
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
