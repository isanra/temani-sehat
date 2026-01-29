<script>
	import { onMount } from 'svelte';
	import { scale, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/userStore.svelte.js';
	import { API_BASE_URL } from '$lib/utils/api'; // Pastikan path benar

	import Header from '$lib/components/Header.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let activeTab = $state('home');
	let isSubmitted = $state(false);
	let isLoading = $state(false);
	let isLoaded = $state(false);

	// --- STATE DATA ---
	let wisdom = $state(null);
	let isWisdomRevealed = $state(false);
	let allContents = $state([]);
	let recommendations = $state([]);

	let trackingData = $state({
		mood_score: null,
		medication_taken: false,
		prayer_completed: false,
		diet_complied: false,
		exercise_done: false,
		notes: ''
	});

	const moodLabels = {
		1: 'Hari ini berat banget ya?',
		2: 'Lagi ngerasa nggak oke ya?',
		3: 'Hari ini biasa aja?',
		4: 'Kayaknya lagi happy nih?',
		5: 'Wah, hari ini luar biasa ya!'
	};

	// --- DUMMY DATA (FALLBACK) ---
	const dummyWisdom = {
		id: 99,
		quote:
			'Jangan menyerah saat doa-doamu belum terjawab. Jika kamu mampu bersabar, Allah mampu memberikan lebih dari apa yang kamu minta.',
		author: 'Daily Reminder'
	};

	const dummyContents = [
		{
			id: 'd1',
			title: '5 Makanan Sehat Pemicu Mood Bagus',
			category: 'Pola Makan',
			type: 'Artikel',
			duration: 'Baca',
			image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400'
		},
		{
			id: 'd2',
			title: 'Panduan Sholat Khusyuk',
			category: 'Ibadah',
			type: 'Video',
			duration: '10 Min',
			image: 'https://images.unsplash.com/photo-1685186113147-715dec63002e?w=400'
		},
		{
			id: 'd3',
			title: 'Olahraga Ringan di Rumah',
			category: 'Aktivitas Fisik',
			type: 'Video',
			duration: '15 Min',
			image: 'https://plus.unsplash.com/premium_photo-1682088265889-8ab7586a0d18?w=400'
		}
	];

	const dummyRecommendations = [
		{ category: 'Pola Makan', title: 'Kurangi Gula' },
		{ category: 'Ibadah', title: 'Perbanyak Dzikir' }
	];

	// --- 1. LOGIKA FILTER EDUKASI ---
	let educationList = $derived.by(() => {
		const sourceContents = allContents.length > 0 ? allContents : dummyContents;

		if (!isSubmitted) {
			return sourceContents.slice(0, 3);
		}

		const sourceRecommendations =
			recommendations.length > 0 ? recommendations : dummyRecommendations;
		const recoCategories = sourceRecommendations.map((r) => r.category);

		// Filter konten yang sesuai rekomendasi
		const filtered = sourceContents.filter((content) => recoCategories.includes(content.category));
		return filtered.length > 0 ? filtered.slice(0, 3) : sourceContents.slice(0, 3);
	});

	// --- 2. LOGIKA SKOR ---
	let dailyScore = $derived.by(() => {
		let score = 0;
		if (trackingData.medication_taken) score += 20;
		if (trackingData.prayer_completed) score += 20;
		if (trackingData.diet_complied) score += 20;
		if (trackingData.exercise_done) score += 20;
		if (trackingData.mood_score) score += trackingData.mood_score * 4;
		return Math.min(100, score);
	});

	// --- 3. AUTO-SAVE LOCAL ---
	function getStorageKey() {
		const storedUser = localStorage.getItem('user_data');
		let userId = 'guest';
		if (storedUser) {
			try {
				userId = JSON.parse(storedUser).email || 'guest';
			} catch (e) {}
		}
		return `tracking_draft_${userId}`;
	}

	function saveDraft() {
		if (!isLoaded) return;
		const key = getStorageKey();
		const payload = {
			date: new Date().toDateString(),
			data: trackingData,
			isSubmitted: isSubmitted
		};
		localStorage.setItem(key, JSON.stringify(payload));
		userStore.updateScore(dailyScore);
	}

	$effect(() => {
		const _trigger = dailyScore + isSubmitted; // Trigger reactive update
		saveDraft();
	});

	onMount(async () => {
		await loadAllContents();

		// Restore Session
		const key = getStorageKey();
		const savedRaw = localStorage.getItem(key);
		const todayStr = new Date().toDateString();

		if (savedRaw) {
			try {
				const saved = JSON.parse(savedRaw);
				if (saved.date === todayStr) {
					trackingData = saved.data || trackingData;
					isSubmitted = saved.isSubmitted || false;
					userStore.updateScore(dailyScore);

					if (isSubmitted) {
						await loadRecommendations();
						if (trackingData.mood_score) {
							const moodStr = moodLabels[trackingData.mood_score];
							await loadWisdom(moodStr);
						}
					}
				} else {
					localStorage.removeItem(key);
					userStore.resetScore();
				}
			} catch (e) {}
		}
		isLoaded = true;
	});

	// --- API CALLS ---

	// 1. GET Wisdom (Kata Bijak)
	async function loadWisdom(moodString) {
		try {
			const token = localStorage.getItem('auth_token');
			// Kirim mood sebagai query param jika ada
			const query = moodString ? `?mood=${encodeURIComponent(moodString)}` : '';
			const res = await fetch(`${API_BASE_URL}/wisdom${query}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				}
			});
			const result = await res.json();

			if (res.ok && result.data) {
				// Mapping response backend ke format frontend
				wisdom = {
					id: result.data.id,
					quote: result.data.quote || result.data.text, // Jaga-jaga beda key
					author: result.data.author || 'Unknown'
				};
			} else {
				wisdom = dummyWisdom;
			}
		} catch (e) {
			console.warn('Gagal load wisdom, pakai dummy.', e);
			wisdom = dummyWisdom;
		}
	}

	// 2. GET Contents (Edukasi)
	async function loadAllContents() {
		try {
			const token = localStorage.getItem('auth_token');
			const res = await fetch(`${API_BASE_URL}/contents`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				}
			});
			const result = await res.json();

			if (res.ok && result.data && result.data.length > 0) {
				allContents = result.data.map(mapContentData);
			} else {
				allContents = dummyContents.map(mapContentData);
			}
		} catch (e) {
			console.warn('Gagal load konten, pakai dummy.', e);
			allContents = dummyContents.map(mapContentData);
		}
	}

	// 3. GET Recommendations (Setelah submit tracking)
	// Note: Karena endpoint khusus rekomendasi belum ada di list kamu,
	// kita asumsikan backend mengirim rekomendasi di response tracking atau kita fetch dummy dulu.
	// Jika nanti ada endpoint GET /recommendations, ganti URL di sini.
	async function loadRecommendations() {
		// Simulasi fetch rekomendasi (atau bisa diambil dari response submit tracking)
		recommendations = dummyRecommendations;
	}

	// Helper Mapper
	function mapContentData(item) {
		return {
			id: item.id,
			title: item.title,
			category: item.category || 'Umum',
			type: item.type || 'Artikel',
			image: resolveImage(item.thumbnail),
			icon: (item.type || '').toLowerCase() === 'video' ? '🎬' : '📖',
			duration: item.duration || '5 Min',
			color: getCategoryColor(item.category)
		};
	}

	function resolveImage(url) {
		if (!url) return null;
		if (url.startsWith('http')) return url;
		const baseUrl = API_BASE_URL.replace('/api', '');
		return `${baseUrl}/storage/${url}`;
	}

	function getCategoryColor(cat) {
		if (!cat) return 'bg-slate-100 text-slate-600';
		const c = cat.toLowerCase();
		if (c.includes('motivasi')) return 'bg-cyan-50 text-cyan-600';
		if (c.includes('ibadah')) return 'bg-emerald-50 text-emerald-600';
		if (c.includes('makan')) return 'bg-orange-50 text-orange-600';
		if (c.includes('fisik') || c.includes('olahraga')) return 'bg-blue-50 text-blue-600';
		return 'bg-slate-100 text-slate-600';
	}

	// --- UI ACTIONS ---
	function revealWisdom() {
		isWisdomRevealed = true;
	}
	function setMood(score) {
		trackingData.mood_score = score;
	}
	function toggleChecklist(key) {
		trackingData[key] = !trackingData[key];
	}

	// --- 4. POST TRACKING (SUBMIT) ---
	async function submitReport() {
		if (!trackingData.mood_score) return alert('Pilih mood dulu ya!');
		isLoading = true;

		const token = localStorage.getItem('auth_token');
		if (!token) {
			goto('/login');
			return;
		}

		// Siapkan Payload sesuai permintaan Backend
		// physical_symptoms kita isi string gabungan dari checklist
		let symptoms = [];
		if (trackingData.medication_taken) symptoms.push('Minum Obat');
		if (trackingData.diet_complied) symptoms.push('Jaga Pola Makan');
		if (trackingData.prayer_completed) symptoms.push('Ibadah');
		if (trackingData.exercise_done) symptoms.push('Olahraga');

		const currentMoodStr = moodLabels[trackingData.mood_score];

		const payload = {
			mood: currentMoodStr,
			mood_score: trackingData.mood_score,
			physical_symptoms: symptoms.join(', '), // String comma separated
			medication_taken: trackingData.medication_taken,
			prayer_completed: trackingData.prayer_completed,
			diet_complied: trackingData.diet_complied,
			exercise_done: trackingData.exercise_done,
			notes: trackingData.notes || '-'
		};

		try {
			const response = await fetch(`${API_BASE_URL}/tracking`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) throw new Error('Gagal mengirim laporan');

			// Sukses
			isSubmitted = true;
			userStore.updateScore(dailyScore);

			// Load Wisdom sesuai mood baru
			await loadWisdom(currentMoodStr);

			// Load Rekomendasi (jika ada logic backend)
			await loadRecommendations();

			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (error) {
			console.error('Submit Error:', error);
			alert('Gagal mengirim laporan. Coba lagi nanti.');
		} finally {
			isLoading = false;
		}
	}

	let checklistConfig = [
		{
			key: 'medication_taken',
			title: 'Minum Obat',
			sub: 'Sesuai jadwal dokter',
			icon: '💊',
			color: 'bg-red-100 text-red-600'
		},
		{
			key: 'diet_complied',
			title: 'Jaga Pola Makan',
			sub: 'Hindari pantangan',
			icon: '🥣',
			color: 'bg-orange-100 text-orange-600'
		},
		{
			key: 'prayer_completed',
			title: 'Ibadah Harian',
			sub: 'Sholat & Dzikir',
			icon: '📿',
			color: 'bg-emerald-100 text-emerald-600'
		},
		{
			key: 'exercise_done',
			title: 'Aktivitas Fisik',
			sub: 'Jalan santai / Yoga',
			icon: '💪',
			color: 'bg-blue-100 text-blue-600'
		}
	];
</script>

<div class="min-h-screen bg-slate-50 pb-32 font-sans text-slate-800">
	<Header />

	<main class="relative z-20 mx-auto -mt-20 max-w-4xl space-y-8 px-6 md:px-10">
		{#if activeTab === 'home'}
			<div in:scale={{ duration: 300, start: 0.95 }} class="space-y-8">
				{#if !isSubmitted}
					<Card
						className="flex flex-col items-center gap-4 text-center shadow-xl shadow-blue-900/5 transition-all duration-300 hover:shadow-blue-900/10"
					>
						<h3 class="text-xl font-bold text-slate-700 md:text-3xl">
							Gimana perasaanmu hari ini?
						</h3>
						<div class="mt-2 flex gap-4">
							{#each ['😭', '😟', '😐', '🙂', '😁'] as emoji, i}
								{@const score = i + 1}
								<button
									onclick={() => setMood(score)}
									class="text-4xl transition-all duration-200 hover:scale-125 focus:outline-none {trackingData.mood_score ===
									score
										? 'scale-125 drop-shadow-md grayscale-0'
										: 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}"
								>
									{emoji}
								</button>
							{/each}
						</div>
						{#if trackingData.mood_score}
							<div
								class="animate-in fade-in mt-4 flex w-full flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4"
							>
								<p class="text-sm font-bold text-slate-500">
									{moodLabels[trackingData.mood_score]}
								</p>
							</div>
						{/if}
					</Card>

					<div>
						<h3 class="mb-4 border-l-4 border-cyan-500 pl-2 text-2xl font-bold text-slate-700">
							Laporan Harian
						</h3>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							{#each checklistConfig as item}
								{@const isChecked = trackingData[item.key]}
								<Card
									onclick={() => toggleChecklist(item.key)}
									className="group border-2 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer {isChecked
										? 'border-cyan-400 bg-cyan-50/50 ring-2 ring-cyan-100'
										: 'border-slate-100 hover:border-cyan-200'}"
								>
									<div class="flex items-center gap-4">
										<div
											class="h-14 w-14 flex-shrink-0 rounded-2xl {item.color} bg-opacity-30 flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-110"
										>
											{item.icon}
										</div>
										<div class="min-w-0 flex-1">
											<h4
												class="truncate text-lg font-bold text-slate-700 {isChecked
													? 'text-slate-500'
													: ''}"
											>
												{item.title}
											</h4>
											<p class="truncate text-xs text-slate-400">{item.sub}</p>
										</div>
										<div
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 {isChecked
												? 'scale-110 border-cyan-500 bg-cyan-500'
												: 'border-slate-200 bg-white'}"
										>
											{#if isChecked}<span class="animate-in zoom-in text-sm font-bold text-white"
													>✓</span
												>{/if}
										</div>
									</div>
								</Card>
							{/each}
						</div>
					</div>

					<div>
						<h3 class="mb-3 pl-1 text-lg font-bold text-slate-700">Catatan Tambahan</h3>
						<div class="group relative">
							<div
								class="absolute top-3 left-4 text-xl text-slate-400 transition-colors group-focus-within:text-cyan-500"
							>
								<i class="fa-solid fa-pencil"></i>
							</div>
							<textarea
								bind:value={trackingData.notes}
								placeholder="Tulis disini..."
								class="h-32 w-full resize-none rounded-3xl border-2 border-slate-100 bg-white py-3 pr-4 pl-12 text-slate-700 placeholder-slate-400 shadow-sm transition-all outline-none group-hover:border-cyan-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
							></textarea>
						</div>
					</div>

					<div class="pt-2 pb-6">
						<button
							disabled={!trackingData.mood_score || isLoading}
							onclick={submitReport}
							class="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 text-lg font-bold text-white shadow-xl shadow-cyan-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
						>
							<span class="relative z-10 flex items-center justify-center gap-2">
								{#if isLoading}Mengirim...{:else if !trackingData.mood_score}<span
										>👆 Pilih Mood Dulu</span
									>{:else}<span
										>Kirim Laporan ({dailyScore}%) <i class="fa-solid fa-paper-plane"></i></span
									>{/if}
							</span>
							<div
								class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
							></div>
						</button>
					</div>
				{:else}
					<div class="animate-in zoom-in py-10 text-center">
						<div
							class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl text-green-600 shadow-lg"
						>
							🎉
						</div>
						<h3 class="mb-2 text-3xl font-bold text-slate-800">Laporan Diterima!</h3>
						<p class="mx-auto mb-8 max-w-xs text-slate-500">
							Istirahat yang cukup ya! Skor kamu hari ini: <span
								class="text-lg font-bold text-cyan-600">{userStore.score}%</span
							>
						</p>
						<button
							onclick={() => (isSubmitted = false)}
							class="font-bold text-cyan-600 hover:underline">Edit Laporan</button
						>
					</div>
				{/if}

				<div class="border-t border-slate-100 pt-8">
					<h3 class="mb-6 border-l-4 border-orange-400 pl-2 text-2xl font-bold text-slate-700">
						{isSubmitted ? 'Saran Edukasi Untukmu' : 'Edukasi Terbaru'}
					</h3>

					{#if educationList.length === 0}
						<div class="animate-pulse py-10 text-center text-sm text-slate-400">
							Memuat konten...
						</div>
					{:else}
						<div class="scrollbar-hide -mx-6 flex gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:px-0">
							{#each educationList as edu}
								<a
									href="/app/care/detail-content/{edu.id}"
									class="block transition-transform hover:-translate-y-1"
								>
									<Card
										className="min-w-[280px] hover:shadow-md border-slate-100 cursor-pointer h-full"
									>
										<div
											class="relative mb-4 flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-4xl"
										>
											{#if edu.image}
												<img src={edu.image} alt={edu.title} class="h-full w-full object-cover" />
											{:else}
												{edu.icon}
											{/if}
										</div>
										<span class="rounded-full px-3 py-1 text-xs font-bold {edu.color}"
											>{edu.type} • {edu.duration}</span
										>
										<h4 class="mt-3 line-clamp-2 text-lg leading-snug font-bold text-slate-700">
											{edu.title}
										</h4>
									</Card>
								</a>
							{/each}
						</div>
					{/if}
				</div>

				<div class="border-t border-slate-100 pt-8 pb-10">
					<h3 class="mb-6 border-l-4 border-purple-400 pl-2 text-2xl font-bold text-slate-700">
						Kartu Bijak Hari Ini
					</h3>
					<div
						class="perspective-1000 group relative h-40 w-full cursor-pointer"
						onclick={revealWisdom}
					>
						{#if !isWisdomRevealed}
							<div
								class="absolute inset-0 flex h-full w-full flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-purple-200 transition-transform duration-500 hover:scale-[1.02] active:scale-95"
							>
								<i class="fa-solid fa-wand-magic-sparkles mb-2 animate-bounce text-4xl"></i>
								<span class="font-bold tracking-wider">Tap untuk Buka</span>
							</div>
						{:else}
							<div
								in:scale
								class="absolute inset-0 flex h-full w-full flex-col items-center justify-center rounded-3xl border border-purple-100 bg-white p-6 text-center shadow-md"
							>
								{#if wisdom}
									<i class="fa-solid fa-quote-left absolute top-4 left-4 text-3xl text-purple-200"
									></i>
									<p class="relative z-10 text-lg leading-snug font-bold text-slate-700 italic">
										"{wisdom.quote}"
									</p>
									<p class="mt-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
										— {wisdom.author}
									</p>
								{:else}
									<p class="text-sm text-slate-400">Gagal memuat kata bijak.</p>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</main>
	<Navbar />
</div>
