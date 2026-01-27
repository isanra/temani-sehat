<script>
	import { onMount, tick } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/userStore.svelte.js';

	import Header from '$lib/components/Header.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	// --- STATE ---
	let searchQuery = $state('');
	let isChatting = $state(false);

	// DATA
	let experts = $state([]);
	let selectedExpert = $state(null);

	// STATE FILTER
	let activeCategory = $state('Semua'); // Default: Tampilkan Semua

	// LOGIC FILTERING (Reactive)
	// List dokter akan berubah otomatis saat 'activeCategory' atau 'searchQuery' berubah
	let filteredExperts = $derived(
		experts.filter((expert) => {
			// 1. Filter Kategori
			const matchCategory = activeCategory === 'Semua' || expert.role === activeCategory;
			// 2. Filter Search (Nama atau Role)
			const matchSearch =
				expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				expert.role.toLowerCase().includes(searchQuery.toLowerCase());

			return matchCategory && matchSearch;
		})
	);

	// PENYIMPANAN SESI LOKAL
	let chatSessions = $state({});

	// MODALS
	let showBookingModal = $state(false);
	let showReviewModal = $state(false);

	let bookingForm = $state({ schedule_date: '', complaint: '' });
	let reviewForm = $state({ rating: 0, review: '' });

	// CHAT INPUT
	let messageInput = $state('');
	let chatContainer;

	// KATEGORI (Ditambah 'Semua' untuk Reset Filter)
	let categories = [
		{ id: 'all', name: 'Semua', icon: 'fa-layer-group', color: 'bg-slate-200 text-slate-600' }, // Tambahan
		{
			id: 'khusus',
			name: 'Konsultan Khusus',
			icon: 'fa-user-tie',
			color: 'bg-purple-100 text-purple-600'
		},
		{ id: 'dokter', name: 'Dokter', icon: 'fa-user-doctor', color: 'bg-blue-100 text-blue-600' },
		{ id: 'gizi', name: 'Ahli Gizi', icon: 'fa-apple-whole', color: 'bg-green-100 text-green-600' },
		{
			id: 'fisio',
			name: 'Fisio Teraphy',
			icon: 'fa-person-walking',
			color: 'bg-orange-100 text-orange-600'
		},
		{ id: 'admin', name: 'Admin', icon: 'fa-headset', color: 'bg-slate-100 text-slate-600' }
	];

	const API_BASE = 'https://nondeprecatively-overdiligent-sonja.ngrok-free.dev/api';

	onMount(async () => {
		await loadExperts();
	});

	// --- 1. LOAD EXPERTS (REAL API) ---
	async function loadExperts() {
		const token = localStorage.getItem('auth_token');
		if (!token) return goto('/login');

		try {
			// INI MEMANGGIL API BENERAN
			const res = await fetch(`${API_BASE}/experts`, {
				headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
			});
			const result = await res.json();
			if (res.ok) {
				experts = (result.data || []).map((e) => ({
					id: e.id,
					name: e.name,
					// Mapping role agar cocok dengan nama kategori filter
					role: mapRoleToCategory(e.specialization),
					exp: e.experience || '3 Tahun',
					isOnline: e.is_online || true
				}));
			}
		} catch (e) {
			console.error('Gagal load expert (Menggunakan Dummy)', e);
			// Fallback Dummy Data (Hanya muncul jika API Error/Mati)
			experts = [
				{ id: 1, name: 'Admin Support', role: 'Admin', exp: '-', isOnline: true },
				{ id: 2, name: 'Dr. Arief Sp.PD', role: 'Dokter', exp: '10 Tahun', isOnline: true },
				{ id: 3, name: 'Siti Aminah S.Gz', role: 'Ahli Gizi', exp: '5 Tahun', isOnline: false },
				{ id: 4, name: 'Budi Santoso', role: 'Fisio Teraphy', exp: '7 Tahun', isOnline: true },
				{ id: 5, name: 'Prof. Bambang', role: 'Konsultan Khusus', exp: '20 Tahun', isOnline: true }
			];
		}
	}

	// Helper: Menyamakan data API yg acak dengan Kategori UI kita
	function mapRoleToCategory(spec) {
		if (!spec) return 'Dokter'; // Default
		const s = spec.toLowerCase();
		if (s.includes('gizi')) return 'Ahli Gizi';
		if (s.includes('fisio')) return 'Fisio Teraphy';
		if (s.includes('admin')) return 'Admin';
		if (s.includes('khusus') || s.includes('konsultan')) return 'Konsultan Khusus';
		return 'Dokter';
	}

	// --- 2. LOGIC BUKA CHAT / BOOKING ---
	function handleExpertClick(expert) {
		selectedExpert = expert;

		if (chatSessions[expert.id]) {
			isChatting = true;
			scrollToBottom();
		} else {
			bookingForm = { schedule_date: '', complaint: '' };
			showBookingModal = true;
		}
	}

	function confirmBooking() {
		chatSessions[selectedExpert.id] = {
			consultationId: `consult-${Date.now()}`,
			messages: [
				{
					id: 1,
					sender: 'expert',
					content: `Halo, saya ${selectedExpert.name} (${selectedExpert.role}). ${bookingForm.complaint ? `Terkait "${bookingForm.complaint}", ` : ''}bagaimana saya bisa membantu?`,
					time: 'Baru saja'
				}
			]
		};

		showBookingModal = false;
		isChatting = true;
		scrollToBottom();
	}

	// --- 3. CHAT SYSTEM ---
	function minimizeChat() {
		isChatting = false;
	}

	async function sendMessage() {
		const currentSession = chatSessions[selectedExpert?.id];
		if (!messageInput.trim() || !currentSession) return;

		const newMsg = {
			id: Date.now(),
			sender: 'user',
			content: messageInput,
			time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		};

		chatSessions[selectedExpert.id].messages = [...currentSession.messages, newMsg];

		const payload = { content: messageInput };
		const token = localStorage.getItem('auth_token');
		messageInput = '';

		scrollToBottom();

		try {
			await fetch(`${API_BASE}/consultations/${currentSession.consultationId}/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				},
				body: JSON.stringify(payload)
			});
		} catch (e) {
			console.error('Send error', e);
		}
	}

	async function scrollToBottom() {
		await tick();
		if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
	}

	// --- 4. REVIEW SYSTEM ---
	function openReviewModal() {
		reviewForm = { rating: 0, review: '' };
		showReviewModal = true;
	}

	async function submitReview() {
		const currentSession = chatSessions[selectedExpert?.id];
		if (!currentSession) return;

		const token = localStorage.getItem('auth_token');
		try {
			await fetch(`${API_BASE}/consultations/${currentSession.consultationId}/review`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				},
				body: JSON.stringify(reviewForm)
			});

			alert('Terima kasih ulasannya!');
			showReviewModal = false;
		} catch (e) {
			console.error(e);
			alert('Gagal kirim review.');
		}
	}
</script>

<div class="min-h-screen bg-slate-50 pb-32 font-sans text-slate-800">
	{#if !isChatting}
		<Header />

		<main class="relative z-10 mx-auto -mt-20 max-w-4xl space-y-8 px-6 md:px-10">
			<Card className="flex items-center p-2 shadow-xl shadow-slate-200/50 border-none">
				<div class="pl-4 text-slate-400"><i class="fa-solid fa-magnifying-glass text-lg"></i></div>
				<input
					bind:value={searchQuery}
					type="text"
					placeholder="Cari dokter, keluhan, atau spesialis..."
					class="w-full border-none bg-transparent p-4 font-medium text-slate-700 outline-none placeholder:text-slate-400"
				/>
			</Card>

			<div>
				<div class="mb-4 flex items-center justify-between px-1">
					<h3 class="text-lg font-bold text-slate-700">Layanan Konsultasi</h3>
				</div>
				<div class="scrollbar-hide flex gap-3 overflow-x-auto px-1 py-4">
					{#each categories as cat}
						<button
							onclick={() => (activeCategory = cat.name)}
							class="group flex min-w-[80px] flex-col items-center gap-2 transition-all duration-300 {activeCategory ===
							cat.name
								? 'scale-110'
								: 'opacity-70 hover:scale-105 hover:opacity-100'}"
						>
							<div
								class="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl shadow-sm transition-all
                                {activeCategory === cat.name
									? 'bg-cyan-500 text-white shadow-md shadow-cyan-200'
									: `${cat.color}`}"
							>
								<i class="fa-solid {cat.icon}"></i>
							</div>
							<span
								class="text-center text-[10px] leading-tight font-bold
                                {activeCategory === cat.name ? 'text-cyan-600' : 'text-slate-500'}"
							>
								{cat.name}
							</span>
						</button>
					{/each}
				</div>
			</div>

			<div>
				<div class="mb-4 flex items-center justify-between px-1">
					<h3 class="text-lg font-bold text-slate-700">
						{activeCategory === 'Semua' ? 'Rekomendasi Ahli' : `List ${activeCategory}`}
					</h3>
					<span class="text-xs font-bold text-slate-400">{filteredExperts.length} Tersedia</span>
				</div>

				{#if experts.length === 0}
					<div class="animate-pulse py-10 text-center text-slate-400">Sedang memuat data...</div>
				{:else if filteredExperts.length === 0}
					<div
						class="rounded-2xl border border-slate-100 bg-white p-8 py-10 text-center text-slate-400"
					>
						<div class="mb-2 text-4xl">🔍</div>
						<p>Tidak ada ahli di kategori <strong>{activeCategory}</strong></p>
						<button
							onclick={() => (activeCategory = 'Semua')}
							class="mt-2 text-sm font-bold text-cyan-600 hover:underline">Lihat Semua</button
						>
					</div>
				{:else}
					<div class="space-y-4">
						{#each filteredExperts as expert (expert.id)}
							<div in:slide|local>
								<Card
									onclick={() => handleExpertClick(expert)}
									className="group flex cursor-pointer items-center gap-4 border-slate-100 p-4 transition-all hover:border-cyan-200 hover:shadow-md"
								>
									<div class="relative h-16 w-16 shrink-0">
										<div
											class="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-3xl"
										>
											{#if expert.role === 'Admin'}🎧{:else if expert.role === 'Ahli Gizi'}🍎{:else if expert.role === 'Fisio Teraphy'}🧘{:else}👨‍⚕️{/if}
										</div>
										{#if expert.isOnline}
											<div
												class="absolute right-0 bottom-0 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-green-500"
											></div>
										{/if}
									</div>

									<div class="flex-1">
										<h4 class="font-bold text-slate-800">{expert.name}</h4>
										{#if chatSessions[expert.id]}
											<div class="mb-1 flex items-center gap-1">
												<span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
												<span class="text-[10px] font-bold text-green-600">Sesi Aktif</span>
											</div>
										{/if}
										<p class="mb-2 text-xs font-bold text-cyan-600">{expert.role}</p>
										<div class="flex items-center gap-3 text-[10px] font-bold text-slate-400">
											<span class="flex items-center gap-1 rounded bg-slate-50 px-2 py-1"
												><i class="fa-solid fa-briefcase"></i> {expert.exp}</span
											>
											<span class="flex items-center gap-1 rounded bg-slate-50 px-2 py-1"
												><i class="fa-solid fa-star text-orange-400"></i> 4.9</span
											>
										</div>
									</div>

									<button
										class="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 transition-all group-hover:bg-cyan-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-cyan-200"
									>
										{#if chatSessions[expert.id]}
											<i class="fa-solid fa-comments"></i>
										{:else}
											<i class="fa-solid fa-plus"></i>
										{/if}
									</button>
								</Card>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</main>
		<Navbar />
	{/if}

	{#if isChatting && selectedExpert}
		<div
			class="fixed inset-0 z-50 flex flex-col bg-slate-50"
			in:slide={{ axis: 'y', duration: 300 }}
		>
			<div
				class="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 shadow-sm"
			>
				<button
					onclick={minimizeChat}
					class="flex items-center gap-2 rounded-full px-3 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-cyan-600"
				>
					<i class="fa-solid fa-arrow-left text-lg"></i>
				</button>

				<div class="flex flex-col items-center">
					<h4 class="text-sm font-bold text-slate-800">{selectedExpert.name}</h4>
					<span class="rounded-full bg-green-50 px-2 text-[10px] font-bold text-green-500"
						>● Online</span
					>
				</div>

				<button
					onclick={openReviewModal}
					class="flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-500 shadow-sm transition hover:bg-orange-100"
				>
					<i class="fa-solid fa-star"></i> Nilai
				</button>
			</div>

			<div bind:this={chatContainer} class="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
				<div
					class="mx-auto my-4 w-fit rounded-full bg-slate-100 px-3 py-1 text-center text-xs text-slate-400"
				>
					Mulai Sesi dengan {selectedExpert.role}
				</div>

				{#if chatSessions[selectedExpert.id]}
					{#each chatSessions[selectedExpert.id].messages as msg}
						<div class="flex w-full {msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm
                                {msg.sender === 'user'
									? 'rounded-tr-none bg-cyan-500 text-white shadow-cyan-100'
									: 'rounded-tl-none border border-slate-100 bg-white text-slate-700'}"
							>
								<p class="leading-relaxed">{msg.content}</p>
								<span
									class="mt-1 block text-[9px] opacity-70 {msg.sender === 'user'
										? 'text-cyan-100'
										: 'text-slate-400'} text-right"
								>
									{msg.time}
								</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="bg-white p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
				<div
					class="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2 py-2 transition-all focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-50"
				>
					<button
						class="h-10 w-10 rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-cyan-600"
						><i class="fa-solid fa-paperclip"></i></button
					>
					<input
						bind:value={messageInput}
						onkeydown={(e) => e.key === 'Enter' && sendMessage()}
						type="text"
						placeholder="Ketik pesan..."
						class="flex-1 bg-transparent px-2 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
					/>
					<button
						onclick={sendMessage}
						class="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-white shadow-md shadow-cyan-200 transition hover:scale-105 hover:bg-cyan-600 disabled:opacity-50 disabled:shadow-none"
						disabled={!messageInput}
					>
						<i class="fa-solid fa-paper-plane text-sm"></i>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

{#if showBookingModal}
	<div
		class="fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:items-center"
		in:fade={{ duration: 200 }}
	>
		<div
			class="absolute inset-0 bg-black/60 backdrop-blur-sm"
			onclick={() => (showBookingModal = false)}
		></div>

		<div
			class="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
			in:slide={{ duration: 300, axis: 'y' }}
		>
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-xl font-bold text-slate-800">Mulai Konsultasi</h3>
				<button onclick={() => (showBookingModal = false)} class="text-slate-400 hover:text-red-500"
					><i class="fa-solid fa-xmark text-xl"></i></button
				>
			</div>

			<div class="mb-6 flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-2xl">
					{#if selectedExpert?.role === 'Admin'}🎧{:else if selectedExpert?.role === 'Ahli Gizi'}🍎{:else}👨‍⚕️{/if}
				</div>
				<div>
					<p class="font-bold text-slate-800">{selectedExpert?.name}</p>
					<p class="text-xs text-slate-500">{selectedExpert?.role}</p>
				</div>
			</div>

			<div class="space-y-4">
				<div>
					<label class="mb-1 block text-xs font-bold text-slate-400 uppercase"
						>Keluhan Utama / Topik</label
					>
					<textarea
						bind:value={bookingForm.complaint}
						rows="3"
						placeholder="Contoh: Saya ingin bertanya tentang..."
						class="w-full resize-none rounded-xl bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500"
					></textarea>
				</div>
				<Button
					onclick={confirmBooking}
					className="w-full py-4 bg-cyan-600 text-white shadow-lg shadow-cyan-200 mt-2"
				>
					Mulai Chat <i class="fa-solid fa-comments ml-2"></i>
				</Button>
			</div>
		</div>
	</div>
{/if}

{#if showReviewModal}
	<div
		class="fixed inset-0 z-[9999] flex items-center justify-center p-6"
		in:fade={{ duration: 200 }}
	>
		<div
			class="absolute inset-0 bg-black/60 backdrop-blur-sm"
			onclick={() => (showReviewModal = false)}
		></div>

		<div
			class="relative z-10 w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"
			in:scale
		>
			<div
				class="mx-auto mb-4 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-orange-100 text-3xl text-orange-500"
			>
				<i class="fa-solid fa-star"></i>
			</div>
			<h3 class="mb-2 text-2xl font-bold text-slate-800">Beri Ulasan</h3>
			<p class="mb-6 text-sm text-slate-500">
				Bagaimana pengalaman konsultasi dengan<br /><strong>{selectedExpert?.name}</strong>?
			</p>

			<div class="mb-6 flex justify-center gap-2">
				{#each [1, 2, 3, 4, 5] as star}
					<button
						onclick={() => (reviewForm.rating = star)}
						class="text-4xl transition hover:scale-110 {reviewForm.rating >= star
							? 'text-yellow-400'
							: 'text-slate-200'}">★</button
					>
				{/each}
			</div>

			<input
				bind:value={reviewForm.review}
				type="text"
				placeholder="Tulis masukan..."
				class="mb-6 w-full rounded-xl bg-slate-50 p-3 text-center text-sm outline-none focus:ring-2 focus:ring-orange-400"
			/>

			<div class="flex gap-3">
				<Button onclick={() => (showReviewModal = false)} variant="secondary" className="flex-1"
					>Nanti Saja</Button
				>
				<Button
					onclick={submitReview}
					className="flex-1 bg-orange-500 text-white shadow-lg shadow-orange-200">Kirim</Button
				>
			</div>
		</div>
	</div>
{/if}
