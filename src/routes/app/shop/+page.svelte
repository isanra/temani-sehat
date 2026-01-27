<script>
	import { onMount } from 'svelte';
	import { fade, slide, scale, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	import Navbar from '$lib/components/Navbar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	// --- CONFIG ---
	const API_BASE = 'https://nondeprecatively-overdiligent-sonja.ngrok-free.dev/api';

	// --- STATE ---
	let activeTab = $state('shop'); // 'shop' | 'orders'
	let products = $state([]);
	let myOrders = $state([]);
	let isLoading = $state(false);
	let searchQuery = $state('');
	let selectedCategory = $state('Semua');

	// DETAIL & CART STATE
	let selectedProduct = $state(null);
	let showCartModal = $state(false);
	let cart = $state([]);
	let shippingAddress = $state('');

	// PAYMENT STATE
	let selectedOrderToPay = $state(null);
	let paymentFile = $state(null);

	// KATEGORI
	let categories = [
		'Semua',
		'Makanan Sehat',
		'Obat',
		'Alkes',
		'COWAY',
		'Perabot',
		'Anti radiasi',
		'Fitnes'
	];

	// --- DATA DUMMY (FALLBACK) ---
	const dummyProducts = [
		{
			id: 1,
			name: 'Vitamin C 1000mg IPI',
			category: 'Obat',
			price: 50000,
			rating: 4.8,
			sold: 1200,
			image_url:
				'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
			description: 'Suplemen Vitamin C dosis tinggi.'
		},
		{
			id: 2,
			name: 'Granola Bites Chocolate',
			category: 'Makanan Sehat',
			price: 65000,
			rating: 4.9,
			sold: 850,
			image_url:
				'https://images.unsplash.com/photo-1517427294546-5aa121f6cc90?auto=format&fit=crop&q=80&w=400',
			description: 'Camilan sehat rendah kalori.'
		},
		{
			id: 3,
			name: 'Omron Tensimeter',
			category: 'Alkes',
			price: 450000,
			rating: 5.0,
			sold: 300,
			image_url:
				'https://images.unsplash.com/photo-1631549916768-4119b2d3f9e2?auto=format&fit=crop&q=80&w=400',
			description: 'Alat pengukur tekanan darah digital.'
		},
		{
			id: 4,
			name: 'COWAY Air Purifier',
			category: 'COWAY',
			price: 3500000,
			rating: 5.0,
			sold: 45,
			image_url:
				'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=400',
			description: 'Penjernih udara HEPA Filter.'
		},
		{
			id: 5,
			name: 'Yoga Mat Anti-Slip',
			category: 'Fitnes',
			price: 120000,
			rating: 4.7,
			sold: 2100,
			image_url:
				'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=400',
			description: 'Matras yoga nyaman.'
		},
		{
			id: 6,
			name: 'Kacamata Anti Radiasi',
			category: 'Anti radiasi',
			price: 150000,
			rating: 4.6,
			sold: 540,
			image_url:
				'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=400',
			description: 'Melindungi mata dari sinar biru.'
		}
	];

	// --- COMPUTED ---
	let filteredProducts = $derived(
		products.filter((p) => {
			const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
			const matchSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
			return matchCat && matchSearch;
		})
	);

	let cartTotal = $derived(
		cart.reduce((total, item) => total + parsePrice(item.product.price) * item.quantity, 0)
	);

	// --- INIT ---
	onMount(async () => {
		await fetchProducts();
	});

	// --- API ACTIONS ---
	async function fetchProducts() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE}/products`, {
				headers: { 'ngrok-skip-browser-warning': 'true' }
			});
			const result = await res.json();
			products = res.ok && result.data && result.data.length > 0 ? result.data : dummyProducts;
		} catch (e) {
			products = dummyProducts;
		} finally {
			isLoading = false;
		}
	}

	async function handleCheckout() {
		if (cart.length === 0) return alert('Keranjang kosong!');
		if (!shippingAddress) return alert('Alamat wajib diisi!');

		try {
			const res = await fetch(`${API_BASE}/checkout`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
				body: JSON.stringify({
					items: cart.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
					shipping_address: shippingAddress
				})
			});
			if (res.ok) {
				alert('Pesanan berhasil dibuat!');
				cart = [];
				shippingAddress = '';
				showCartModal = false;
				activeTab = 'orders';
				fetchOrders();
			} else {
				alert('Gagal checkout.');
			}
		} catch (e) {
			alert('Error koneksi checkout');
		}
	}

	async function fetchOrders() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE}/my-orders`, {
				headers: { 'ngrok-skip-browser-warning': 'true' }
			});
			const result = await res.json();
			if (res.ok) myOrders = result.data || [];
		} catch (e) {
			console.error(e);
		} finally {
			isLoading = false;
		}
	}

	async function handleUploadPayment() {
		if (!paymentFile || !selectedOrderToPay) return alert('Pilih file dulu!');
		const formData = new FormData();
		formData.append('payment_proof', paymentFile);

		try {
			const res = await fetch(`${API_BASE}/orders/${selectedOrderToPay.id}/pay`, {
				method: 'POST',
				headers: { Accept: 'application/json' },
				body: formData
			});
			if (res.ok) {
				alert('Bukti bayar terkirim!');
				selectedOrderToPay = null;
				paymentFile = null;
				fetchOrders();
			} else {
				alert('Gagal upload.');
			}
		} catch (e) {
			alert('Error upload');
		}
	}

	// --- UI HELPERS ---
	function addToCart(product) {
		const existing = cart.find((c) => c.product.id === product.id);
		if (existing) existing.quantity++;
		else cart.push({ product, quantity: 1 });
		selectedProduct = null;
		showToastNotification();
	}

	function showToastNotification() {
		const toast = document.getElementById('toast');
		if (toast) {
			toast.classList.remove('translate-y-20', 'opacity-0');
			setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 2000);
		}
	}

	function switchTab(tab) {
		activeTab = tab;
		if (tab === 'orders') fetchOrders();
	}

	function parsePrice(price) {
		if (typeof price === 'number') return price;
		return parseInt(price.replace(/[^0-9]/g, '')) || 0;
	}

	function formatRupiah(num) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(num);
	}
