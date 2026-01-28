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

	// 1. READ: Ambil Data Produk
	async function loadProducts() {
		loading = true;
		try {
			const res = await fetchApi('/products');
			products = Array.isArray(res) ? res : res?.data || [];
		} catch (error) {
			console.error('Gagal load produk:', error);
			products = [];
		} finally {
			loading = false;
		}
	}

	// 2. Handle File Change
	function handleFileChange(event: any) {
		const file = event.target.files[0];
		if (file) form.image = file;
	}

	// 3. CREATE & UPDATE: Handle Submit
	async function handleSubmit() {
		submitLoading = true;
		try {
			const formData = new FormData();
			formData.append('name', form.name);
			formData.append('category', form.category);
			formData.append('price', form.price.toString());
			formData.append('stock', form.stock.toString());
			formData.append('description', form.description);

			// Kirim gambar jika ada
			if (form.image) {
				formData.append('image', form.image);
			}

			if (isEditMode && form.id) {
				// UPDATE (POST MURNI)
				// Kita hapus "_method: PUT" sesuai permintaanmu agar tidak error "PUT not supported"
				// Kita tembak langsung ke /products/{id} dengan method POST
				await fetchApi(`/products/${form.id}`, 'POST', formData, true);
				alert('Produk berhasil diperbarui!');
			} else {
				// CREATE (POST)
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

	// 4. DELETE: Hapus Data
	async function handleDelete(id: number, name: string) {
		if (!confirm(`Hapus produk "${name}"?`)) return;
		try {
			await fetchApi(`/products/${id}`, 'DELETE');
			loadProducts();
		} catch (error: any) {
			alert(error.message || 'Gagal menghapus produk.');
		}
	}

	// --- Helper Modal ---
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
			image: null // Reset image input agar user upload baru jika ingin ganti
		};
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	onMount(loadProducts);
</script>

<svelte:head>
	<title>Produk Sehat - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div
		class="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
	>
		<div>
			<h2 class="text-xl font-bold text-gray-800">Katalog Produk</h2>
			<p class="text-sm text-gray-500">Kelola makanan sehat dan obat-obatan.</p>
		</div>
		<button
			on:click={openAddModal}
			class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
		>
			<span>+</span> Tambah Produk
		</button>
	</div>

	<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
		{#if loading}
			<div class="animate-pulse p-8 text-center text-gray-500">Memuat produk...</div>
		{:else if products.length === 0}
			<div class="p-10 text-center text-gray-400">Belum ada produk.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead class="bg-gray-50 text-xs font-semibold tracking-wider text-gray-600 uppercase">
						<tr>
							<th class="px-6 py-4">Produk</th>
							<th class="px-6 py-4">Kategori</th>
							<th class="px-6 py-4">Harga</th>
							<th class="px-6 py-4">Stok</th>
							<th class="px-6 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each products as item}
							<tr class="transition hover:bg-blue-50/50">
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										<div
											class="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
										>
											{#if item.image_url}
												<img
													src={item.image_url}
													alt={item.name}
													class="h-full w-full object-cover"
												/>
											{:else}
												<div
													class="flex h-full w-full items-center justify-center text-xs text-gray-400"
												>
													No IMG
												</div>
											{/if}
										</div>
										<div>
											<div class="font-medium text-gray-900">{item.name}</div>
											<div class="max-w-[150px] truncate text-xs text-gray-500">
												{item.description}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 text-gray-600">
									<span
										class="rounded border border-green-100 bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
									>
										{item.category}
									</span>
								</td>
								<td class="px-6 py-4 font-semibold text-gray-900"
									>Rp {parseInt(item.price).toLocaleString('id-ID')}</td
								>
								<td class="px-6 py-4 text-sm">{item.stock} pcs</td>
								<td class="space-x-2 px-6 py-4 text-right">
									<button
										on:click={() => openEditModal(item)}
										class="rounded-lg px-2 py-1 text-sm font-medium text-blue-500 hover:bg-blue-50"
										>Edit</button
									>
									<button
										on:click={() => handleDelete(item.id, item.name)}
										class="rounded-lg px-2 py-1 text-sm font-medium text-red-500 hover:bg-red-50"
										>Hapus</button
									>
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
		<div class="absolute inset-0 bg-black/40 backdrop-blur-sm" on:click={closeModal}></div>
		<div
			class="z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
			transition:fly={{ y: 20, duration: 300 }}
		>
			<div class="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
				<h3 class="text-lg font-bold text-gray-800">
					{isEditMode ? 'Edit Produk' : 'Tambah Produk Baru'}
				</h3>
				<button on:click={closeModal} class="text-gray-400 hover:text-red-500">&times;</button>
			</div>
			<div class="overflow-y-auto p-6">
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div
						class="relative cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:bg-gray-50"
					>
						<input
							type="file"
							on:change={handleFileChange}
							accept="image/*"
							class="absolute inset-0 cursor-pointer opacity-0"
						/>
						{#if form.image}
							<p class="text-sm font-medium text-green-600">File: {form.image.name}</p>
						{:else}
							<div class="text-gray-400">
								<span class="mb-1 block text-2xl">📷</span>
								<p class="text-sm">Klik untuk {isEditMode ? 'ganti' : 'upload'} gambar</p>
							</div>
						{/if}
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Nama Produk</label>
						<input
							bind:value={form.name}
							type="text"
							class="w-full rounded-lg border border-gray-300 px-4 py-2"
							required
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
							<select
								bind:value={form.category}
								class="w-full rounded-lg border border-gray-300 px-4 py-2"
								required
							>
								<option value="Makanan Sehat">Makanan Sehat</option>
								<option value="Minuman">Minuman</option>
								<option value="Vitamin">Vitamin</option>
							</select>
						</div>
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">Stok</label>
							<input
								bind:value={form.stock}
								type="number"
								class="w-full rounded-lg border border-gray-300 px-4 py-2"
								required
							/>
						</div>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Harga (Rp)</label>
						<input
							bind:value={form.price}
							type="number"
							class="w-full rounded-lg border border-gray-300 px-4 py-2"
							required
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
						<textarea
							bind:value={form.description}
							class="h-24 w-full resize-none rounded-lg border border-gray-300 px-4 py-2"
						></textarea>
					</div>
					<div class="flex justify-end gap-3 pt-4">
						<button
							type="button"
							on:click={closeModal}
							class="rounded-xl px-5 py-2.5 text-gray-600 hover:bg-gray-100">Batal</button
						>
						<button
							type="submit"
							disabled={submitLoading}
							class="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
						>
							{submitLoading ? 'Menyimpan...' : 'Simpan'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
