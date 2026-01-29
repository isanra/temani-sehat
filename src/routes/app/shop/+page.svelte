<script>
	import { onMount } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import Navbar from '$lib/components/Navbar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { API_BASE_URL } from '$lib/utils/api';

	// --- CONFIG ---
	const ADMIN_WA = '6285171512508';

	// --- STATE ---
	let products = $state([]);
	let isLoading = $state(false);
	let searchQuery = $state('');
	let selectedCategory = $state('Semua');

	let selectedProduct = $state(null);
	let showCartModal = $state(false);
	let cart = $state([]);
	let shippingAddress = $state('');

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

	// --- COMPUTED ---
	let filteredProducts = $derived(
		products.filter((p) => {
			const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
			const matchSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
			return matchCat && matchSearch;
		})
	);

	let cartTotal = $derived(
		cart.reduce((total, item) => total + parsePrice(item.product.price) * item.quantity, 0)
	);

	onMount(async () => {
		await fetchProducts();
	});

	// --- API ACTIONS (HANYA ADA SATU FUNGSI INI) ---
	async function fetchProducts() {
		isLoading = true;
		try {
			const token = localStorage.getItem('auth_token');
			const res = await fetch(`${API_BASE_URL}/products`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					'ngrok-skip-browser-warning': 'true',
					Authorization: `Bearer ${token}`
				}
			});

			if (res.ok) {
				const result = await res.json();
				if (Array.isArray(result)) {
					products = result;
				} else if (result.data && Array.isArray(result.data)) {
					products = result.data;
				} else if (result.data && result.data.data && Array.isArray(result.data.data)) {
					products = result.data.data;
				} else {
					products = [];
				}
			} else {
				console.error('Gagal ambil produk, status:', res.status);
				products = [];
			}
		} catch (e) {
			console.error('Error Fetch Products:', e);
			products = [];
		} finally {
			isLoading = false;
		}
	}

	// --- LOGIC CHECKOUT WA ---
	function handleWhatsAppCheckout() {
		if (cart.length === 0) return alert('Keranjang kosong!');
		if (!shippingAddress) return alert('Mohon isi alamat pengiriman dulu!');

		let message = `Halo Admin Toko Sehat, saya mau pesan:\n\n`;
		cart.forEach((item, index) => {
			const subtotal = formatRupiah(parsePrice(item.product.price) * item.quantity);
			message += `${index + 1}. ${item.product.name} (${item.quantity}x) - ${subtotal}\n`;
		});

		message += `\n*Total Bayar: ${formatRupiah(cartTotal)}*\n`;
		message += `\n📍 *Alamat Pengiriman:*\n${shippingAddress}`;
		message += `\n\nMohon diproses ya kak! Terima kasih.`;

		const encodedMessage = encodeURIComponent(message);
		const waUrl = `https://wa.me/${ADMIN_WA}?text=${encodedMessage}`;
		window.open(waUrl, '_blank');
	}

	// --- UI HELPERS ---
	function resolveImage(url) {
		if (!url) return 'https://via.placeholder.com/400?text=No+Image';
		if (url.startsWith('http')) return url;
		const baseUrl = API_BASE_URL.replace('/api', '');
		return `${baseUrl}/storage/${url}`;
	}

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

	function parsePrice(price) {
		if (typeof price === 'number') return price;
		return parseInt(String(price).replace(/[^0-9]/g, '')) || 0;
	}

	function formatRupiah(num) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(num);
	}
</script>

<div class="min-h-screen bg-slate-50 pb-40 font-sans text-slate-800">
	<header
		class="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-700 px-6 pt-10 pb-28 shadow-xl shadow-cyan-900/20"
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
							>{cart.length}</span
						>
					{/if}
				</button>
			</div>

			<div class="group relative mb-6">
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

			<div class="scrollbar-hide -mx-6 flex gap-3 overflow-x-auto px-6 pb-2">
				{#each categories as cat}
					<button
						onclick={() => (selectedCategory = cat)}
						class="rounded-2xl border px-4 py-2 text-xs font-bold whitespace-nowrap shadow-sm transition-all {selectedCategory ===
						cat
							? 'scale-105 transform border-white bg-white text-cyan-600 shadow-lg'
							: 'border-white/20 bg-white/10 text-white hover:bg-white/20'}">{cat}</button
					>
				{/each}
			</div>
		</div>
	</header>

	<main class="relative z-20 mx-auto -mt-20 max-w-7xl px-4 md:px-8">
		{#if isLoading}
			<div class="animate-pulse py-20 text-center font-medium text-slate-400">
				Sedang mengambil produk...
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
								src={resolveImage(product.image || product.image_url)}
								alt={product.name}
								class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
								loading="lazy"
							/>
							<div
								class="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-extrabold text-slate-800 shadow-sm backdrop-blur-md"
							>
								<i class="fa-solid fa-star text-orange-400"></i>
								{product.rating || '4.5'}
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
								<p class="text-base font-extrabold text-slate-800">{formatRupiah(product.price)}</p>
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
					src={resolveImage(selectedProduct.image || selectedProduct.image_url)}
					alt={selectedProduct.name}
					class="h-full w-full object-cover"
				/>
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
					<span class="text-xs font-bold text-slate-400">Terjual {selectedProduct.sold || 0}+</span>
				</div>

				<h2 class="mb-4 text-2xl leading-tight font-extrabold text-slate-800 md:text-3xl">
					{selectedProduct.name}
				</h2>

				<div class="mt-auto border-t border-slate-50 pt-4">
					<div class="mb-4 flex items-end justify-between">
						<span class="text-sm font-bold text-slate-400">Harga</span>
						<h3 class="text-3xl font-black tracking-tight text-slate-800">
							{formatRupiah(selectedProduct.price)}
						</h3>
					</div>
					<Button
						onclick={() => addToCart(selectedProduct)}
						className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-200 font-bold rounded-2xl"
					>
						+ Masukkan Keranjang
					</Button>
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
								src={resolveImage(item.product.image || item.product.image_url)}
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
				<textarea
					bind:value={shippingAddress}
					class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-cyan-500"
					rows="2"
					placeholder="Tulis alamat lengkap..."
				></textarea>
				<div class="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
					<span class="text-sm font-bold text-slate-500">Total Bayar</span>
					<span class="text-xl font-black text-slate-800">{formatRupiah(cartTotal)}</span>
				</div>
				<Button
					onclick={handleWhatsAppCheckout}
					className="w-full py-4 bg-green-500 text-white shadow-xl shadow-green-300 font-bold rounded-2xl hover:scale-[1.02] hover:bg-green-600 transition-all"
				>
					<i class="fa-brands fa-whatsapp mr-2 text-xl"></i> Checkout di WA
				</Button>
			</div>
		</div>
	</div>
{/if}
