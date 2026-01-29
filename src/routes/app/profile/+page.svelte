<script>
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/userStore.svelte.js';
	import { API_BASE_URL } from '$lib/utils/api';

	import Header from '$lib/components/Header.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	// --- STATE ---
	let isLoading = $state(false);
	let isEditingProfile = $state(false);
	let isEditingPersonal = $state(false);
	let fileInput;
	let selectedFile = $state(null);
	let phoneError = $state('');

	// DATA USER
	let user = $state({
		name: '',
		email: '',
		photo_url: null,
		diagnosis: '',
		birth_date: '',
		gender: '',
		address: '',
		phone_number: ''
	});

	let initial = $derived(user.name ? user.name.charAt(0).toUpperCase() : 'U');

	let personalData = $state({
		hobbies: '',
		favorite_foods: '',
		allergies: '',
		health_goals: ''
	});

	let weeklyStats = $state([]);
	let moodSummaryList = $state([
		{ key: 'Sedih', icon: '😭', count: 0 },
		{ key: 'Buruk', icon: '😟', count: 0 },
		{ key: 'Netral', icon: '😐', count: 0 },
		{ key: 'Senang', icon: '🙂', count: 0 },
		{ key: 'Bahagia', icon: '😁', count: 0 }
	]);

	let profileForm = $state({});
	let personalForm = $state({});

	onMount(async () => {
		const stored = localStorage.getItem('user_data');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				user = { ...user, ...parsed };
				if (parsed.preferences) personalData = { ...personalData, ...parsed.preferences };
			} catch (e) {
				console.error(e);
			}
		}
		await loadUserData();
		await loadStats();
	});

	// 1. LOAD USER
	async function loadUserData() {
		const token = localStorage.getItem('auth_token');
		if (!token) return goto('/login');

		try {
			const res = await fetch(`${API_BASE_URL}/profile?t=${new Date().getTime()}`, {
				headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
			});

			if (res.status === 401) return handleLogout();

			if (res.ok) {
				const result = await res.json();

				// Flexible Mapping
				const rootData = result.data || result;
				const userData = rootData.user || rootData;
				const bioData = userData.bio || userData;

				let fixedPhotoUrl = userData.photo_url;
				if (fixedPhotoUrl && !fixedPhotoUrl.startsWith('data:')) {
					fixedPhotoUrl = `${fixedPhotoUrl}?t=${new Date().getTime()}`;
				}

				user = {
					...user,
					name: userData.name || user.name,
					email: userData.email || user.email,
					diagnosis: userData.diagnosis || user.diagnosis,
					photo_url: fixedPhotoUrl || user.photo_url,
					birth_date: bioData.birth_date || '',
					gender: bioData.gender || 'L',
					address: bioData.address || '',
					phone_number: bioData.phone_number || ''
				};

				// Perbaiki mapping preferences (bisa di root atau di dalam user)
				const prefData = rootData.preferences || userData.preferences;
				if (prefData) {
					personalData = {
						hobbies: prefData.hobbies || '',
						favorite_foods: prefData.favorite_foods || '',
						allergies: prefData.allergies || '',
						health_goals: prefData.health_goals || ''
					};
				}
				safeUpdateStorage();
			}
		} catch (e) {
			console.error('Load User Error:', e);
		}
	}

	// 2. LOAD STATS
	async function loadStats() {
		const token = localStorage.getItem('auth_token');
		try {
			const res = await fetch(`${API_BASE_URL}/stats/me?t=${new Date().getTime()}`, {
				headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
			});
			const result = await res.json();

			if (res.ok) {
				const statData = result.data || result;
				processStats(statData);
			}
		} catch (e) {
			console.error('Gagal load stats:', e);
		}
	}

	function processStats(data) {
		// Ambil raw data
		const rawData = data.history || data.daily_scores || data.scores || [];

		let last7Days = [];

		// 1. BERSIHKAN DATA (Hapus Duplikat Hari)
		if (Array.isArray(rawData) && rawData.length > 0) {
			const groupedData = {};
			rawData.forEach((item) => {
				// Grouping by Tanggal (YYYY-MM-DD)
				// Pastikan item.date valid, ambil bagian tanggalnya saja
				let dateKey = item.date;
				if (item.date && item.date.includes('T')) {
					dateKey = item.date.split('T')[0];
				}
				// Timpa data lama dengan data baru (asumsi data urut waktu, atau logic backend replace)
				groupedData[dateKey] = item;
			});

			// Urutkan berdasarkan tanggal
			const uniqueHistory = Object.values(groupedData).sort(
				(a, b) => new Date(a.date) - new Date(b.date)
			);

			// Ambil maksimal 7 hari terakhir
			last7Days = uniqueHistory.slice(-7);

			// MAP DATA UNTUK GRAFIK
			weeklyStats = last7Days.map((item) => {
				const date = new Date(item.date);
				const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);

				// Hitung Score Manual
				let calculatedScore = 0;
				if (item.mood_score) calculatedScore += Number(item.mood_score) * 4;

				if (item.physical_symptoms && typeof item.physical_symptoms === 'string') {
					const symptomsLower = item.physical_symptoms.toLowerCase();
					if (symptomsLower.includes('obat')) calculatedScore += 20;
					if (symptomsLower.includes('makan')) calculatedScore += 20;
					if (symptomsLower.includes('ibadah') || symptomsLower.includes('sholat'))
						calculatedScore += 20;
					if (symptomsLower.includes('fisik') || symptomsLower.includes('olahraga'))
						calculatedScore += 20;
				} else if (calculatedScore === 0 && item.mood_score) {
					calculatedScore = item.mood_score * 20;
				}

				if (calculatedScore > 100) calculatedScore = 100;

				return { day: dayName, score: Math.round(calculatedScore) };
			});
		} else {
			weeklyStats = [];
		}

		// 2. HITUNG MOOD SUMMARY (MURNI DARI last7Days yang SUDAH BERSIH)
		// Kita abaikan data.mood_counts dari backend
		let newMoodList = moodSummaryList.map((m) => ({ ...m, count: 0 }));

		last7Days.forEach((item) => {
			// Kita cari mood dari item.mood (string) atau item.mood_score (number)
			let currentMood = item.mood;

			// Mapping Kalimat Backend -> Keyword Frontend
			if (currentMood) {
				const mapKey = {
					'hari ini berat banget ya?': 'sedih',
					'lagi ngerasa nggak oke ya?': 'buruk',
					'hari ini biasa aja?': 'netral',
					'kayaknya lagi happy nih?': 'senang',
					'wah, hari ini luar biasa ya!': 'bahagia'
				};
				let cleanKey = currentMood.toLowerCase();
				if (mapKey[cleanKey]) cleanKey = mapKey[cleanKey];

				const target = newMoodList.find((m) => m.key.toLowerCase() === cleanKey);
				if (target) target.count += 1;
			}
		});

		moodSummaryList = newMoodList;
	}

	function safeUpdateStorage() {
		try {
			const dataToSave = { ...user, preferences: personalData };
			localStorage.setItem('user_data', JSON.stringify(dataToSave));
			userStore.updateProfile(user);
		} catch (e) {}
	}

	function startEditProfile() {
		profileForm = { ...user };
		profileForm.gender = profileForm.gender || 'L';
		profileForm.birth_date = profileForm.birth_date || '';
		profileForm.phone_number = profileForm.phone_number || '';
		profileForm.address = profileForm.address || '';
		phoneError = '';
		isEditingProfile = true;
	}

	async function saveProfile() {
		if (!profileForm.name || !profileForm.diagnosis) return alert('Nama & Diagnosis wajib diisi!');

		if (!validatePhoneNumber(profileForm.phone_number)) {
			return alert('Nomor telepon tidak valid! Harus angka.');
		}

		isLoading = true;
		const token = localStorage.getItem('auth_token');
		let errors = [];

		// 1. UPDATE PROFILE UTAMA (PUT JSON)
		try {
			const payloadMain = { name: profileForm.name, diagnosis: profileForm.diagnosis };
			const resMain = await fetch(`${API_BASE_URL}/profile`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				},
				body: JSON.stringify(payloadMain)
			});
			if (!resMain.ok) throw new Error('Gagal update Nama/Diagnosis');
		} catch (e) {
			errors.push(e.message);
		}

		// 2. UPDATE BIO (PUT JSON)
		try {
			const bioPayload = {
				birth_date: profileForm.birth_date,
				gender: profileForm.gender,
				address: profileForm.address,
				phone_number: profileForm.phone_number
			};
			const resBio = await fetch(`${API_BASE_URL}/profile/bio`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				},
				body: JSON.stringify(bioPayload)
			});
			if (!resBio.ok) throw new Error('Gagal update Biodata');
		} catch (e) {
			errors.push(e.message);
		}

		isLoading = false;

		if (errors.length > 0) {
			alert(`Ada kesalahan:\n- ${errors.join('\n- ')}`);
		} else {
			alert('Biodata berhasil diperbarui!');
			isEditingProfile = false;
			await loadUserData();
		}
	}

	function startEditPersonal() {
		// PENTING: Inisialisasi form dengan data yang ada, jangan kosong!
		personalForm = {
			hobbies: personalData.hobbies || '',
			favorite_foods: personalData.favorite_foods || '',
			allergies: personalData.allergies || '',
			health_goals: personalData.health_goals || ''
		};
		isEditingPersonal = true;
	}

	// --- FUNGSI SAVE PERSONAL (FIX PUT & RELOAD) ---
	async function savePersonal() {
		isLoading = true;
		const token = localStorage.getItem('auth_token');
		try {
			const res = await fetch(`${API_BASE_URL}/profile/preferences`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				},
				body: JSON.stringify(personalForm)
			});

			if (!res.ok) {
				throw new Error('Gagal simpan preferensi');
			}

			// Update local state agar langsung berubah di UI
			personalData = { ...personalForm };
			safeUpdateStorage();
			isEditingPersonal = false;

			alert('Preferensi berhasil disimpan!');
			// Reload dari server untuk memastikan sinkronisasi
			await loadUserData();
		} catch (e) {
			alert('Gagal menyimpan data: ' + e.message);
		} finally {
			isLoading = false;
		}
	}

	function validatePhoneNumber(value) {
		if (!value) {
			phoneError = '';
			return true;
		}
		const regex = /^[0-9+]+$/;
		if (!regex.test(value)) {
			phoneError = 'Hanya angka';
			return false;
		}
		if (value.length > 15) {
			phoneError = 'Terlalu panjang';
			return false;
		}
		phoneError = '';
		return true;
	}

	function handleLogout() {
		if (confirm('Keluar?')) {
			localStorage.clear();
			goto('/login');
		}
	}
