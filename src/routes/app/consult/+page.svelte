<script>
	import { onMount, tick } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/userStore.svelte.js';
	import { API_BASE_URL } from '$lib/utils/api';

	import Header from '$lib/components/Header.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	// --- STATE ---
	let searchQuery = $state('');
	let isChatting = $state(false);
	let isLoading = $state(false);

	// DATA
	let experts = $state([]);
	let selectedExpert = $state(null);
	let activeConsultationId = $state(null); // ID konsultasi aktif dari backend

	// STATE FILTER
	let activeCategory = $state('Semua');

	// LOGIC FILTERING
	let filteredExperts = $derived(
		experts.filter((expert) => {
			const matchCategory = activeCategory === 'Semua' || expert.role === activeCategory;
			const matchSearch =
				expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				expert.role.toLowerCase().includes(searchQuery.toLowerCase());
			return matchCategory && matchSearch;
		})
	);

	// MODALS
	let showBookingModal = $state(false);
	let showReviewModal = $state(false);

	let bookingForm = $state({ schedule_date: '', complaint: '' });
	let reviewForm = $state({ rating: 0, review: '' });

	// CHAT
	let messages = $state([]); // Pesan chat aktif
	let messageInput = $state('');
	let chatContainer;

	// KATEGORI BARU
	let categories = [
		{ id: 'all', name: 'Semua', icon: 'fa-layer-group', color: 'bg-slate-200 text-slate-600' },
		{
			id: 'holistic',
			name: 'Konsultan Holistic',
			icon: 'fa-leaf',
			color: 'bg-green-100 text-green-600'
		},
		{
			id: 'spiritual',
			name: 'Konsultan Spiritual',
			icon: 'fa-praying-hands',
			color: 'bg-purple-100 text-purple-600'
		},
		{ id: 'dokter', name: 'Dokter', icon: 'fa-user-doctor', color: 'bg-blue-100 text-blue-600' },
		{
			id: 'gizi',
			name: 'Ahli Gizi',
			icon: 'fa-apple-whole',
			color: 'bg-orange-100 text-orange-600'
		},
		{
			id: 'fisio',
			name: 'Fisio Teraphy',
			icon: 'fa-person-walking',
			color: 'bg-red-100 text-red-600'
		},
		{ id: 'admin', name: 'Admin', icon: 'fa-headset', color: 'bg-slate-100 text-slate-600' }
	];

	onMount(async () => {
		await loadExperts();
	});

	// --- 1. LOAD EXPERTS ---
	async function loadExperts() {
		isLoading = true;
		const token = localStorage.getItem('auth_token');
		if (!token) return goto('/login');

		try {
			const res = await fetch(`${API_BASE_URL}/experts`, {
				headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
			});
			const result = await res.json();

			if (res.ok) {
				experts = (result.data || []).map((e) => ({
					id: e.id,
					name: e.name,
					title: e.title || '', // Gelar
					role: mapCategory(e.category),
					category_raw: e.category,
					fee: e.fee || 0,
					wa_number: e.wa_number,
					photo: e.photo,
					isOnline: true // Default online dulu
				}));
			}
		} catch (e) {
			console.error('Gagal load expert', e);
		} finally {
			isLoading = false;
		}
	}

	function mapCategory(cat) {
		if (!cat) return 'Dokter';
		// Mapping string backend ke frontend category name
		if (cat.toLowerCase().includes('holistic')) return 'Konsultan Holistic';
		if (cat.toLowerCase().includes('spiritual')) return 'Konsultan Spiritual';
		return cat; // Default kembalikan aslinya
	}

	// --- 2. BOOKING & START CHAT ---
	async function handleExpertClick(expert) {
		selectedExpert = expert;
		// Cek apakah user punya sesi chat aktif dengan expert ini?
		// Idealnya backend kasih tau status konsultasi terakhir.
		// Untuk sekarang kita buka form booking dulu setiap klik baru.
		bookingForm = { schedule_date: '', complaint: '' };
		showBookingModal = true;
	}

	async function confirmBooking() {
		const token = localStorage.getItem('auth_token');

		try {
			// 1. POST Booking ke Backend
			const res = await fetch(`${API_BASE_URL}/consultations`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				},
				body: JSON.stringify({
					expert_id: selectedExpert.id,
					schedule_date: bookingForm.schedule_date || new Date().toISOString().split('T')[0], // Default hari ini
					complaint: bookingForm.complaint
				})
			});

			const result = await res.json();

			if (res.ok) {
				// Booking Sukses -> Masuk Chat
				activeConsultationId = result.data.id; // Simpan ID Konsultasi
				showBookingModal = false;
				isChatting = true;

				// Load Pesan Lama (Persistent Chat)
				await loadMessages(activeConsultationId);
			} else {
				alert(result.message || 'Gagal booking konsultasi.');
			}
		} catch (e) {
			alert('Error koneksi booking.');
		}
	}

	// --- 3. CHAT SYSTEM (Persistent) ---

	async function loadMessages(consultationId) {
		const token = localStorage.getItem('auth_token');
		try {
			const res = await fetch(`${API_BASE_URL}/consultations/${consultationId}/messages`, {
				headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
			});
			const result = await res.json();

			if (res.ok) {
				// Mapping pesan dari backend
				messages = (result.data || []).map((m) => ({
					id: m.id,
					sender: m.sender_type === 'user' ? 'user' : 'expert', // Sesuaikan key backend
					content: m.content,
					time: new Date(m.created_at).toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit'
					})
				}));

				// Jika pesan kosong (baru mulai), tambahkan Auto Message Expert
				if (messages.length === 0) {
					const waLink = `https://wa.me/${selectedExpert.wa_number}`;
					messages = [
						{
							id: 'welcome',
							sender: 'expert',
							content: `Halo, saya ${selectedExpert.name}. Silakan hubungi saya via WhatsApp untuk konsultasi lebih lanjut: ${selectedExpert.wa_number}`,
							isLink: true,
							link: waLink,
							time: 'Sekarang'
						}
					];
				}
			}
		} catch (e) {
			console.error('Gagal load chat', e);
		}
		await scrollToBottom();
	}

	async function sendMessage() {
		if (!messageInput.trim()) return;

		// Optimistic UI Update (Langsung tampil di layar)
		const tempMsg = {
			id: Date.now(),
			sender: 'user',
			content: messageInput,
			time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		};
		messages = [...messages, tempMsg];
		const msgToSend = messageInput;
		messageInput = '';
		await scrollToBottom();

		// Kirim ke Backend
		const token = localStorage.getItem('auth_token');
		try {
			await fetch(`${API_BASE_URL}/consultations/${activeConsultationId}/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				},
				body: JSON.stringify({ content: msgToSend })
			});
			// Tidak perlu reloadMessages agar smooth, kecuali mau sync status
		} catch (e) {
			console.error('Gagal kirim pesan', e);
		}
	}

	function minimizeChat() {
		isChatting = false;
		selectedExpert = null;
		messages = [];
	}

	async function scrollToBottom() {
		await tick();
		if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
	}

	// --- 4. REVIEW SYSTEM ---
	async function submitReview() {
		const token = localStorage.getItem('auth_token');
		try {
			await fetch(`${API_BASE_URL}/consultations/${activeConsultationId}/review`, {
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
			alert('Gagal kirim review.');
		}
	}

	// --- HELPERS ---
	function resolveImage(url) {
		if (!url) return null;
		if (url.startsWith('http')) return url;
		const baseUrl = API_BASE_URL.replace('/api', '');
		return `${baseUrl}/storage/${url}`;
	}

	function formatRupiah(num) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(num);
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
								class="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl shadow-sm transition-all {activeCategory ===
								cat.name
									? 'bg-cyan-500 text-white shadow-md shadow-cyan-200'
									: `${cat.color}`}"
							>
								<i class="fa-solid {cat.icon}"></i>
							</div>
							<span
								class="text-center text-[10px] leading-tight font-bold {activeCategory === cat.name
									? 'text-cyan-600'
									: 'text-slate-500'}"
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

				{#if isLoading}
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
									className="group flex items-center gap-4 border-slate-100 p-4 transition-all hover:border-cyan-200 hover:shadow-md relative overflow-hidden"
								>
									<div class="relative h-16 w-16 shrink-0">
										{#if expert.photo}
											<img
												src={resolveImage(expert.photo)}
												alt={expert.name}
												class="h-full w-full rounded-full object-cover shadow-sm"
											/>
										{:else}
											<div
												class="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-3xl"
											>
												👨‍⚕️
											</div>
										{/if}
										<div
											class="absolute right-0 bottom-0 h-4 w-4 rounded-full border-2 border-white bg-green-500"
										></div>
									</div>

									<div class="min-w-0 flex-1">
										<h4 class="truncate font-bold text-slate-800">{expert.name}</h4>
										{#if expert.title}
											<p class="mb-1 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
												{expert.title}
											</p>
										{/if}
										<p class="text-xs font-bold text-cyan-600">{expert.role}</p>
									</div>

									<div class="flex flex-col items-end gap-2">
										<span class="text-sm font-extrabold text-slate-800"
											>{formatRupiah(expert.fee)}</span
										>
										<button
											onclick={() => handleExpertClick(expert)}
											class="rounded-lg bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-600 transition hover:bg-cyan-500 hover:text-white"
										>
											Chat <i class="fa-solid fa-comment-dots ml-1"></i>
										</button>
									</div>
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
					onclick={() => (showReviewModal = true)}
					class="flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-500 shadow-sm transition hover:bg-orange-100"
				>
					<i class="fa-solid fa-star"></i> Nilai
				</button>
			</div>

			<div bind:this={chatContainer} class="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
				<div
					class="mx-auto my-4 w-fit rounded-full bg-slate-100 px-3 py-1 text-center text-xs text-slate-400"
				>
					Sesi Konsultasi Dimulai
				</div>

				{#each messages as msg}
					<div class="flex w-full {msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm {msg.sender === 'user'
								? 'rounded-tr-none bg-cyan-500 text-white shadow-cyan-100'
								: 'rounded-tl-none border border-slate-100 bg-white text-slate-700'}"
						>
							<p class="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

							{#if msg.isLink}
								<a
									href={msg.link}
									target="_blank"
									class="mt-2 block w-full rounded-lg bg-green-100 px-3 py-2 text-center text-xs font-bold text-green-700 hover:bg-green-200"
								>
									<i class="fa-brands fa-whatsapp mr-1"></i> Hubungi via WA
								</a>
							{/if}

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
			</div>

			<div class="bg-white p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
				<div
					class="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2 py-2 transition-all focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-50"
				>
					<input
						bind:value={messageInput}
						onkeydown={(e) => e.key === 'Enter' && sendMessage()}
						type="text"
						placeholder="Ketik pesan..."
						class="flex-1 bg-transparent px-4 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
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
				<h3 class="text-xl font-bold text-slate-800">Booking Konsultasi</h3>
				<button onclick={() => (showBookingModal = false)} class="text-slate-400 hover:text-red-500"
					><i class="fa-solid fa-xmark text-xl"></i></button
				>
			</div>

			<div class="mb-6 flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
				<div class="relative h-12 w-12 shrink-0">
					{#if selectedExpert?.photo}
						<img
							src={resolveImage(selectedExpert.photo)}
							alt="avatar"
							class="h-full w-full rounded-full object-cover"
						/>
					{:else}
						<div
							class="flex h-full w-full items-center justify-center rounded-full bg-cyan-100 text-xl"
						>
							👨‍⚕️
						</div>
					{/if}
				</div>
				<div>
					<p class="font-bold text-slate-800">{selectedExpert?.name}</p>
					<p class="text-xs text-slate-500">{selectedExpert?.role}</p>
				</div>
			</div>

			<div class="space-y-4">
				<div>
					<label class="mb-1 block text-xs font-bold text-slate-400 uppercase"
						>Jadwal Konsultasi</label
					>
					<input
						type="date"
						bind:value={bookingForm.schedule_date}
						class="w-full rounded-xl bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500"
					/>
				</div>
				<div>
					<label class="mb-1 block text-xs font-bold text-slate-400 uppercase">Keluhan Utama</label>
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
					Buat Jadwal & Chat <i class="fa-solid fa-arrow-right ml-2"></i>
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
