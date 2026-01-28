<script>
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/userStore.svelte.js';

	// Import API (Pastikan pakai API_BASE_URL yang isinya "/api")
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

	// STATE FOTO ASLI (Untuk Upload)
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
		{ key: 'sedih', icon: '😭', count: 0 },
		{ key: 'buruk', icon: '😟', count: 0 },
		{ key: 'netral', icon: '😐', count: 0 },
		{ key: 'senang', icon: '🙂', count: 0 },
		{ key: 'bahagia', icon: '😁', count: 0 }
	]);

	let profileForm = $state({});
	let personalForm = $state({});

	// --- LOGIC ---

	onMount(async () => {
		// Restore Data (Safe Mode)
		const stored = localStorage.getItem('user_data');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				user = { ...user, ...parsed };
				if (parsed.preferences) personalData = { ...personalData, ...parsed.preferences };
			} catch (e) {
				console.error('Restore error', e);
			}
		}
		await loadUserData();
		loadDummyStats();
	});

	function safeUpdateStorage() {
		try {
			const dataToSave = { ...user, preferences: personalData };
			// Hapus foto base64/url panjang dari localstorage biar ga penuh
			if (
				dataToSave.photo_url &&
				(dataToSave.photo_url.startsWith('data:image') || dataToSave.photo_url.length > 500)
			) {
				delete dataToSave.photo_url;
			}
			localStorage.setItem('user_data', JSON.stringify(dataToSave));
			userStore.updateProfile(user);
		} catch (e) {
			console.warn('Storage penuh, skip save local.', e);
		}
	}

	async function loadUserData() {
		const token = localStorage.getItem('auth_token');
		if (!token) return goto('/login');

		const headers = {
			Authorization: `Bearer ${token}`,
			'ngrok-skip-browser-warning': 'true'
		};

		try {
			// Gunakan API_BASE_URL (yang isinya "/api")
			const resProfile = await fetch(`${API_BASE_URL}/profile`, { headers });

			if (resProfile.status === 401) return handleLogout();

			if (resProfile.ok) {
				const result = await resProfile.json();
				const d = result.data || result;

				// TRIK CACHE BUSTING: Tambah ?t=waktu agar foto langsung berubah
				let fixedPhotoUrl = d.photo_url;
				if (fixedPhotoUrl && !fixedPhotoUrl.startsWith('data:')) {
					fixedPhotoUrl = `${fixedPhotoUrl}?t=${new Date().getTime()}`;
				}

				user = {
					...user,
					name: d.name || user.name,
					email: d.email || user.email,
					diagnosis: d.diagnosis || user.diagnosis,
					photo_url: fixedPhotoUrl || user.photo_url,
					birth_date: d.bio?.birth_date || d.birth_date || user.birth_date || '',
					gender: d.bio?.gender || d.gender || user.gender || '',
					address: d.bio?.address || d.address || user.address || '',
					phone_number: d.bio?.phone_number || d.phone_number || user.phone_number || ''
				};

				if (d.preferences) {
					personalData = {
						hobbies: d.preferences.hobbies || '',
						favorite_foods: d.preferences.favorite_foods || '',
						allergies: d.preferences.allergies || '',
						health_goals: d.preferences.health_goals || ''
					};
				}

				safeUpdateStorage();
			}
		} catch (e) {
			console.error('Load User Error', e);
		}
	}

	// --- HANDLER FOTO ---
	function triggerFileUpload() {
		if (isEditingProfile) fileInput.click();
	}

	function handleFileChange(e) {
		const file = e.target.files[0];
		if (!file) return;

		// Simpan file asli untuk diupload
		selectedFile = file;

		// Preview sementara
		const reader = new FileReader();
		reader.onload = (e) => {
			profileForm.photo_url = e.target.result;
		};
		reader.readAsDataURL(file);
	}

	// --- SAVE PROFILE (FOTO + BIODATA) ---
	function startEditProfile() {
		profileForm = { ...user };
		selectedFile = null;
		phoneError = '';
		isEditingProfile = true;
	}

	async function saveProfile() {
		if (!profileForm.name || !profileForm.diagnosis) return alert('Nama & Diagnosis wajib diisi!');
		if (phoneError) return alert('Perbaiki nomor telepon dulu!');

		isLoading = true;
		const token = localStorage.getItem('auth_token');

		const jsonHeaders = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			'ngrok-skip-browser-warning': 'true'
		};

		try {
			// 1. UPLOAD FOTO (Kalau ada file baru)
			if (selectedFile) {
				const formData = new FormData();
				formData.append('photo', selectedFile);

				// Kirim ke JALUR TIKUS (/api/profile/photo)
				// JANGAN pakai Header Content-Type multipart!
				const photoRes = await fetch(`${API_BASE_URL}/profile/photo`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'ngrok-skip-browser-warning': 'true'
					},
					body: formData
				});

				if (!photoRes.ok) {
					// Coba baca errornya
					const errText = await photoRes.text();
					console.error('Upload Error:', errText);
					throw new Error('Gagal upload foto. Cek koneksi.');
				}
			}

			// 2. UPDATE PROFILE UTAMA
			const resMain = await fetch(`${API_BASE_URL}/profile`, {
				method: 'PUT',
				headers: jsonHeaders,
				body: JSON.stringify({ name: profileForm.name, diagnosis: profileForm.diagnosis })
			});
			if (!resMain.ok) throw new Error('Gagal update profil utama');

			// 3. UPDATE BIO
			const resBio = await fetch(`${API_BASE_URL}/profile/bio`, {
				method: 'PUT',
				headers: jsonHeaders,
				body: JSON.stringify({
					birth_date: profileForm.birth_date,
					gender: profileForm.gender,
					address: profileForm.address,
					phone_number: profileForm.phone_number
				})
			});
			if (!resBio.ok) throw new Error('Gagal update biodata');

			// 4. RELOAD DATA (Penting biar foto ke-refresh!)
			await loadUserData();

			isEditingProfile = false;
			alert('Profil berhasil diperbarui!');
		} catch (e) {
			console.error(e);
			alert(`Gagal: ${e.message}`);
		} finally {
			isLoading = false;
		}
	}

	// --- SAVE PERSONAL ---
	function startEditPersonal() {
		personalForm = { ...personalData };
		isEditingPersonal = true;
	}

	async function savePersonal() {
		isLoading = true;
		const token = localStorage.getItem('auth_token');

		try {
			const res = await fetch(`${API_BASE_URL}/profile/preferences`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'ngrok-skip-browser-warning': 'true'
				},
				body: JSON.stringify(personalForm)
			});

			if (!res.ok) throw new Error('Gagal menyimpan ke server');

			personalData = { ...personalForm };
			safeUpdateStorage();
			isEditingPersonal = false;
			alert('Berhasil disimpan!');
		} catch (e) {
			alert('Gagal menyimpan data.');
		} finally {
			isLoading = false;
		}
	}

	function validatePhoneNumber(value) {
		const regex = /^[0-9+]*$/;
		if (!regex.test(value)) {
			phoneError = 'Hanya boleh angka (0-9)';
			return false;
		} else if (value.length > 15) {
			phoneError = 'Nomor terlalu panjang';
			return false;
		} else {
			phoneError = '';
			return true;
		}
	}

	function handleLogout() {
		if (confirm('Keluar?')) {
			localStorage.clear();
			goto('/login');
		}
	}

	// Dummy Stats
	function loadDummyStats() {
		const dummyResult = {
			data: {
				history: [
					{ date: '2026-01-20', mood_score: 4 },
					{ date: '2026-01-21', mood_score: 4 },
					{ date: '2026-01-22', mood_score: 4 },
					{ date: '2026-01-23', mood_score: 3 },
					{ date: '2026-01-24', mood_score: 2 },
					{ date: '2026-01-25', mood: 'senang', mood_score: 5 },
					{ date: '2026-01-26', mood: 'senang', mood_score: 4, score: 85 }
				],
				mood_summary: { senang: 2, bahagia: 1 }
			}
		};
		processStats(dummyResult.data);
	}

	function processStats(data) {
		if (data.history) {
			const last7Days = data.history.slice(-7);
			weeklyStats = last7Days.map((item) => {
				const date = new Date(item.date);
				const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);
				let finalScore = item.score || (item.mood_score ? item.mood_score * 20 : 0);
				return { day: dayName, score: finalScore };
			});
		}
		if (data.mood_summary) {
			moodSummaryList = moodSummaryList.map((item) => ({
				...item,
				count: data.mood_summary[item.key] || 0
			}));
		}
	}
