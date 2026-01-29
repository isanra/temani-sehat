<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';
	import { fade, fly } from 'svelte/transition';

	let products: any[] = [];
	let loading = true;
	let showModal = false;
	let isEditMode = false;
	let submitLoading = false;

	// State Form
	let form = {
		id: null,
		name: '',
		category: '',
		price: '',
		stock: '',
		description: '',
		image: null as File | null
	};

	// 1. READ
	async function loadProducts() {
		loading = true;
		try {
			const res = await fetchApi('/products');
			// Handle struktur response yang mungkin beda-beda
			if (Array.isArray(res)) {
				products = res;
			} else if (res?.data && Array.isArray(res.data)) {
				products = res.data;
			} else {
				products = [];
			}
		} catch (error) {
			console.error('Gagal load produk:', error);
			products = [];
		} finally {
			loading = false;
		}
	}

	// 2. Handle File
	function handleFileChange(event: any) {
		const file = event.target.files[0];
		if (file) form.image = file;
	}

	// 3. CREATE & UPDATE (FIXED LOGIC)
	async function handleSubmit() {
		submitLoading = true;
		try {
			const formData = new FormData();
			formData.append('name', form.name);
			formData.append('category', form.category);
			formData.append('price', form.price.toString());
			formData.append('stock', form.stock.toString());
			formData.append('description', form.description);

			if (form.image) {
				formData.append('image', form.image);
			}

			if (isEditMode && form.id) {
				// --- UPDATE LOGIC (FIXED) ---
				// Karena backend error "PUT not supported", kita pakai POST murni ke /products/{id}
				// Tanpa _method: PUT
				await fetchApi(`/products/${form.id}`, 'POST', formData, true);
				alert('Produk berhasil diperbarui!');
			} else {
				// --- CREATE LOGIC ---
				if (!form.image) {
					alert('Harap pilih gambar produk!');
					submitLoading = false;
					return;
				}
				await fetchApi('/products', 'POST', formData, true);
				alert('Produk berhasil ditambahkan!');
			}

			closeModal();
			loadProducts();
		} catch (error: any) {
			console.error('Submit Error:', error);
			alert(error.message || 'Gagal menyimpan produk.');
		} finally {
			submitLoading = false;
		}
	}

	// 4. DELETE
	async function handleDelete(id: number, name: string) {
		if (!confirm(`Hapus produk "${name}"?`)) return;
		try {
			await fetchApi(`/products/${id}`, 'DELETE');
			loadProducts();
		} catch (error: any) {
			alert(error.message || 'Gagal menghapus produk.');
		}
	}

	// Helper Modal
	function openAddModal() {
		isEditMode = false;
		form = { id: null, name: '', category: '', price: '', stock: '', description: '', image: null };
		showModal = true;
	}

	function openEditModal(item: any) {
		isEditMode = true;
		form = {
			id: item.id,
			name: item.name,
			category: item.category,
			price: item.price,
			stock: item.stock,
			description: item.description,
			image: null // Reset image input
		};
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	// Helper URL Image
	// Sesuaikan BASE URL ini dengan alamat backend kamu
	// Jika backend di ngrok, ganti localhost:8000 jadi alamat ngrok
	const BACKEND_URL = 'http://localhost:8000';

	function resolveImage(url: string) {
		if (!url) return null;
		if (url.startsWith('http')) return url;
		// Hapus '/storage/' ganda jika ada
		const cleanPath = url.replace(/^\/?storage\//, '');
		return `${BACKEND_URL}/storage/${cleanPath}`;
	}

	onMount(loadProducts);
</script>

<svelte:head>
	<title>Katalog Produk - Admin</title>
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
			<h2 class="text-2xl font-bold text-gray-800">Katalog Produk</h2>
			<p class="text-sm text-gray-500">Kelola stok makanan sehat dan obat-obatan.</p>
		</div>
		<button
			on:click={openAddModal}
			class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:scale-105 hover:bg-blue-700"
		>
			<i class="fa-solid fa-plus"></i> Tambah Produk
		</button>
	</div>

	<div
		class="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50"
	>
		{#if loading}
			<div class="py-20 text-center">
				<div
					class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<p class="mt-4 text-sm font-medium text-gray-500">Memuat produk...</p>
			</div>
		{:else if products.length === 0}
			<div class="flex flex-col items-center p-16 text-center text-slate-400">
				<i class="fa-solid fa-box-open mb-3 text-4xl text-slate-300"></i>
				<h3 class="text-lg font-medium text-gray-600">Belum ada produk</h3>
				<p class="text-sm">Silakan tambahkan produk baru ke katalog.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead
						class="bg-slate-50/50 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase"
					>
						<tr>
							<th class="px-8 py-4">Produk</th>
							<th class="px-8 py-4">Kategori</th>
							<th class="px-8 py-4">Harga</th>
							<th class="px-8 py-4">Stok</th>
							<th class="px-8 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-50 bg-white text-sm font-medium">
						{#each products as item}
							<tr class="transition hover:bg-slate-50/50">
								<td class="px-8 py-5">
									<div class="flex items-center gap-4">
										<div
											class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm"
										>
											{#if item.image_url || item.image}
												<img
													src={resolveImage(item.image_url || item.image)}
													alt={item.name}
													class="h-full w-full object-cover"
												/>
											{:else}
												<div class="flex h-full w-full items-center justify-center text-slate-300">
													<i class="fa-solid fa-image text-lg"></i>
												</div>
											{/if}
										</div>
										<div>
											<div class="font-bold text-slate-800">{item.name}</div>
											<div class="line-clamp-1 max-w-[150px] text-xs text-slate-400">
												{item.description}
											</div>
										</div>
									</div>
								</td>
								<td class="px-8 py-5">
									<span
										class="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold tracking-wide text-slate-600 uppercase"
									>
										{item.category}
									</span>
								</td>
								<td class="px-8 py-5 font-mono font-bold text-slate-700">
									Rp {parseInt(item.price).toLocaleString('id-ID')}
								</td>
								<td class="px-8 py-5">
									<span
										class="text-xs font-bold {item.stock < 10 ? 'text-red-500' : 'text-slate-600'}"
									>
										{item.stock} pcs
									</span>
								</td>
								<td class="px-8 py-5 text-right">
									<div class="flex justify-end gap-2">
										<button
											on:click={() => openEditModal(item)}
											class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white hover:shadow-md hover:shadow-blue-200"
											title="Edit"
										>
											<i class="fa-solid fa-pen"></i>
										</button>
										<button
											on:click={() => handleDelete(item.id, item.name)}
											class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-500 hover:text-white hover:shadow-md hover:shadow-red-200"
											title="Hapus"
										>
											<i class="fa-solid fa-trash"></i>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

{#if showModal}
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
				<h3 class="text-lg font-extrabold text-slate-800">
					{isEditMode ? 'Edit Produk' : 'Tambah Produk'}
				</h3>
				<button on:click={closeModal} class="text-slate-400 transition hover:text-red-500">
					<i class="fa-solid fa-xmark text-xl"></i>
				</button>
			</div>

			<div class="max-h-[80vh] overflow-y-auto p-8">
				<form on:submit|preventDefault={handleSubmit} class="space-y-5">
					<div
						class="relative cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50"
					>
						<input
							type="file"
							on:change={handleFileChange}
							accept="image/*"
							class="absolute inset-0 cursor-pointer opacity-0"
						/>
						<div class="flex flex-col items-center gap-2">
							<i class="fa-solid fa-cloud-arrow-up text-3xl text-slate-400"></i>
							{#if form.image}
								<span class="text-sm font-bold text-blue-600">{form.image.name}</span>
							{:else}
								<span class="text-sm font-medium text-slate-500"
									>Klik untuk {isEditMode ? 'ganti' : 'upload'} foto</span
								>
							{/if}
						</div>
					</div>

					<div>
						<label class="mb-1.5 block text-xs font-bold text-slate-500 uppercase"
							>Nama Produk</label
						>
						<input
							bind:value={form.name}
							type="text"
							class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
							required
						/>
					</div>

					<div class="grid grid-cols-2 gap-5">
						<div class="col-span-2">
							<label class="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Kategori</label
							>
							<select
								bind:value={form.category}
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
								required
							>
								<option value="" disabled>Pilih...</option>
								<option value="Makanan Sehat">Makanan Sehat</option>
								<option value="Obat">Obat</option>
								<option value="Alkes">Alkes</option>
								<option value="Minuman">Minuman</option>
								<option value="Vitamin">Vitamin</option>
								<option value="Perabot">Perabot</option>
							</select>
						</div>

						<div>
							<label class="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Stok</label>
							<input
								bind:value={form.stock}
								type="number"
								class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
								required
							/>
						</div>

						<div>
							<label class="mb-1.5 block text-xs font-bold text-slate-500 uppercase"
								>Harga (Rp)</label
							>
							<input
								bind:value={form.price}
								type="number"
								class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
								required
							/>
						</div>
					</div>

					<div>
						<label class="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Deskripsi</label>
						<textarea
							bind:value={form.description}
							class="h-24 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
						></textarea>
					</div>

					<div class="flex gap-3 pt-4">
						<button
							type="button"
							on:click={closeModal}
							class="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
							>Batal</button
						>
						<button
							type="submit"
							disabled={submitLoading}
							class="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-70"
						>
							{submitLoading ? 'Menyimpan...' : 'Simpan'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
