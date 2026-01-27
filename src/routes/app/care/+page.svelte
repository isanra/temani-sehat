<script>
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	const API_BASE = 'https://nondeprecatively-overdiligent-sonja.ngrok-free.dev/api'; // Pastikan path config benar

	import Header from '$lib/components/Header.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	// --- STATE ---
	let contents = $state([]);
	let recommendations = $state([]);
	let isLoading = $state(false);
	let selectedCategory = $state('Semua');
	let searchQuery = $state('');

	// KATEGORI
	let contentCategories = [
		{ id: 'Semua', label: 'Semua', icon: 'fa-layer-group' },
		{ id: 'Motivasi', label: 'Motivasi', icon: 'fa-lightbulb' },
		{ id: 'Pola Makan', label: 'Pola Makan', icon: 'fa-utensils' },
		{ id: 'Amalan', label: 'Amalan', icon: 'fa-hands-praying' },
		{ id: 'Obat', label: 'Obat', icon: 'fa-pills' },
		{ id: 'Olahraga', label: 'Fisik', icon: 'fa-person-running' }
	];

	// --- DUMMY DATA ---
	const dummyContents = [
		{
			id: 1,
			title: 'Mengatasi Panic Attack',
			category: 'Motivasi',
			image: null,
			icon: '🎬',
			type: 'Video',
			duration: '5 Min',
			bg: 'bg-slate-100',
			tagColor: 'bg-cyan-50 text-cyan-600'
		},
		{
			id: 2,
			title: 'Keajaiban Dzikir Pagi',
			category: 'Amalan',
			image: null,
			icon: '📖',
			type: 'Artikel',
			duration: 'Baca',
			bg: 'bg-slate-100',
			tagColor: 'bg-orange-50 text-orange-600'
		},
		{
			id: 3,
			title: 'Menu Diet Sehat',
			category: 'Pola Makan',
			image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
			icon: '🥗',
			type: 'Video',
			duration: '10 Min',
			bg: 'bg-slate-100',
			tagColor: 'bg-green-50 text-green-600'
		},
		{
			id: 4,
			title: 'Yoga Untuk Pemula',
			category: 'Olahraga',
			image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
			icon: '🧘',
			type: 'Video',
			duration: '15 Min',
			bg: 'bg-slate-100',
			tagColor: 'bg-blue-50 text-blue-600'
		},
		{
			id: 5,
			title: 'Jadwal Minum Obat',
			category: 'Obat',
			image: null,
			icon: '💊',
			type: 'Artikel',
			duration: 'Baca',
			bg: 'bg-slate-100',
			tagColor: 'bg-red-50 text-red-600'
		}
	];

	const dummyRecommendations = [
		{
			category: 'Pola Makan',
			icon: 'fa-bowl-food',
			color: 'text-orange-500 bg-orange-50',
			border: 'border-orange-100',
			items: ['Kurangi garam < 5g', 'Minum 8 gelas air']
		},
		{
			category: 'Ibadah',
			icon: 'fa-hands-praying',
			color: 'text-emerald-500 bg-emerald-50',
			border: 'border-emerald-100',
			items: ['Dzikir pagi', 'Sholat Dhuha']
		}
	];

	// --- LOGIC ---
	let filteredContents = $derived(
		contents.filter((c) => {
			const matchCat = selectedCategory === 'Semua' || c.category.includes(selectedCategory);
			const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
			return matchCat && matchSearch;
		})
	);

	onMount(async () => {
		loadContents();
		recommendations = dummyRecommendations;
	});

	async function loadContents() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE}/contents`, {
				headers: { 'ngrok-skip-browser-warning': 'true' }
			});
			const result = await res.json();

			if (res.ok && result.data && result.data.length > 0) {
				contents = result.data.map((item) => ({
					...item,
					image: item.image || null,
					icon: '📄',
					bg: 'bg-slate-100',
					tagColor: 'bg-slate-100 text-slate-600'
				}));
			} else {
				contents = dummyContents;
			}
		} catch (e) {
			contents = dummyContents;
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-slate-50 pb-28 font-sans text-slate-800">
	<Header />

	<main class="relative z-20 mx-auto -mt-20 max-w-4xl space-y-10 px-6 md:px-8">
		<div in:slide>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="flex items-center gap-2 text-xl font-bold text-white">
					<i class="fa-solid fa-clipboard-check"></i> Rekomendasi Hari Ini
				</h3>
			</div>

			<div class="scrollbar-hide -mx-6 flex gap-4 overflow-x-auto px-6 py-2">
				{#each recommendations as reco}
					<div
						class="min-w-[200px] flex-shrink-0 rounded-3xl border bg-white p-5 shadow-sm {reco.border} transition-all hover:-translate-y-1 hover:shadow-md"
					>
						<div class="mb-4 flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full {reco.color}">
								<i class="fa-solid {reco.icon}"></i>
							</div>
							<h4 class="text-sm font-bold text-slate-700">{reco.category}</h4>
						</div>
						<ul class="space-y-2">
							{#each reco.items as item}
								<li class="flex items-start gap-2 text-xs font-medium text-slate-500">
									<i class="fa-solid fa-check mt-0.5 text-cyan-500"></i>
									<span>{item}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>

		<hr class="border-slate-200" />

		<div in:fade>
			<h3 class="mb-4 text-xl font-bold text-slate-800">Pustaka Edukasi</h3>

			<div class="relative mb-6">
				<i
					class="fa-solid fa-magnifying-glass absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
				></i>
				<input
					bind:value={searchQuery}
					type="text"
					placeholder="Cari artikel, video, atau tips..."
					class="w-full rounded-full border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm font-medium transition-all outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-50"
				/>
			</div>

			<div class="mb-8">
				<div class="scrollbar-hide -mx-6 flex gap-2 overflow-x-auto px-6">
					{#each contentCategories as cat}
						<button
							onclick={() => (selectedCategory = cat.id)}
							class="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition-all {selectedCategory ===
							cat.id
								? 'border-cyan-600 bg-cyan-600 text-white'
								: 'border-slate-200 bg-white text-slate-500 hover:border-cyan-400'}"
						>
							{cat.label}
						</button>
					{/each}
				</div>
			</div>

			{#if isLoading}
				<div class="animate-pulse py-20 text-center text-slate-400">Memuat konten...</div>
			{:else}
				<div class="grid grid-cols-1 gap-6 pb-10 sm:grid-cols-2 lg:grid-cols-3">
					{#each filteredContents as item}
						<a href={`/app/care/detail-content/${item.id}`} class="block h-full">
							<Card
								className="flex flex-col p-4 border-slate-100 hover:shadow-lg cursor-pointer transition-all hover:-translate-y-1 rounded-3xl h-full"
							>
								<div
									class="group relative mb-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100"
								>
									{#if item.image}
										<img
											src={item.image}
											alt={item.title}
											class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
										/>
										{#if item.type === 'Video'}
											<div
												class="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
											>
												<div
													class="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 pl-1 shadow-lg"
												>
													<i class="fa-solid fa-play text-sm text-slate-800"></i>
												</div>
											</div>
										{/if}
									{:else}
										<span
											class="text-6xl opacity-50 grayscale filter transition-all group-hover:opacity-100 group-hover:grayscale-0"
											>{item.icon}</span
										>
									{/if}
								</div>

								<div class="flex flex-1 flex-col">
									<div class="mb-2 flex items-start justify-between">
										<span
											class="rounded-lg px-2 py-1 text-[10px] font-bold tracking-wider uppercase {item.tagColor ||
												'bg-cyan-50 text-cyan-600'}">{item.category}</span
										>
										<span class="flex items-center gap-1 text-[10px] font-bold text-slate-400"
											><i class="fa-regular fa-clock"></i> {item.duration}</span
										>
									</div>
									<h4 class="mb-2 line-clamp-2 text-base leading-snug font-bold text-slate-800">
										{item.title}
									</h4>
									<p class="mt-auto line-clamp-2 text-xs text-slate-500">
										{item.desc || 'Pelajari lebih lanjut tentang topik ini.'}
									</p>
								</div>
							</Card>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</main>
	<Navbar />
</div>
