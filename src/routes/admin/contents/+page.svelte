<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';
	import { fade, fly } from 'svelte/transition';

	let contents: any[] = [];
	let loading = true;
	let showModal = false;
	let submitLoading = false;
	let isEditMode = false;

	// Form State
	let form = {
		id: null,
		title: '',
		type: 'video', // video atau article
		category: '',
		body: '',
		url: '',
		duration: '',
		thumbnail: null as File | null
	};

	// 1. Ambil Data Konten
	async function loadContents() {
		loading = true;
		const res = await fetchApi('/contents');
		contents = Array.isArray(res) ? res : res?.data || [];
		loading = false;
	}

	// 2. Handle File
	function handleFileChange(event: any) {
		const file = event.target.files[0];
		if (file) form.thumbnail = file;
	}

	// 3. Submit (Create & Update dengan Logic Khusus)
	async function handleSubmit() {
		submitLoading = true;
		try {
			const formData = new FormData();
			formData.append('title', form.title);
			formData.append('type', form.type);
			formData.append('category', form.category);
			formData.append('body', form.body);
			formData.append('url', form.url);
			formData.append('duration', form.duration);

			if (form.thumbnail) {
				formData.append('thumbnail', form.thumbnail);
			}

			if (isEditMode && form.id) {
				// LOGIC KHUSUS UPDATE (Sesuai Postman kamu)
				// Kita pakai POST tapi kirim "_method: PUT" di body
				formData.append('_method', 'PUT');

				await fetchApi(`/contents/${form.id}`, 'POST', formData, true);
				alert('Konten berhasil diperbarui!');
			} else {
				// LOGIC CREATE BIASA
				if (!form.thumbnail) {
					alert('Wajib upload thumbnail untuk konten baru!');
					submitLoading = false;
					return;
				}
				await fetchApi('/contents', 'POST', formData, true);
				alert('Konten baru berhasil dibuat!');
			}

			closeModal();
			loadContents();
		} catch (error) {
			console.error(error);
			alert('Gagal menyimpan konten.');
		} finally {
			submitLoading = false;
		}
	}

	// 4. Delete
	async function handleDelete(id: number, title: string) {
		if (!confirm(`Hapus konten "${title}"?`)) return;

		// Coba pakai DELETE biasa dulu, kalau error, backend mungkin butuh POST + _method: DELETE
		await fetchApi(`/contents/${id}`, 'DELETE');
		loadContents();
	}

	// Helper Modal
	function openAddModal() {
		isEditMode = false;
		form = {
			id: null,
			title: '',
			type: 'video',
			category: '',
			body: '',
			url: '',
			duration: '',
			thumbnail: null
		};
		showModal = true;
	}

	function openEditModal(item: any) {
		isEditMode = true;
		// Copy data item ke form
		form = {
			id: item.id,
			title: item.title,
			type: item.type,
			category: item.category,
			body: item.body,
			url: item.url,
			duration: item.duration,
			thumbnail: null // Reset file input karena kita gak bisa set value file input
		};
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	onMount(loadContents);
</script>

<svelte:head>
	<title>Kelola Konten - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div
		class="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
	>
		<div>
			<h2 class="text-xl font-bold text-gray-800">Pustaka Konten</h2>
			<p class="text-sm text-gray-500">Artikel dan Video edukasi kesehatan.</p>
		</div>
		<button
			on:click={openAddModal}
			class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
		>
			<span>+</span> Buat Konten
		</button>
	</div>

	<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
		{#if loading}
			<div class="animate-pulse p-8 text-center text-gray-500">Memuat konten...</div>
		{:else if contents.length === 0}
			<div class="p-10 text-center text-gray-400">Belum ada konten edukasi.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead class="bg-gray-50 text-xs font-semibold tracking-wider text-gray-600 uppercase">
						<tr>
							<th class="px-6 py-4">Konten</th>
							<th class="px-6 py-4">Tipe & Kategori</th>
							<th class="px-6 py-4">Durasi/Info</th>
							<th class="px-6 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each contents as item}
							<tr class="transition hover:bg-blue-50/50">
								<td class="px-6 py-4">
									<div class="flex items-start gap-3">
										<div
											class="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-200"
										>
											{#if item.thumbnail_url}
												<img
													src={item.thumbnail_url}
													alt={item.title}
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
											<div class="line-clamp-1 font-medium text-gray-900">{item.title}</div>
											<a
												href={item.url}
												target="_blank"
												class="block max-w-[200px] truncate text-xs text-blue-500 hover:underline"
											>
												{item.url}
											</a>
										</div>
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="flex flex-col gap-1">
										<span
											class={`w-max rounded px-2 py-0.5 text-xs font-bold ${item.type === 'video' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
										>
											{item.type?.toUpperCase()}
										</span>
										<span class="text-xs text-gray-500">{item.category}</span>
									</div>
								</td>
								<td class="px-6 py-4 text-sm text-gray-600">
									⏱ {item.duration || '-'}
								</td>
								<td class="space-x-2 px-6 py-4 text-right">
									<button
										on:click={() => openEditModal(item)}
										class="rounded px-2 py-1 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
										>Edit</button
									>
									<button
										on:click={() => handleDelete(item.id, item.title)}
										class="rounded px-2 py-1 text-sm font-medium text-red-500 transition hover:bg-red-50"
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
			class="z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
			transition:fly={{ y: 20, duration: 300 }}
		>
			<div class="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
				<h3 class="text-lg font-bold text-gray-800">
					{isEditMode ? 'Edit Konten' : 'Tambah Konten Baru'}
				</h3>
				<button on:click={closeModal} class="text-xl text-gray-400 hover:text-red-500"
					>&times;</button
				>
			</div>

			<div class="overflow-y-auto p-6">
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Judul Konten</label>
						<input
							bind:value={form.title}
							type="text"
							class="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Judul Video/Artikel"
							required
						/>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">Tipe</label>
							<select
								bind:value={form.type}
								class="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="video">Video</option>
								<option value="article">Artikel</option>
							</select>
						</div>
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
							<input
								bind:value={form.category}
								type="text"
								class="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Fisik / Mental"
								required
							/>
						</div>
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">Durasi</label>
							<input
								bind:value={form.duration}
								type="text"
								class="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="15 Menit"
							/>
						</div>
					</div>

					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700"
							>Link URL (YouTube/Artikel)</label
						>
						<input
							bind:value={form.url}
							type="text"
							class="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="https://youtube.com/..."
						/>
					</div>

					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Deskripsi / Isi</label>
						<textarea
							bind:value={form.body}
							class="h-24 w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Penjelasan singkat..."
						></textarea>
					</div>

					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Thumbnail Gambar</label>
						<div class="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5">
							<input
								type="file"
								on:change={handleFileChange}
								accept="image/*"
								class="w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
							/>
						</div>
						{#if isEditMode}
							<p class="mt-1 text-xs text-orange-500">
								*Kosongkan jika tidak ingin mengubah gambar.
							</p>
						{/if}
					</div>

					<div class="mt-4 flex justify-end gap-3 border-t border-gray-100 pt-4">
						<button
							type="button"
							on:click={closeModal}
							class="rounded-xl px-5 py-2.5 font-medium text-gray-600 transition hover:bg-gray-100"
							>Batal</button
						>
						<button
							type="submit"
							disabled={submitLoading}
							class="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-50"
						>
							{submitLoading ? 'Menyimpan...' : 'Simpan Konten'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
