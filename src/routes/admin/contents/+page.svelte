<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/utils/api';
	import { fade, fly, slide } from 'svelte/transition';

	let contents: any[] = [];
	let loading = true;
	let showModal = false;
	let isEditMode = false;
	let submitLoading = false;

	let form = {
		id: null,
		title: '',
		type: 'article',
		category: '',
		url: '',
		body: '',
		thumbnail: null as File | null
	};

	async function loadContents() {
		loading = true;
		try {
			const res = await fetchApi('/contents');
			contents = Array.isArray(res) ? res : res?.data || [];
		} catch (error) {
			console.error(error);
			contents = [];
		} finally {
			loading = false;
		}
	}

	function handleFileChange(event: any) {
		const file = event.target.files[0];
		if (file) form.thumbnail = file;
	}

	async function handleSubmit() {
		submitLoading = true;
		try {
			const formData = new FormData();
			formData.append('title', form.title);
			formData.append('type', form.type);
			formData.append('category', form.category);
			if (form.type === 'video') formData.append('url', form.url);
			if (form.type === 'article') formData.append('body', form.body);
			if (form.thumbnail) formData.append('thumbnail', form.thumbnail);

			if (isEditMode && form.id) {
				// Gunakan POST dengan _method PUT untuk update file
				formData.append('_method', 'PUT');
				await fetchApi(`/contents/${form.id}`, 'POST', formData, true);
				alert('Berhasil diperbarui!');
			} else {
				if (!form.thumbnail) return alert('Thumbnail wajib diisi!');
				await fetchApi('/contents', 'POST', formData, true);
				alert('Berhasil ditambahkan!');
			}
			closeModal();
			loadContents();
		} catch (e: any) {
			alert(e.message || 'Gagal simpan');
		} finally {
			submitLoading = false;
		}
	}

	async function handleDelete(id: number) {
		if (!confirm('Hapus konten ini?')) return;
		await fetchApi(`/contents/${id}`, 'DELETE');
		loadContents();
	}

	function openAddModal() {
		isEditMode = false;
		form = {
			id: null,
			title: '',
			type: 'article',
			category: '',
			url: '',
			body: '',
			thumbnail: null
		};
		showModal = true;
	}

	function openEditModal(item: any) {
		isEditMode = true;
		form = { ...item, thumbnail: null };
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	function resolveImage(url: string) {
		if (!url) return null;
		if (url.startsWith('http')) return url;
		return `http://localhost:8000/storage/${url}`;
	}

	onMount(loadContents);
</script>

<div class="space-y-8">
	<div
		class="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50"
	>
		<div>
			<h2 class="text-2xl font-extrabold text-slate-800">Pustaka Konten</h2>
			<p class="text-sm font-medium text-slate-500">Kelola artikel & video edukasi.</p>
		</div>
		<button
			on:click={openAddModal}
			class="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:scale-105 hover:bg-blue-700"
		>
			<i class="fa-solid fa-plus"></i> Tambah Konten
		</button>
	</div>

	{#if loading}
		<div class="py-20 text-center text-slate-400">Memuat data...</div>
	{:else if contents.length === 0}
		<div class="py-20 text-center text-slate-400">Belum ada konten.</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each contents as item}
				<div
					class="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
				>
					<div class="relative h-48 w-full overflow-hidden bg-slate-100">
						{#if item.thumbnail}
							<img
								src={resolveImage(item.thumbnail)}
								alt={item.title}
								class="h-full w-full object-cover transition duration-500 group-hover:scale-110"
							/>
						{/if}
						<div
							class="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
						>
							<button
								on:click={() => openEditModal(item)}
								class="h-10 w-10 rounded-full bg-white text-blue-600"
								><i class="fa-solid fa-pen"></i></button
							>
							<button
								on:click={() => handleDelete(item.id)}
								class="h-10 w-10 rounded-full bg-white text-red-600"
								><i class="fa-solid fa-trash"></i></button
							>
						</div>
						<span
							class="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold tracking-wide text-slate-800 uppercase shadow-sm backdrop-blur-md"
							>{item.type}</span
						>
					</div>
					<div class="flex-1 p-5">
						<span
							class="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase"
							>{item.category}</span
						>
						<h3 class="mt-2 line-clamp-2 text-lg leading-tight font-bold text-slate-800">
							{item.title}
						</h3>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
	>
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" on:click={closeModal}></div>
		<div
			class="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
			in:slide={{ axis: 'y' }}
		>
			<div
				class="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4"
			>
				<h3 class="font-bold text-slate-800">{isEditMode ? 'Edit' : 'Tambah'} Konten</h3>
				<button on:click={closeModal}><i class="fa-solid fa-xmark text-slate-400"></i></button>
			</div>
			<div class="max-h-[80vh] overflow-y-auto p-6">
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div
						class="relative cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center"
					>
						<input
							type="file"
							on:change={handleFileChange}
							class="absolute inset-0 cursor-pointer opacity-0"
						/>
						<span class="text-sm font-bold text-slate-500"
							>{form.thumbnail ? form.thumbnail.name : 'Upload Thumbnail'}</span
						>
					</div>
					<div>
						<label class="mb-1 block text-xs font-bold text-slate-500 uppercase">Judul</label>
						<input
							bind:value={form.title}
							type="text"
							class="w-full rounded-xl border-slate-200 px-4 py-2"
							required
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="mb-1 block text-xs font-bold text-slate-500 uppercase">Tipe</label>
							<select bind:value={form.type} class="w-full rounded-xl border-slate-200 px-4 py-2">
								<option value="article">Artikel</option>
								<option value="video">Video</option>
							</select>
						</div>
						<div>
							<label class="mb-1 block text-xs font-bold text-slate-500 uppercase">Kategori</label>
							<select
								bind:value={form.category}
								class="w-full rounded-xl border-slate-200 px-4 py-2"
								required
							>
								<option value="Motivasi">Motivasi</option>
								<option value="Pola Makan">Pola Makan</option>
								<option value="Amalan">Amalan</option>
								<option value="Obat">Obat</option>
								<option value="Fisik">Fisik</option>
							</select>
						</div>
					</div>
					{#if form.type === 'video'}
						<div>
							<label class="mb-1 block text-xs font-bold text-slate-500 uppercase"
								>URL Youtube</label
							>
							<input
								bind:value={form.url}
								type="url"
								class="w-full rounded-xl border-slate-200 px-4 py-2"
							/>
						</div>
					{:else}
						<div>
							<label class="mb-1 block text-xs font-bold text-slate-500 uppercase"
								>Isi Artikel</label
							>
							<textarea
								bind:value={form.body}
								rows="5"
								class="w-full rounded-xl border-slate-200 px-4 py-2"
							></textarea>
						</div>
					{/if}
					<button
						disabled={submitLoading}
						class="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg hover:bg-blue-700"
					>
						{submitLoading ? 'Menyimpan...' : 'Simpan'}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
