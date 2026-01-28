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

	// 1. READ
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

	// 2. Handle File
	function handleFileChange(event: any) {
		const file = event.target.files[0];
		if (file) form.photo = file;
	}

	// 3. CREATE & UPDATE
	async function handleSubmit() {
		submitLoading = true;
		try {
			const formData = new FormData();
			formData.append('name', form.name);
			formData.append('title', form.title);
			formData.append('category', form.category);
			formData.append('fee', form.fee.toString());
			formData.append('wa_number', form.wa_number);
			formData.append('is_online', '1'); // Default online

			if (form.photo) {
				formData.append('photo', form.photo);
			}

			if (isEditMode && form.id) {
				formData.append('_method', 'PUT'); // Method spoofing for Laravel
				await fetchApi(`/experts/${form.id}`, 'POST', formData, true);
				alert('Data berhasil diupdate!');
			} else {
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

	// 4. DELETE
	async function handleDelete(id: number, name: string) {
		if (!confirm(`Hapus ahli "${name}"?`)) return;
		try {
			await fetchApi(`/experts/${id}`, 'DELETE');
			loadExperts();
		} catch (error: any) {
			alert(error.message || 'Gagal menghapus data.');
		}
	}

	// Helper Modal
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
		form = {
			id: item.id,
			name: item.name,
			title: item.title,
			category: item.category,
			fee: item.fee,
			wa_number: item.wa_number,
			is_online: item.is_online,
			photo: null
		};
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	// Helper Image URL (Sama kayak user app)
	function resolveImage(url: string) {
		if (!url) return null;
		if (url.startsWith('http')) return url;
		// Asumsi base URL localhost jika perlu, atau relative path
		return `http://localhost:8000/storage/${url}`;
	}

	onMount(loadExperts);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">Daftar Ahli Kesehatan</h2>
			<p class="text-sm text-gray-500">Kelola dokter, ahli gizi, dan psikolog.</p>
		</div>
		<button
			on:click={openAddModal}
			class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:scale-105 hover:bg-blue-700"
		>
			<i class="fa-solid fa-plus"></i> Tambah Ahli
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
				<p class="mt-4 text-sm font-medium text-gray-500">Memuat data ahli...</p>
			</div>
		{:else if experts.length === 0}
			<div class="flex flex-col items-center p-16 text-center text-slate-400">
				<i class="fa-solid fa-user-doctor mb-3 text-4xl text-slate-300"></i>
				<h3 class="text-lg font-medium text-gray-600">Belum ada data</h3>
				<p class="text-sm">Silakan tambahkan ahli kesehatan baru.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead
						class="bg-slate-50/50 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase"
					>
						<tr>
							<th class="px-8 py-4">Profil</th>
							<th class="px-8 py-4">Kategori</th>
							<th class="px-8 py-4">Biaya</th>
							<th class="px-8 py-4">Status</th>
							<th class="px-8 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-50 bg-white text-sm font-medium">
						{#each experts as item}
							<tr class="transition hover:bg-slate-50/50">
								<td class="px-8 py-5">
									<div class="flex items-center gap-4">
										<div
											class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-50 shadow-sm"
										>
											{#if item.photo || item.photo_url}
												<img
													src={resolveImage(item.photo_url || item.photo)}
													alt={item.name}
													class="h-full w-full object-cover"
												/>
											{:else}
												<div class="flex h-full w-full items-center justify-center text-slate-300">
													<i class="fa-solid fa-user text-lg"></i>
												</div>
											{/if}
										</div>
										<div>
											<div class="font-bold text-slate-800">{item.name}</div>
											<div class="text-xs font-bold tracking-wide text-blue-500 uppercase">
												{item.title}
											</div>
										</div>
									</div>
								</td>
								<td class="px-8 py-5">
									<span
										class="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
									>
										{item.category}
									</span>
								</td>
								<td class="px-8 py-5 font-mono font-bold text-green-600">
									Rp {parseInt(item.fee || 0).toLocaleString('id-ID')}
								</td>
								<td class="px-8 py-5">
									{#if item.is_online}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-green-600 uppercase"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span> Online
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-slate-500 uppercase"
										>
											Offline
										</span>
									{/if}
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
					{isEditMode ? 'Edit Expert' : 'Tambah Expert'}
				</h3>
				<button on:click={closeModal} class="text-slate-400 transition hover:text-red-500"
					><i class="fa-solid fa-xmark text-xl"></i></button
				>
			</div>

			<div class="max-h-[80vh] overflow-y-auto p-8">
				<form on:submit|preventDefault={handleSubmit} class="space-y-5">
					<div class="flex justify-center">
						<div class="group relative cursor-pointer">
							<input
								type="file"
								on:change={handleFileChange}
								accept="image/*"
								class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
							/>
							<div
								class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 transition group-hover:border-blue-400 group-hover:bg-blue-50"
							>
								{#if form.photo}
									<div class="px-2 text-center text-xs font-bold text-blue-600">
										{form.photo.name}
									</div>
								{:else}
									<i class="fa-solid fa-camera text-2xl text-slate-300 group-hover:text-blue-400"
									></i>
								{/if}
							</div>
							<div
								class="mt-2 text-center text-xs font-bold tracking-wide text-slate-400 uppercase"
							>
								Foto Profil
							</div>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-5">
						<div class="col-span-2">
							<label class="mb-1.5 block text-xs font-bold text-slate-500 uppercase"
								>Nama Lengkap</label
							>
							<input
								bind:value={form.name}
								type="text"
								class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
								required
								placeholder="Dr. Fulan bin Fulan"
							/>
						</div>

						<div>
							<label class="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Gelar</label>
							<input
								bind:value={form.title}
								type="text"
								class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
								required
								placeholder="Sp.JP"
							/>
						</div>

						<div>
							<label class="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Kategori</label
							>
							<select
								bind:value={form.category}
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
								required
							>
								<option value="" disabled>Pilih...</option>
								<option value="Ahli Gizi">Ahli Gizi</option>
								<option value="Dokter Umum">Dokter Umum</option>
								<option value="Psikolog">Psikolog</option>
								<option value="Fisio Teraphy">Fisio Teraphy</option>
								<option value="Konsultan Holistic">Konsultan Holistic</option>
								<option value="Konsultan Spiritual">Konsultan Spiritual</option>
							</select>
						</div>

						<div>
							<label class="mb-1.5 block text-xs font-bold text-slate-500 uppercase"
								>Biaya (Rp)</label
							>
							<input
								bind:value={form.fee}
								type="number"
								class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
								required
								placeholder="50000"
							/>
						</div>

						<div>
							<label class="mb-1.5 block text-xs font-bold text-slate-500 uppercase"
								>WhatsApp (628...)</label
							>
							<input
								bind:value={form.wa_number}
								type="text"
								class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
								required
								placeholder="62812345678"
							/>
						</div>
					</div>

					<div class="flex gap-3 pt-6">
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
							{submitLoading ? 'Menyimpan...' : 'Simpan Data'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
