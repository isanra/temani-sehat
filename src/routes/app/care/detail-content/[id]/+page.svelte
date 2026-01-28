<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fade, slide, fly } from 'svelte/transition';
	const API_BASE = 'https://nondeprecatively-overdiligent-sonja.ngrok-free.dev/api';

	import Button from '$lib/components/ui/Button.svelte';

	// Ambil ID
	let contentId = $page.params.id;

	let content = $state(null);
	let isLoading = $state(true);

	// --- DUMMY DATA ---
	const dummyDetail = {
		id: 1,
		title: 'Mengatasi Panic Attack dengan Teknik 5-4-3-2-1',
		category: 'Motivasi',
		type: 'Artikel',
		image:
			'https://plus.unsplash.com/premium_photo-1697474429687-5fbfdd7622d3?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
		content: `
            <p class="mb-4">Panic attack atau serangan panik bisa datang kapan saja tanpa peringatan. Gejalanya bisa berupa jantung berdebar kencang, sesak napas, hingga perasaan takut yang luar biasa.</p>
            <p class="mb-6">Namun, ada teknik sederhana yang bisa kamu lakukan untuk meredakannya, yaitu teknik grounding <strong>5-4-3-2-1</strong>.</p>
            
            <h3 class="text-lg font-bold text-slate-800 mb-3">Apa itu Teknik 5-4-3-2-1?</h3>
            <p class="mb-4">Teknik ini bertujuan untuk mengalihkan fokus otak dari kecemasan ke lingkungan sekitar menggunakan panca indera. Caranya:</p>
            
            <ul class="space-y-2 mb-6 list-none pl-0">
                <li class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 font-bold text-sm">5</span>
                    <span>Benda yang bisa kamu <strong>lihat</strong>.</span>
                </li>
                <li class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 font-bold text-sm">4</span>
                    <span>Benda yang bisa kamu <strong>sentuh</strong>.</span>
                </li>
                <li class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 font-bold text-sm">3</span>
                    <span>Suara yang bisa kamu <strong>dengar</strong>.</span>
                </li>
            </ul>
            
            <p>Lakukan perlahan sambil mengatur napas. Tarik napas dalam-dalam, tahan sejenak, lalu hembuskan perlahan. Kamu pasti bisa melaluinya!</p>
        `,
		created_at: '2026-01-27',
		author: 'Dr. Sarah',
		role: 'Psikiater'
	};

	onMount(async () => {
		await loadContentDetail();
	});

	async function loadContentDetail() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE}/contents/${contentId}`, {
				headers: { 'ngrok-skip-browser-warning': 'true' }
			});
			const result = await res.json();
			content = res.ok && result.data ? result.data : dummyDetail;
		} catch (e) {
			content = dummyDetail;
		} finally {
			isLoading = false;
		}
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

	{#if content}
		<div
			in:fly={{ y: 50, duration: 500, delay: 300 }}
			class="fixed bottom-0 z-40 w-full border-t border-slate-100 bg-white/80 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl"
		>
			<!-- <div class="mx-auto flex max-w-3xl items-center gap-4">
				<div class="flex-1">
					<p class="text-[10px] font-bold text-slate-400 uppercase">Sudah dibaca?</p>
					<p class="text-xs font-bold text-slate-700">Tandai Selesai</p>
				</div>
				<Button
					className="rounded-2xl bg-slate-900 px-8 py-3 text-white shadow-lg shadow-slate-300 hover:scale-105 active:scale-95 transition-transform"
				>
					<i class="fa-solid fa-check-circle mr-2"></i> Selesai
				</Button>
			</div> -->
		</div>
	{/if}
</div>