</script>

<div class="min-h-screen bg-slate-50 pb-32 font-sans text-slate-800">
	<Header />

	<main class="relative z-20 mx-auto -mt-20 max-w-4xl space-y-6 px-6 md:px-10">
		<Card className="relative overflow-hidden shadow-xl shadow-slate-200/60 border-none">
			<div class="absolute top-6 right-6 z-10 flex gap-2">
				{#if isEditingProfile}{:else}<button
						onclick={startEditProfile}
						class="rounded-full px-3 py-1 text-xs font-bold text-cyan-600 transition hover:bg-cyan-50"
						><i class="fa-regular fa-pen-to-square mr-1"></i>ubah</button
					>{/if}
			</div>

			<div class="flex flex-col items-center text-center">
				<div class="group relative mb-6">
					<input
						type="file"
						accept="image/jpeg, image/jpg"
						bind:this={fileInput}
						onchange={handleFileChange}
						class="hidden"
					/>

					<button
						onclick={triggerFileUpload}
						class="relative h-28 w-28 overflow-hidden rounded-full shadow-lg ring-4 ring-slate-50 transition-all {isEditingProfile
							? 'cursor-pointer hover:opacity-90 hover:ring-cyan-200'
							: 'cursor-default'}"
					>
						{#if isEditingProfile && profileForm.photo_url}
							<img src={profileForm.photo_url} alt="Preview" class="h-full w-full object-cover" />
						{:else if user.photo_url}
							<img src={user.photo_url} alt="Profil" class="h-full w-full object-cover" />
						{:else}
							<div
								class="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-500 text-5xl font-bold text-white"
							>
								{initial}
							</div>
						{/if}
						{#if isEditingProfile}
							<div
								class="absolute inset-0 flex items-center justify-center bg-black/30 text-3xl text-white backdrop-blur-[1px]"
							>
								<i class="fa-solid fa-camera"></i>
							</div>
						{/if}
					</button>
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
										: 'border-slate-200 bg-white'} p-3 text-sm text-slate-600 transition-colors outline-none focus:border-cyan-500"
								/>
								{#if phoneError}
									<p class="mt-1 text-xs font-bold text-red-500">
										<i class="fa-solid fa-circle-exclamation mr-1"></i>{phoneError}
									</p>
								{/if}
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
									className="flex-1 py-2 text-xs bg-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
						<label class="text-[10px] font-bold text-slate-400 uppercase">Hobi</label>
						<Input bind:value={personalForm.hobbies} className="text-slate-600" />
					</div>
					<div>
						<label class="text-[10px] font-bold text-slate-400 uppercase">Makanan Favorit</label>
						<Input bind:value={personalForm.favorite_foods} className="text-slate-600" />
					</div>
					<div>
						<label class="text-[10px] font-bold text-slate-400 uppercase">Alergi</label>
						<Input bind:value={personalForm.allergies} className="text-slate-600" />
					</div>
					<div>
						<label class="text-[10px] font-bold text-slate-400 uppercase">Target sehat</label>
						<textarea
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
			<div class="flex h-64 items-end justify-between gap-2 px-2 pb-2">
				{#each weeklyStats as stat}
					<div class="flex h-full w-full flex-col items-center justify-end gap-1">
						<div class="relative flex h-40 w-full items-end justify-center rounded-lg bg-slate-50">
							<div
								class="group relative w-full rounded-t-lg bg-slate-100/80 transition-all duration-500 hover:opacity-90"
								style="height: {stat.score}%"
							>
								<div
									class="absolute inset-0 rounded-t-2xl bg-gradient-to-t from-cyan-500 to-blue-400 opacity-80 group-hover:from-orange-400 group-hover:to-yellow-400"
								></div>
							</div>
						</div>
						<span class="text-[10px] font-bold text-slate-600">{stat.score}%</span>
						<span class="text-[10px] font-bold text-slate-400 uppercase">{stat.day}</span>
					</div>
				{/each}
			</div>
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
				>Keluar <i class="fa-solid fa-arrow-right-from-bracket ml-2"></i></Button
			>
		</div>
	</main>
	<Navbar />
</div>
