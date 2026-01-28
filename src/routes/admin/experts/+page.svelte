<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';
	import { fade, fly } from 'svelte/transition';

	let experts: any[] = [];
	let loading = true;
	let showModal = false;
	let isEditMode = false;
	let submitLoading = false;

	// Default form state
	let form = {
		id: null,
		name: '',
		title: '',
		category: '',
		fee: '',
		wa_number: '',
		is_online: 1,
		photo: null as File | null
	};

	// 1. READ: Ambil Data Experts
	async function loadExperts() {
		loading = true;
		try {
			const res = await fetchApi('/experts');
			if (res && Array.isArray(res)) {
				experts = res;
			} else if (res?.data) {
				experts = res.data;
			} else {
				experts = [];
			}
		} catch (err) {
			console.error('Gagal load data:', err);
			experts = [];
		} finally {
			loading = false;
		}
	}

	// 2. Handle File Change
	function handleFileChange(event: any) {
		const file = event.target.files[0];
		if (file) form.photo = file;
	}

	// 3. CREATE & UPDATE: Handle Submit
	async function handleSubmit() {
		submitLoading = true;

		try {
			const formData = new FormData();
			formData.append('name', form.name);
			formData.append('title', form.title);
			formData.append('category', form.category);
			formData.append('fee', form.fee.toString());
			formData.append('wa_number', form.wa_number);
			formData.append('is_online', '1');

			// Kirim foto hanya jika user memilih file baru
			if (form.photo) {
				formData.append('photo', form.photo);
			}

			if (isEditMode && form.id) {
				// UPDATE (PUT via POST method spoofing)
				formData.append('_method', 'PUT');
				await fetchApi(`/experts/${form.id}`, 'POST', formData, true);
				alert('Data berhasil diupdate!');
			} else {
				// CREATE (POST)
				if (!form.photo) {
					alert('Wajib upload foto untuk ahli baru!');
					submitLoading = false;
					return;
				}
				await fetchApi('/experts', 'POST', formData, true);
				alert('Expert baru berhasil ditambahkan!');
			}

			closeModal();
			loadExperts();
		} catch (error: any) {
			console.error('Submit Error:', error);
			alert(error.message || 'Gagal menyimpan data.');
		} finally {
			submitLoading = false;
		}
	}

	// 4. DELETE: Hapus Data
	async function handleDelete(id: number, name: string) {
		if (!confirm(`Hapus ahli "${name}"?`)) return;
		try {
			await fetchApi(`/experts/${id}`, 'DELETE');
			loadExperts();
		} catch (error: any) {
			alert(error.message || 'Gagal menghapus data.');
		}
	}

	// --- Helper Modal ---
	function openAddModal() {
		isEditMode = false;
		form = {
			id: null,
			name: '',
			title: '',
			category: '',
			fee: '',
			wa_number: '',
			is_online: 1,
			photo: null
		};
		showModal = true;
	}

	function openEditModal(item: any) {
		isEditMode = true;
		// Isi form dengan data yang mau diedit
		form = {
			id: item.id,
			name: item.name,
			title: item.title,
			category: item.category,
			fee: item.fee,
			wa_number: item.wa_number,
			is_online: item.is_online, // Pastikan backend kirim field ini
			photo: null // Reset foto (biar user upload baru kalau mau ganti)
		};
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	onMount(loadExperts);
</script>

<div class="space-y-6">
	<div
		class="flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
	>
		<div>
			<h2 class="text-xl font-bold text-gray-800">Daftar Ahli Kesehatan</h2>
			<p class="text-sm text-gray-500">Kelola dokter, ahli gizi, dan psikolog.</p>
		</div>
		<button
			on:click={openAddModal}
			class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700"
		>
			<span>+</span> Tambah Ahli
		</button>
	</div>

	<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
		{#if loading}
			<div class="animate-pulse p-8 text-center text-gray-500">Memuat data ahli...</div>
		{:else if experts.length === 0}
			<div class="flex flex-col items-center p-10 text-center">
				<div class="mb-2 text-4xl">👨‍⚕️</div>
				<h3 class="text-lg font-medium text-gray-900">Belum ada data</h3>
				<p class="text-sm text-gray-500">Silakan tambahkan data baru.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead class="bg-gray-50 text-xs font-semibold tracking-wider text-gray-600 uppercase">
						<tr>
							<th class="px-6 py-4">Profil</th>
							<th class="px-6 py-4">Kategori</th>
							<th class="px-6 py-4">Biaya</th>
							<th class="px-6 py-4">Status</th>
							<th class="px-6 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each experts as item}
							<tr class="transition-colors hover:bg-blue-50/50">
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										<div
											class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border bg-gray-200"
										>
											{#if item.photo_url || item.photo}
												<img
													src={item.photo_url || item.photo}
													alt={item.name}
													class="h-full w-full object-cover"
												/>
											{:else}
												<span
													class="flex h-full w-full items-center justify-center text-xs text-gray-500"
													>Img</span
												>
											{/if}
										</div>
										<div>
											<div class="font-medium text-gray-900">{item.name}</div>
											<div class="text-xs text-blue-500">{item.title}</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 text-gray-600">{item.category}</td>
								<td class="px-6 py-4 font-semibold text-green-600"
									>Rp {parseInt(item.fee || 0).toLocaleString('id-ID')}</td
								>
								<td class="px-6 py-4">
									<span
										class="rounded-full border border-green-200 bg-green-100 px-2 py-1 text-xs text-green-700"
									>
										{item.is_online ? 'Online' : 'Offline'}
									</span>
								</td>
								<td class="space-x-2 px-6 py-4 text-right">
									<button
										on:click={() => openEditModal(item)}
										class="px-2 py-1 text-sm font-medium text-blue-500 hover:text-blue-700"
										>Edit</button
									>
									<button
										on:click={() => handleDelete(item.id, item.name)}
										class="px-2 py-1 text-sm font-medium text-red-500 hover:text-red-700"
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
				<h3 class="text-lg font-bold text-gray-800">{isEditMode ? 'Edit Data' : 'Tambah Ahli'}</h3>
				<button on:click={closeModal} class="text-xl text-gray-400">&times;</button>
			</div>
			<div class="overflow-y-auto p-6">
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div
						class="relative cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-4 text-center hover:bg-gray-50"
					>
						<input
							type="file"
							on:change={handleFileChange}
							accept="image/*"
							class="absolute inset-0 cursor-pointer opacity-0"
						/>
						{#if form.photo}
							<p class="text-sm font-medium text-green-600">Foto terpilih: {form.photo.name}</p>
						{:else}
							<div class="text-gray-400">
								<span class="mb-1 block text-2xl">📷</span>
								<p class="text-sm">Klik untuk {isEditMode ? 'ganti' : 'upload'} foto</p>
							</div>
						{/if}
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="col-span-2">
							<label class="mb-1 block text-sm font-medium text-gray-700">Nama</label>
							<input
								bind:value={form.name}
								type="text"
								class="w-full rounded-lg border border-gray-300 px-4 py-2"
								required
							/>
						</div>
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">Gelar</label>
							<input
								bind:value={form.title}
								type="text"
								class="w-full rounded-lg border border-gray-300 px-4 py-2"
								required
							/>
						</div>
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
							<select
								bind:value={form.category}
								class="w-full rounded-lg border border-gray-300 px-4 py-2"
								required
							>
								<option value="Ahli Gizi">Ahli Gizi</option>
								<option value="Dokter Umum">Dokter Umum</option>
								<option value="Psikolog">Psikolog</option>
							</select>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">Biaya (Rp)</label>
							<input
								bind:value={form.fee}
								type="number"
								class="w-full rounded-lg border border-gray-300 px-4 py-2"
								required
							/>
						</div>
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">No. WA (628...)</label>
							<input
								bind:value={form.wa_number}
								type="text"
								class="w-full rounded-lg border border-gray-300 px-4 py-2"
								required
							/>
						</div>
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
							class="rounded-xl bg-blue-600 px-5 py-2.5 text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
						>
							{submitLoading ? 'Menyimpan...' : 'Simpan'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
