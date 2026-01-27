<script>
	import { onMount } from 'svelte';
	import { scale, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/userStore.svelte.js';

	import Header from '$lib/components/Header.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let activeTab = $state('home');
	let isSubmitted = $state(false);
	let isLoading = $state(false);

	// Flag penanda apakah data sudah selesai dimuat dari penyimpanan
	let isLoaded = $state(false);

	let trackingData = $state({
		mood_score: null,
		medication_taken: false,
		prayer_completed: false,
		diet_complied: false,
		exercise_done: false,
		notes: ''
	});

	// --- 1. LOGIKA HITUNG SKOR ---
	let dailyScore = $derived.by(() => {
		let score = 0;
		// Checklist (4 x 20%)
		if (trackingData.medication_taken) score += 20;
		if (trackingData.prayer_completed) score += 20;
		if (trackingData.diet_complied) score += 20;
		if (trackingData.exercise_done) score += 20;
		// Mood (Max 20%)
		if (trackingData.mood_score) score += trackingData.mood_score * 4;

		return Math.min(100, score);
	});

	// --- 2. SISTEM PENYIMPANAN OTOMATIS (AUTO-SAVE) ---

	// Helper: Bikin Key Unik per User
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

	// Fungsi Simpan ke LocalStorage
	function saveDraft() {
		if (!isLoaded) return; // Jangan simpan kalau belum selesai loading (biar gak numpuk data kosong)

		const key = getStorageKey();
		const payload = {
			date: new Date().toDateString(),
			data: trackingData, // Simpan isian form
			isSubmitted: isSubmitted // Simpan status apakah sudah submit
		};
		localStorage.setItem(key, JSON.stringify(payload));

		// Update Skor Header Real-time
		userStore.updateScore(dailyScore);
	}

	// Trigger Auto-Save setiap ada perubahan data
	$effect(() => {
		// Kita "baca" dailyScore & isSubmitted biar effect jalan pas mereka berubah
		const _trigger = dailyScore + isSubmitted;
		saveDraft();
	});

	// --- 3. LOAD DATA SAAT REFRESH (RESTORE) ---
	onMount(() => {
		const key = getStorageKey();
		const savedRaw = localStorage.getItem(key);
		const todayStr = new Date().toDateString();

		if (savedRaw) {
			try {
				const saved = JSON.parse(savedRaw);

				// Cek Tanggal (Hanya restore kalau data hari ini)
				if (saved.date === todayStr) {
					console.log('Restoring Draft...', saved);

					// Kembalikan isian form
					trackingData = saved.data || trackingData;
					// Kembalikan status submit
					isSubmitted = saved.isSubmitted || false;

					// Paksa update skor header segera
					userStore.updateScore(dailyScore);
				} else {
					// Kalau beda hari, hapus draft lama
					console.log('New Day, Resetting...');
					localStorage.removeItem(key);
					userStore.resetScore(); // Reset skor header 0%
				}
			} catch (e) {
				console.error('Error loading draft', e);
			}
		}

		// Tandai loading selesai, sekarang boleh Auto-Save
		isLoaded = true;
	});

	// --- UI ACTIONS ---
	function setMood(score) {
		trackingData.mood_score = score;
		// (Auto-save akan jalan otomatis lewat $effect)
	}

	function toggleChecklist(key) {
		trackingData[key] = !trackingData[key];
		// (Auto-save akan jalan otomatis lewat $effect)
	}

	// Submit ke Backend
	async function submitReport() {
		if (!trackingData.mood_score) return alert('Pilih mood dulu ya!');
		isLoading = true;

		const finalScore = dailyScore; // Skor 0-100% (untuk UI Header & LocalStorage)
		const token = localStorage.getItem('auth_token');

		if (!token) {
			goto('/login');
			return;
		}

		// --- 1. MAPPING DATA (Agar sesuai permintaan Backend) ---

		// A. Terjemahkan Score 1-5 jadi String Mood
		const moodLabels = {
			1: 'Sedih',
			2: 'Buruk',
			3: 'Netral',
			4: 'Senang', // atau "Baik"
			5: 'Luar Biasa' // atau "Senang Sekali"
		};

		// B. Kumpulkan Checklist yg TRUE ke dalam Array 'physical_symptoms'
		// Karena BE minta 'physical_symptoms' isinya kegiatan fisik
		let physicalSymptomsList = [];
		if (trackingData.medication_taken) physicalSymptomsList.push('Minum Obat');
		if (trackingData.diet_complied) physicalSymptomsList.push('Jaga Pola Makan');
		if (trackingData.prayer_completed) physicalSymptomsList.push('Ibadah Harian');
		if (trackingData.exercise_done) physicalSymptomsList.push('Aktivitas Fisik');

		// C. Siapkan Payload Final untuk Backend
		const backendPayload = {
			mood_score: trackingData.mood_score, // Angka 1-5
			mood: moodLabels[trackingData.mood_score], // String: "Senang", "Sedih", dll
			physical_symptoms: physicalSymptomsList, // Array: ["Minum Obat", "Ibadah Harian"]
			score: finalScore, // (Opsional) Tetap kirim 0-100% jaga-jaga BE butuh statistik
			notes: trackingData.notes
		};

		console.log('Mengirim data ke BE:', backendPayload); // Cek console buat mastiin

		try {
			const response = await fetch('/api/tracking', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				},
				// KIRIM PAYLOAD YANG SUDAH DI-MAPPING
				body: JSON.stringify(backendPayload)
			});

			if (response.ok) {
				isSubmitted = true;

				// SIMPAN KE LOCALSTORAGE (Tetap simpan data mentah trackingData buat restore UI)
				const dataToSave = {
					date: new Date().toDateString(),
					score: finalScore,
					data: trackingData // Simpan format lama biar UI bisa restore checklistnya
				};
				localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));

				userStore.updateScore(finalScore);
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} else {
				const res = await response.json();
				alert(`Gagal: ${res.message}`);
			}
		} catch (error) {
			console.error(error);
			alert('Gagal koneksi server.');
		} finally {
			isLoading = false;
		}
	}

	// Config & Data Static
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
	let educations = [
		{
			type: 'Video',
			duration: '5 Min',
			title: 'Mengatasi Panic Attack',
			icon: '🎬',
			color: 'bg-cyan-50 text-cyan-600'
		},
		{
			type: 'Artikel',
			duration: 'Baca',
			title: 'Keajaiban Dzikir Pagi',
			icon: '📖',
			color: 'bg-orange-50 text-orange-600'
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
								{#if trackingData.mood_score === 1}
									<p class="text-sm font-bold text-slate-500">Hari Ini Berat banget ya? 😢</p>
									<div
										class="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500"
									>
										<span> +4% Poin</span>
									</div>
								{:else if trackingData.mood_score === 2}
									<p class="text-sm font-bold text-slate-500">Kurang semangat? 😟</p>
									<div
										class="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500"
									>
										<span> +8% Poin</span>
									</div>
								{:else if trackingData.mood_score === 3}
									<p class="text-sm font-bold text-slate-600">Biasa aja (Netral) 😐</p>
									<div
										class="flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-600"
									>
										<span>+12% Poin</span>
									</div>
								{:else if trackingData.mood_score === 4}
									<p class="text-sm font-bold text-slate-700">Mood bagus! 🙂</p>
									<div
										class="flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-600"
									>
										<span>🌟 +16% Poin</span>
									</div>
								{:else if trackingData.mood_score === 5}
									<p class="text-sm font-bold text-slate-700">Luar biasa! 😁</p>
									<div
										class="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-600"
									>
										<span>🚀 +20% Poin (Max)</span>
									</div>
								{/if}
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

				<div class="border-t border-slate-100 pt-8 pb-10">
					<h3 class="mb-6 border-l-4 border-orange-400 pl-2 text-2xl font-bold text-slate-700">
						Edukasi Hari Ini
					</h3>
					<div class="scrollbar-hide -mx-6 flex gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:px-0">
						{#each educations as edu}
							<Card className="min-w-[280px] hover:shadow-md border-slate-100 cursor-pointer">
								<div
									class="mb-4 flex h-32 items-center justify-center rounded-2xl bg-slate-100 text-4xl"
								>
									{edu.icon}
								</div>
								<span class="rounded-full px-3 py-1 text-xs font-bold {edu.color}"
									>{edu.type} • {edu.duration}</span
								>
								<h4 class="mt-3 text-lg font-bold text-slate-700">{edu.title}</h4>
							</Card>
						{/each}
					</div>
				</div>
			</div>
		{/if}
		{#if activeTab === 'care'}<div in:fade class="pt-10 text-center text-slate-500">
				Halaman Care
			</div>{/if}
		{#if activeTab === 'consult'}<div in:fade class="pt-10 text-center text-slate-500">
				Halaman Konsultasi
			</div>{/if}
	</main>
	<Navbar />
</div>
