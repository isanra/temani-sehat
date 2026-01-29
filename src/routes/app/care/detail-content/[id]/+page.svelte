<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fade, slide, fly } from 'svelte/transition';
	import { API_BASE_URL } from '$lib/utils/api';

	import Button from '$lib/components/ui/Button.svelte';

	// 1. JADIKAN ID REAKTIF (Agar berubah saat URL berubah)
	let contentId = $derived($page.params.id);

	let content = $state(null);
	let isLoading = $state(true);

	// 2. GUNAKAN $effect UNTUK MEMANTAU PERUBAHAN ID
	$effect(() => {
		if (contentId) {
			loadContentDetail(contentId);
		}
	});

	async function loadContentDetail(id) {
		isLoading = true;
		try {
			const token = localStorage.getItem('auth_token');
			const res = await fetch(`${API_BASE_URL}/contents/${id}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				}
			});
			const result = await res.json();

			if (res.ok && result.data) {
				const d = result.data;
				content = {
					id: d.id,
					title: d.title,
					category: d.category || 'Umum',
					type: d.type || 'Artikel',
					image: resolveImage(d.thumbnail),
					content: d.body || d.description || '<p>Tidak ada isi konten.</p>',
					videoUrl: getYoutubeEmbed(d.url),
					created_at: new Date(d.created_at).toLocaleDateString('id-ID', {
						day: 'numeric',
						month: 'long',
						year: 'numeric'
					}),
					author: d.author || 'Tim Temani Sehat',
					role: 'Official Creator'
				};
			} else {
				content = null; // Jika data tidak ditemukan
			}
		} catch (e) {
			console.error('Gagal load detail:', e);
			content = null;
		} finally {
			isLoading = false;
		}
	}

	function resolveImage(url) {
		if (!url) return null;
		if (url.startsWith('http')) return url;
		const baseUrl = API_BASE_URL.replace('/api', '');
		return `${baseUrl}/storage/${url}`;
	}

	function getYoutubeEmbed(url) {
		if (!url) return null;
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
	}

	function goBack() {
		history.back();
	}
</script>

<div class="min-h-screen bg-slate-50 font-sans text-slate-800">
	<div
		class="fixed top-0 left-0 z-0 h-80 w-full rounded-b-[3rem] bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-700 shadow-2xl shadow-cyan-900/20"
	>
		<div
			class="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
		></div>
		<div
			class="pointer-events-none absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl"
		></div>
	</div>

	<nav class="fixed top-0 z-50 flex w-full items-center justify-between px-6 py-6 text-white">
		<button
			onclick={goBack}
			class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/20 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white/30 active:scale-95"
		>
			<i class="fa-solid fa-arrow-left"></i>
		</button>
	</nav>

	<main class="relative z-10 mx-auto max-w-3xl px-4 pt-24 pb-28">
		{#if isLoading}
			<div class="flex animate-pulse flex-col items-center justify-center py-40 text-white">
				<div
					class="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white"
				></div>
				<p class="font-medium text-white/80">Menyiapkan konten...</p>
			</div>
		{:else if content}
			<div
				in:fly={{ y: 20, duration: 500 }}
				class="relative mb-6 overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-300/50"
			>
				<div class="relative h-64 w-full md:h-80">
					{#if content.image}
						<img src={content.image} alt={content.title} class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
							<i class="fa-solid fa-image text-6xl"></i>
						</div>
					{/if}

					{#if content.type === 'Video'}
						<div
							class="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
						>
							<div
								class="flex h-16 w-16 animate-pulse cursor-pointer items-center justify-center rounded-full bg-white/90 pl-1 shadow-2xl transition-transform hover:scale-110"
							>
								<i class="fa-solid fa-play text-2xl text-slate-800"></i>
							</div>
						</div>
					{/if}

					<div class="absolute top-4 left-4">
						<span
							class="rounded-full bg-white/90 px-4 py-1.5 text-xs font-extrabold tracking-wider text-cyan-600 uppercase shadow-md backdrop-blur-md"
						>
							{content.category}
						</span>
					</div>
				</div>
			</div>

			<div
				in:slide={{ duration: 400, delay: 100 }}
				class="min-h-[50vh] rounded-[2.5rem] border border-slate-50 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-10"
			>
				<div class="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 shadow-inner"
						>
							<i class="fa-solid fa-user-doctor text-sm"></i>
						</div>
						<div>
							<p class="text-xs font-bold tracking-wide text-slate-400 uppercase">Penulis</p>
							<p class="text-sm font-bold text-slate-800">
								{content.author || 'Tim Medis'}
								<span class="text-xs font-normal text-slate-400">({content.role || 'Expert'})</span>
							</p>
						</div>
					</div>
					<div class="text-right">
						<p class="text-xs font-bold tracking-wide text-slate-400 uppercase">Tanggal</p>
						<p class="text-sm font-bold text-slate-800">{content.created_at || 'Hari ini'}</p>
					</div>
				</div>

				<h1 class="mb-6 text-2xl leading-tight font-black text-slate-800 md:text-3xl">
					{content.title}
				</h1>

				<article
					class="prose max-w-none leading-relaxed prose-slate prose-headings:text-slate-800 prose-p:text-slate-600 prose-a:text-cyan-600"
				>
					{@html content.content}
				</article>
			</div>
		{:else}
			<div class="mt-20 rounded-3xl bg-white p-10 text-center shadow-xl">
				<i class="fa-solid fa-file-circle-xmark mb-4 text-5xl text-slate-300"></i>
				<h3 class="text-lg font-bold text-slate-700">Konten Tidak Ditemukan</h3>
				<p class="mt-2 text-sm text-slate-500">
					Maaf, konten yang Anda cari mungkin sudah dihapus atau tidak tersedia.
				</p>
				<button onclick={goBack} class="mt-6 font-bold text-cyan-600 hover:underline"
					>Kembali</button
				>
			</div>
		{/if}
	</main>
</div>