</script>

<div class="min-h-screen bg-slate-50 pb-28 font-sans text-slate-800">
	<header
		class="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-700 px-6 pt-10 pb-24 shadow-xl shadow-cyan-900/20"
	>
		<div
			class="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"
		></div>
		<div
			class="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl"
		></div>

		<div class="relative z-10 mx-auto max-w-7xl">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-cyan-100">Marketplace Sehat</p>
					<h1 class="text-3xl font-extrabold tracking-tight text-white">Toko Sehat</h1>
				</div>
				<button
					onclick={() => (showCartModal = true)}
					class="relative rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-white/20"
				>
					<i class="fa-solid fa-cart-shopping text-xl"></i>
					{#if cart.length > 0}
						<span
							class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-orange-500 text-[10px] font-bold text-white shadow-sm"
						>
							{cart.length}
						</span>
					{/if}
				</button>
			</div>

			<div class="group relative">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
					<i
						class="fa-solid fa-magnifying-glass text-slate-400 transition-colors group-focus-within:text-cyan-600"
					></i>
				</div>
				<input
					bind:value={searchQuery}
					type="text"
					placeholder="Cari suplemen, alkes, atau makanan..."
					class="w-full rounded-2xl bg-white/95 py-4 pr-4 pl-11 text-sm font-bold text-slate-700 shadow-lg shadow-blue-900/10 transition-all outline-none placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/30"
				/>
			</div>
		</div>
	</header>

	<main class="relative z-20 mx-auto -mt-16 max-w-7xl px-4 md:px-8">
		<div
			class="mx-auto mb-8 flex max-w-sm rounded-full border border-white/50 bg-white/80 p-1.5 shadow-lg shadow-slate-200/50 backdrop-blur-md"
		>
			<button
				onclick={() => switchTab('shop')}
				class="flex-1 rounded-full py-2.5 text-sm font-bold transition-all duration-300 {activeTab ===
				'shop'
					? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
					: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}"
			>
				Belanja
			</button>
			<button
				onclick={() => switchTab('orders')}
				class="flex-1 rounded-full py-2.5 text-sm font-bold transition-all duration-300 {activeTab ===
				'orders'
					? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
					: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}"
			>
				Pesanan Saya
			</button>
		</div>

		{#if activeTab === 'shop'}
			<div class="mb-8">
				<div class="scrollbar-hide flex gap-3 overflow-x-auto px-1 py-4">
					{#each categories as cat}
						<button
							onclick={() => (selectedCategory = cat)}
							class="rounded-2xl border px-5 py-2.5 text-xs font-bold whitespace-nowrap shadow-sm transition-all
                            {selectedCategory === cat
								? 'scale-105 transform border-cyan-600 bg-cyan-600 text-white shadow-cyan-600'
								: 'border-slate-100 bg-white text-slate-500 hover:border-cyan-200 hover:text-cyan-600'}"
						>
							{cat}
						</button>
					{/each}
				</div>
			</div>

			{#if isLoading}
				<div class="animate-pulse py-20 text-center font-medium text-slate-400">
					Sedang memuat produk terbaik...
				</div>
			{:else if filteredProducts.length === 0}
				<div class="py-20 text-center">
					<div class="mb-3 inline-block rounded-full bg-slate-100 p-4">
						<i class="fa-solid fa-box-open text-3xl text-slate-300"></i>
					</div>
					<p class="font-medium text-slate-500">Produk tidak ditemukan</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
					{#each filteredProducts as product}
						<button
							onclick={() => (selectedProduct = product)}
							class="group relative flex flex-col overflow-hidden rounded-3xl border border-white bg-white text-left shadow-lg shadow-slate-100 transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-cyan-100"
						>
							<div class="relative aspect-square w-full overflow-hidden bg-slate-100">
								<img
									src={product.image_url}
									alt={product.name}
									class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
									loading="lazy"
								/>
								<div
									class="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-extrabold text-slate-800 shadow-sm backdrop-blur-md"
								>
									<i class="fa-solid fa-star text-orange-400"></i>
									{product.rating}
								</div>
							</div>
							<div class="flex flex-1 flex-col p-4">
								<span
									class="mb-1 w-fit rounded bg-cyan-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-cyan-600 uppercase"
									>{product.category}</span
								>
								<h3
									class="mb-2 line-clamp-2 text-sm leading-relaxed font-bold text-slate-800 transition-colors group-hover:text-cyan-600"
								>
									{product.name}
								</h3>
								<div class="mt-auto flex items-center justify-between pt-2">
									<p class="text-base font-extrabold text-slate-800">
										{formatRupiah(product.price)}
									</p>
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all group-hover:bg-cyan-500 group-hover:text-white"
									>
										<i class="fa-solid fa-plus text-xs"></i>
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		{/if}

		{#if activeTab === 'orders'}
			<div class="mx-auto max-w-3xl space-y-4">
				{#if isLoading}
					<div class="py-10 text-center text-slate-400">Memuat pesanan...</div>
				{:else if myOrders.length === 0}
					<div
						class="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center"
					>
						<i class="fa-solid fa-receipt mb-3 block text-4xl text-slate-200"></i>
						<p class="font-medium text-slate-400">Belum ada pesanan</p>
						<button
							onclick={() => switchTab('shop')}
							class="mt-4 text-sm font-bold text-cyan-600 hover:underline">Mulai Belanja</button
						>
					</div>
				{:else}
					{#each myOrders as order}
						<div
							class="rounded-3xl border border-slate-50 bg-white p-5 shadow-lg shadow-slate-100 transition hover:shadow-xl"
						>
							<div class="mb-4 flex items-start justify-between border-b border-slate-100 pb-3">
								<div>
									<span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
										>Order #{order.id}</span
									>
									<p class="text-xs font-medium text-slate-500">
										{new Date(order.created_at).toLocaleDateString()}
									</p>
								</div>
								<span
									class="rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase
                                    {order.status === 'paid'
										? 'bg-green-100 text-green-700'
										: 'bg-orange-100 text-orange-700'}"
								>
									{order.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
								</span>
							</div>

							<div class="mb-4 space-y-3">
								{#each order.items || [] as item}
									<div class="flex items-center justify-between text-sm">
										<div class="flex items-center gap-3">
											<div
												class="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-xs text-slate-400"
											>
												<i class="fa-solid fa-image"></i>
											</div>
											<span class="font-medium text-slate-700"
												>{item.product_name || 'Produk'}
												<span class="text-xs text-slate-400">x{item.quantity}</span></span
											>
										</div>
										<span class="font-bold text-slate-800"
											>{formatRupiah(item.price * item.quantity)}</span
										>
									</div>
								{/each}
							</div>

							<div class="flex items-center justify-between pt-2">
								<div>
									<p class="text-xs font-bold text-slate-400">Total Belanja</p>
									<span class="text-lg font-extrabold text-cyan-600"
										>{formatRupiah(order.total_price)}</span
									>
								</div>
								{#if order.status !== 'paid'}
									<button
										onclick={() => (selectedOrderToPay = order)}
										class="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-700"
										>Bayar Sekarang</button
									>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</main>

	<div
		id="toast"
		class="pointer-events-none fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 translate-y-20 items-center gap-3 rounded-full border border-white/10 bg-slate-800/90 px-6 py-3 text-white opacity-0 shadow-2xl backdrop-blur-md transition-all duration-300"
	>
		<i class="fa-solid fa-check-circle text-green-400"></i>
		<span class="text-sm font-bold">Masuk Keranjang</span>
	</div>

	<Navbar />
</div>

{#if selectedProduct}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
			onclick={() => (selectedProduct = null)}
		></div>

		<div
			class="relative z-10 flex h-full w-full flex-col bg-white shadow-2xl md:h-auto md:max-h-[85vh] md:max-w-5xl md:flex-row md:overflow-hidden md:rounded-[2.5rem]"
			in:scale={{ start: 0.95, duration: 300 }}
		>
			<button
				onclick={() => (selectedProduct = null)}
				class="absolute top-4 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm backdrop-blur md:hidden"
			>
				<i class="fa-solid fa-arrow-left"></i>
			</button>

			<div class="relative h-[45vh] w-full bg-slate-100 md:h-auto md:w-1/2">
				<img
					src={selectedProduct.image_url}
					alt={selectedProduct.name}
					class="h-full w-full object-cover"
				/>
				<div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:hidden"></div>
			</div>

			<div class="flex flex-1 flex-col overflow-y-auto bg-white p-6 md:p-10">
				<button
					onclick={() => (selectedProduct = null)}
					class="absolute top-6 right-6 hidden h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-red-50 hover:text-red-500 md:flex"
				>
					<i class="fa-solid fa-xmark text-lg"></i>
				</button>

				<div class="mb-3 flex items-center gap-2">
					<span
						class="rounded-lg bg-cyan-50 px-3 py-1 text-[10px] font-extrabold tracking-wider text-cyan-600 uppercase"
						>{selectedProduct.category}</span
					>
					<span class="text-xs font-bold text-slate-400">Terjual {selectedProduct.sold}+</span>
				</div>

				<h2 class="mb-4 text-2xl leading-tight font-extrabold text-slate-800 md:text-3xl">
					{selectedProduct.name}
				</h2>

				<div class="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
					<div class="flex items-center gap-1">
						<i class="fa-solid fa-star text-sm text-orange-400"></i>
						<span class="text-sm font-bold text-slate-800">{selectedProduct.rating}</span>
					</div>
					<div class="h-4 w-px bg-slate-200"></div>
					<span class="text-sm font-medium text-slate-500">Stok Tersedia</span>
				</div>

				<div class="mb-8">
					<h3 class="mb-3 text-sm font-extrabold tracking-wide text-slate-900 uppercase">
						Tentang Produk
					</h3>
					<p class="text-sm leading-relaxed text-slate-600">
						{selectedProduct.description || 'Deskripsi produk ini belum tersedia secara lengkap.'}
					</p>
				</div>

				<div class="mt-auto border-t border-slate-50 pt-4">
					<div class="mb-4 flex items-end justify-between">
						<span class="text-sm font-bold text-slate-400">Harga</span>
						<h3 class="text-3xl font-black tracking-tight text-slate-800">
							{formatRupiah(selectedProduct.price)}
						</h3>
					</div>
					<div class="flex gap-3">
						<Button
							onclick={() => addToCart(selectedProduct)}
							variant="outline"
							className="flex-1 py-4 border-2 border-slate-200 text-slate-700 hover:border-slate-800 hover:text-slate-900 font-bold rounded-2xl"
						>
							+ Keranjang
						</Button>
						<Button
							className="flex-[2] py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-200 font-bold rounded-2xl"
						>
							Beli Sekarang
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showCartModal}
	<div
		class="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
			onclick={() => (showCartModal = false)}
		></div>
		<div
			class="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-[2.5rem] bg-white p-8 shadow-2xl sm:rounded-[2.5rem]"
			in:slide={{ axis: 'y' }}
		>
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-xl font-extrabold text-slate-800">
					Keranjang <span class="text-cyan-600">({cart.length})</span>
				</h3>
				<button
					onclick={() => (showCartModal = false)}
					class="text-slate-300 transition hover:text-red-500"
					><i class="fa-solid fa-circle-xmark text-2xl"></i></button
				>
			</div>

			<div class="mb-6 flex-1 space-y-4 overflow-y-auto pr-2">
				{#if cart.length === 0}
					<div class="flex flex-col items-center py-10 text-center">
						<div class="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
							<i class="fa-solid fa-basket-shopping text-3xl text-slate-300"></i>
						</div>
						<p class="font-medium text-slate-400">Keranjang masih kosong</p>
					</div>
				{:else}
					{#each cart as item}
						<div
							class="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
						>
							<img
								src={item.product.image_url}
								class="h-16 w-16 rounded-xl bg-slate-100 object-cover"
								alt="img"
							/>
							<div class="flex-1">
								<h4 class="line-clamp-1 text-sm font-bold text-slate-800">{item.product.name}</h4>
								<p class="mt-1 text-xs font-bold text-slate-500">
									{formatRupiah(item.product.price)}
								</p>
							</div>
							<div
								class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5"
							>
								<button
									onclick={() => (item.quantity > 1 ? item.quantity-- : null)}
									class="text-lg font-bold text-slate-400 hover:text-cyan-600">-</button
								>
								<span class="w-4 text-center text-sm font-bold">{item.quantity}</span>
								<button
									onclick={() => item.quantity++}
									class="text-lg font-bold text-slate-400 hover:text-cyan-600">+</button
								>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="space-y-5 border-t border-slate-100 pt-6">
				<div>
					<label
						class="mb-2 block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase"
						>Alamat Pengiriman</label
					>
					<textarea
						bind:value={shippingAddress}
						class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-cyan-500"
						rows="2"
						placeholder="Tulis alamat lengkap..."
					></textarea>
				</div>
				<div class="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
					<span class="text-sm font-bold text-slate-500">Total Bayar</span>
					<span class="text-xl font-black text-slate-800">{formatRupiah(cartTotal)}</span>
				</div>
				<Button
					onclick={handleCheckout}
					className="w-full py-4 bg-slate-900 text-white shadow-xl shadow-slate-300 font-bold rounded-2xl hover:scale-[1.02] transition-transform"
					>Checkout Sekarang</Button
				>
			</div>
		</div>
	</div>
{/if}

{#if selectedOrderToPay}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-6" transition:fade>
		<div
			class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
			onclick={() => (selectedOrderToPay = null)}
		></div>
		<div class="relative z-10 w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-2xl">
			<h3 class="mb-1 text-xl font-extrabold text-slate-800">Upload Bukti Bayar</h3>
			<p class="mb-6 text-xs font-bold tracking-wide text-slate-400 uppercase">
				Order #{selectedOrderToPay.id}
			</p>

			<div
				class="group relative mb-6 cursor-pointer rounded-3xl border-2 border-dashed border-slate-200 p-8 transition-all hover:border-cyan-400 hover:bg-slate-50"
			>
				<input
					type="file"
					class="absolute inset-0 z-10 cursor-pointer opacity-0"
					onchange={(e) => (paymentFile = e.target.files[0])}
				/>
				<div class="flex flex-col items-center gap-3">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 transition-transform group-hover:scale-110"
					>
						<i class="fa-solid fa-cloud-arrow-up text-xl text-cyan-500"></i>
					</div>
					<span class="text-xs font-bold text-slate-500"
						>{paymentFile ? paymentFile.name : 'Ketuk untuk upload foto'}</span
					>
				</div>
			</div>

			<div class="flex gap-3">
				<Button
					onclick={() => (selectedOrderToPay = null)}
					variant="secondary"
					className="flex-1 rounded-xl py-3 font-bold text-slate-500">Batal</Button
				>
				<Button
					onclick={handleUploadPayment}
					className="flex-[2] rounded-xl py-3 bg-green-500 text-white shadow-lg shadow-green-200 font-bold hover:bg-green-600"
					>Kirim Bukti</Button
				>
			</div>
		</div>
	</div>
{/if}