</script>

<div class="min-h-screen bg-slate-50 pb-32 font-sans text-slate-800">
	<Header />

	<main class="relative z-20 mx-auto -mt-20 max-w-4xl space-y-6 px-6 md:px-10">
		<Card className="relative overflow-hidden shadow-xl shadow-slate-200/60 border-none">
			<div class="absolute top-6 right-6 z-10 flex gap-2">
				{#if !isEditingProfile}
					<button
						onclick={startEditProfile}
						class="rounded-full px-3 py-1 text-xs font-bold text-cyan-600 transition hover:bg-cyan-50"
						><i class="fa-regular fa-pen-to-square mr-1"></i>ubah</button
					>
				{/if}
			</div>

			<div class="flex flex-col items-center text-center">
				<div class="group relative mb-6">
					<div
						class="relative h-28 w-28 overflow-hidden rounded-full shadow-lg ring-4 ring-slate-50"
					>
						{#if user.photo_url}
							<img src={user.photo_url} alt="Profil" class="h-full w-full object-cover" />
						{:else}
							<div
								class="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-500 text-5xl font-bold text-white"
							>
								{initial}
							</div>
						{/if}
					</div>
				</div>

				{#if isEditingProfile}
					<div class="w-full space-y-4 px-2 text-left" in:slide>
						<div class="mb-6 text-center">
							<label class="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap</label>
							<Input
								bind:value={profileForm.name}
								className="text-center font-bold text-lg bg-cyan-50 border-cyan-300 text-slate-700"
							/>
						</div>
						<div class="mb-6 text-center">
							<label class="text-[10px] font-bold text-slate-400 uppercase">Diagnosis</label>
							<Input
								bind:value={profileForm.diagnosis}
								className="text-center text-sm text-slate-600"
							/>
						</div>
						<div class="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
							<h4 class="mb-2 text-sm font-bold text-slate-700">Biodata Administratif</h4>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="text-[10px] font-bold text-slate-400 uppercase">Tgl Lahir</label>
									<input
										type="date"
										bind:value={profileForm.birth_date}
										class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 outline-none focus:border-cyan-500"
									/>
								</div>
								<div>
									<label class="text-[10px] font-bold text-slate-400 uppercase">Gender</label>
									<select
										bind:value={profileForm.gender}
										class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 outline-none focus:border-cyan-500"
									>
										<option value="L">Laki-laki</option><option value="P">Perempuan</option>
									</select>
								</div>
							</div>
							<div>
								<label class="text-[10px] font-bold text-slate-400 uppercase">No. Telepon</label>
								<input
									type="tel"
									bind:value={profileForm.phone_number}
									oninput={(e) => validatePhoneNumber(e.target.value)}
									class="mt-1 w-full rounded-xl border {phoneError
										? 'border-red-500 bg-red-50'
										: 'border-slate-200 bg-white'} p-3 text-sm text-slate-600 outline-none focus:border-cyan-500"
								/>
								{#if phoneError}<p class="mt-1 text-xs font-bold text-red-500">{phoneError}</p>{/if}
							</div>
							<div>
								<label class="text-[10px] font-bold text-slate-400 uppercase">Alamat</label>
								<textarea
									bind:value={profileForm.address}
									rows="2"
									class="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 outline-none focus:border-cyan-500"
								></textarea>
							</div>
							<div class="flex gap-3 pt-2">
								<Button
									onclick={() => (isEditingProfile = false)}
									variant="secondary"
									className="flex-1 py-2 text-xs">Batal</Button
								>
								<Button
									onclick={saveProfile}
									disabled={isLoading || phoneError}
									className="flex-1 py-2 text-xs bg-cyan-600 text-white disabled:opacity-50"
									>Simpan</Button
								>
							</div>
						</div>
					</div>
				{:else}
					<h2 class="text-2xl font-bold text-slate-800">{user.name || 'Nama?'}</h2>
					<p class="mb-3 text-sm text-slate-400">{user.email}</p>
					{#if user.diagnosis}
						<span
							class="inline-block rounded-full border border-red-100 bg-red-50 px-4 py-1.5 text-xs font-bold text-red-500"
							>❤️ {user.diagnosis}</span
						>
					{/if}
					<div
						class="mt-8 grid w-full grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left"
					>
						<div>
							<p class="text-[10px] font-bold text-slate-400 uppercase">Tgl Lahir</p>
							<p class="text-sm font-medium text-slate-700">{user.birth_date || '-'}</p>
						</div>
						<div>
							<p class="text-[10px] font-bold text-slate-400 uppercase">Gender</p>
							<p class="text-sm font-medium text-slate-700">
								{user.gender === 'L' ? 'Laki-laki' : user.gender === 'P' ? 'Perempuan' : '-'}
							</p>
						</div>
						<div>
							<p class="text-[10px] font-bold text-slate-400 uppercase">No. HP</p>
							<p class="text-sm font-medium text-slate-700">{user.phone_number || '-'}</p>
						</div>
						<div>
							<p class="text-[10px] font-bold text-slate-400 uppercase">Alamat</p>
							<p class="truncate text-sm font-medium text-slate-700">{user.address || '-'}</p>
						</div>
					</div>
				{/if}
			</div>
		</Card>

		<Card className="relative border-none shadow-md">
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h3 class="text-md font-bold text-slate-800 md:text-2xl">Kenal Kamu Lebih Baik</h3>
					<p class="text-xs text-slate-400">Isi data ini untuk rekomendasi personal.</p>
				</div>
				{#if !isEditingPersonal}<button
						onclick={startEditPersonal}
						class="rounded-full px-3 py-1 text-xs font-bold text-cyan-600 transition hover:bg-cyan-50"
						><i class="fa-regular fa-pen-to-square mr-1"></i>ubah</button
					>{/if}
			</div>
			{#if isEditingPersonal}
				<div class="space-y-4" in:slide>
					<div>
						<label class="text-[10px] font-bold text-slate-400 uppercase">Hobi</label><Input
							bind:value={personalForm.hobbies}
							className="text-slate-600"
						/>
					</div>
					<div>
						<label class="text-[10px] font-bold text-slate-400 uppercase">Makanan Favorit</label
						><Input bind:value={personalForm.favorite_foods} className="text-slate-600" />
					</div>
					<div>
						<label class="text-[10px] font-bold text-slate-400 uppercase">Alergi</label><Input
							bind:value={personalForm.allergies}
							className="text-slate-600"
						/>
					</div>
					<div>
						<label class="text-[10px] font-bold text-slate-400 uppercase">Target sehat</label
						><textarea
							bind:value={personalForm.health_goals}
							rows="2"
							class="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 outline-none focus:border-cyan-500"
						></textarea>
					</div>
					<div class="flex gap-3 pt-2">
						<Button
							onclick={() => (isEditingPersonal = false)}
							variant="secondary"
							className="flex-1 py-2 text-xs">Batal</Button
						>
						<Button
							onclick={savePersonal}
							disabled={isLoading}
							className="flex-1 py-2 text-xs bg-cyan-600 text-white">Simpan</Button
						>
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-3 text-sm">
					<div class="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
						<span class="text-lg"><i class="fa-solid fa-person-running text-slate-400"></i></span>
						<div>
							<span class="block text-[10px] font-bold text-slate-400 uppercase">Hobi</span>
							<p class="font-medium text-slate-700">{personalData.hobbies || '-'}</p>
						</div>
					</div>
					<div class="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
						<span class="text-lg"><i class="fa-solid fa-bowl-food text-slate-400"></i></span>
						<div>
							<span class="block text-[10px] font-bold text-slate-400 uppercase"
								>Makanan Favorit</span
							>
							<p class="font-medium text-slate-700">{personalData.favorite_foods || '-'}</p>
						</div>
					</div>
					<div class="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
						<span class="text-lg"
							><i class="fa-solid fa-triangle-exclamation text-slate-400"></i></span
						>
						<div>
							<span class="block text-[10px] font-bold text-slate-400 uppercase">Alergi</span>
							<p class="font-medium text-slate-700">{personalData.allergies || '-'}</p>
						</div>
					</div>
					<div class="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
						<span class="text-lg"><i class="fa-solid fa-crosshairs text-slate-400"></i></span>
						<div>
							<span class="block text-[10px] font-bold text-slate-400 uppercase">Target Sehat</span>
							<p class="font-medium text-slate-700">{personalData.health_goals || '-'}</p>
						</div>
					</div>
				</div>
			{/if}
		</Card>

		<Card>
			<h3 class="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800">
				<i class="fa-solid fa-chart-column"></i> Statistik Mingguan
			</h3>
			{#if weeklyStats.length === 0}
				<div class="flex w-full flex-col items-center justify-center gap-2 py-10 text-slate-400">
					<i class="fa-solid fa-chart-simple text-3xl opacity-30"></i>
					<p class="text-xs">Belum ada data mingguan.</p>
				</div>
			{:else}
				<div class="flex h-64 items-end justify-center gap-4 px-2 pb-2">
					{#each weeklyStats as stat}
						<div class="flex h-full w-12 flex-col items-center justify-end gap-2">
							<div
								class="relative flex h-40 w-full items-end justify-center rounded-lg bg-slate-50"
							>
								<div
									class="group relative w-full rounded-t-lg bg-slate-100/80 transition-all duration-500 hover:opacity-90"
									style="height: {stat.score}%"
								>
									<div
										class="absolute inset-0 rounded-t-lg bg-gradient-to-t from-cyan-500 to-blue-400 opacity-80 group-hover:from-orange-400 group-hover:to-yellow-400"
									></div>
									<div
										class="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
									>
										{stat.score}%
									</div>
								</div>
							</div>
							<span class="text-[10px] font-bold text-slate-600">{stat.score}%</span>
							<span class="text-[10px] font-bold text-slate-400 uppercase">{stat.day}</span>
						</div>
					{/each}
				</div>
			{/if}
		</Card>

		<Card>
			<h3 class="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800">
				<i class="fa-regular fa-face-smile"></i> Moodmu Pekan Ini
			</h3>
			<div class="flex items-end justify-between px-2 sm:px-6">
				{#each moodSummaryList as mood}
					<div class="flex flex-col items-center gap-2 transition-transform hover:scale-110">
						<span
							class="text-4xl filter transition-all duration-300 sm:text-5xl {mood.count > 0
								? 'opacity-100 drop-shadow-md grayscale-0'
								: 'opacity-30 grayscale'}"
						>
							{mood.icon}
						</span>
						<div
							class="flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-bold transition-colors {mood.count >
							0
								? 'bg-cyan-100 text-cyan-700'
								: 'bg-slate-100 text-slate-400'}"
						>
							{mood.count}x
						</div>
					</div>
				{/each}
			</div>
		</Card>

		<div class="pb-10">
			<Button
				onclick={handleLogout}
				className="w-full py-4 justify-center bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 font-bold rounded-xl transition-transform active:scale-95 border-none"
			>
				Keluar <i class="fa-solid fa-arrow-right-from-bracket ml-2"></i>
			</Button>
		</div>
	</main>
	<Navbar />
</div>
