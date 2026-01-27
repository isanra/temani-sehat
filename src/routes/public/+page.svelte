<script>
	// --- STATE MANAGEMENT (Svelte 5 Runes) ---

	let activeTab = $state('home'); // home, care, shop, consult, profile

	// FITUR 1 & 2: User Data & Paket
	let user = $state({
		name: 'Ihsan',
		package: 'Premium',
		avatar: 'IR'
	});

	// FITUR 5: Laporan Harian (State)
	let dailyReport = $state({
		mood: null,
		submitted: false
	});

	// FITUR 4: Care Plan (Tugas Harian dari Pendamping)
	// Kita visualisasikan ini pakai gaya "Wide Cards" yang kamu suka
	let carePlan = $state([
		{
			id: 1,
			category: 'Motivasi',
			title: 'Dengar Podcast Pagi',
			sub: 'Topik: Berdamai dengan Sakit',
			icon: '🎧',
			done: false,
			color: 'bg-purple-100 text-purple-600'
		},
		{
			id: 2,
			category: 'Pola Makan',
			title: 'Sarapan Bubur',
			sub: 'Hindari kopi & pedas',
			icon: '🥣',
			done: false,
			color: 'bg-orange-100 text-orange-600'
		},
		{
			id: 3,
			category: 'Ibadah',
			title: 'Dzikir Pagi',
			sub: 'Minimal 100x',
			icon: '📿',
			done: false,
			color: 'bg-emerald-100 text-emerald-600'
		},
		{
			id: 4,
			category: 'Obat',
			title: 'Obat Lambung',
			sub: '1 Jam sebelum makan',
			icon: '💊',
			done: false,
			color: 'bg-red-100 text-red-600'
		},
		{
			id: 5,
			category: 'Fisik',
			title: 'Jalan Santai',
			sub: 'Keliling rumah 5 menit',
			icon: '💪',
			done: false,
			color: 'bg-blue-100 text-blue-600'
		}
	]);

	// FITUR 6: Konsultan
	let consultants = [
		{ name: 'Dr. Arief Sp.PD', role: 'Spesialis Penyakit Dalam', status: 'Online' },
		{ name: 'Ns. Ratna', role: 'Perawat Pendamping', status: 'Online' }
	];

	// Hitung Progress untuk Progress Bar di Header
	let completedTasks = $derived(carePlan.filter((t) => t.done).length);
	let progressPercent = $derived((completedTasks / carePlan.length) * 100);

	// --- ACTIONS ---
	function toggleTask(index) {
		carePlan[index].done = !carePlan[index].done;
	}

	function submitReport() {
		dailyReport.submitted = true;
	}
</script>

<div class="min-h-screen bg-slate-50 pb-32 font-sans text-slate-800">
	<header
		class="relative overflow-hidden rounded-b-[3rem] bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-700 px-8 pt-12 pb-28 text-white shadow-2xl"
	>
		<div
			class="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
		></div>

		<div class="relative z-10 mx-auto max-w-4xl">
			<div class="flex items-start justify-between">
				<div>
					<div class="mb-1 flex items-center gap-2">
						<p class="text-lg font-medium text-cyan-100">Assalamualaikum,</p>
						<span
							class="rounded-full border border-orange-300 bg-orange-400/90 px-3 py-1 text-xs font-bold text-white shadow-sm"
						>
							{user.package}
						</span>
					</div>
					<h1 class="mb-2 text-4xl font-extrabold tracking-tight md:text-5xl">{user.name}</h1>
				</div>

				<div
					onclick={() => (activeTab = 'profile')}
					class="cursor-pointer rounded-full bg-white/20 p-2 backdrop-blur-md transition hover:bg-white/30"
				>
					<div
						class="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-2xl font-bold text-cyan-600 shadow-sm"
					>
						{user.avatar}
					</div>
				</div>
			</div>

			<div class="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-md">
				<div class="mb-3 flex items-end justify-between">
					<p class="text-lg font-medium text-cyan-50">Target Sehat Hari Ini</p>
					<p class="text-2xl font-bold text-orange-300">
						{completedTasks}<span class="text-lg text-white/60">/{carePlan.length}</span>
					</p>
				</div>
				<div class="h-4 w-full rounded-full bg-black/20 shadow-inner">
					<div
						class="h-4 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 shadow-[0_0_15px_rgba(251,146,60,0.6)] transition-all duration-700"
						style="width: {progressPercent}%"
					></div>
				</div>
			</div>
		</div>
	</header>

	<main class="relative z-20 mx-auto -mt-20 max-w-4xl space-y-8 px-6 md:px-10">
		{#if activeTab === 'home'}
			<div
				class="flex flex-col items-center gap-4 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-blue-900/5"
			>
				{#if !dailyReport.submitted}
					<h3 class="text-2xl font-bold text-slate-700">Gimana perasaanmu saat ini?</h3>
					<p class="text-slate-400">Update kondisimu agar pendamping bisa merespon.</p>

					<div class="mt-2 flex gap-4">
						{#each ['😭', '😟', '😐', '🙂', '😁'] as emoji, i}
							<button
								onclick={() => (dailyReport.mood = i)}
								class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-3xl transition-all hover:scale-110 hover:bg-orange-100 hover:shadow-lg focus:ring-4 focus:ring-orange-200
								{dailyReport.mood === i ? 'scale-110 bg-orange-100 ring-4 ring-orange-200' : ''}"
							>
								{emoji}
							</button>
						{/each}
					</div>

					{#if dailyReport.mood !== null}
						<button
							onclick={submitReport}
							class="mt-4 w-full rounded-2xl bg-cyan-600 py-4 font-bold text-white shadow-lg shadow-cyan-200 transition hover:bg-cyan-700"
						>
							Kirim Laporan
						</button>
					{/if}
				{:else}
					<div class="animate-in zoom-in py-4">
						<div
							class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600"
						>
							✓
						</div>
						<h3 class="text-xl font-bold text-slate-800">Laporan Terkirim!</h3>
						<p class="text-slate-500">Istirahat yang cukup ya.</p>
					</div>
				{/if}
			</div>

			<div>
				<h3 class="mb-6 border-l-4 border-cyan-500 pl-2 text-2xl font-bold text-slate-700">
					Rencana Pendampingan
				</h3>

				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					{#each carePlan as task, i}
						<button
							onclick={() => toggleTask(i)}
							class="group relative transform overflow-hidden rounded-3xl border-2 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
							{task.done
								? 'border-cyan-400 bg-white opacity-80 shadow-lg ring-2 shadow-cyan-100 ring-cyan-100'
								: 'border-slate-100 bg-white shadow-sm hover:border-cyan-200'}"
						>
							<div class="flex items-center gap-5">
								<div
									class="h-16 w-16 flex-shrink-0 rounded-2xl {task.color} bg-opacity-30 flex items-center justify-center text-4xl shadow-sm"
								>
									{task.icon}
								</div>

								<div class="min-w-0 flex-1">
									<h4
										class="truncate text-lg font-bold text-slate-700 {task.done
											? 'text-slate-400 line-through'
											: ''}"
									>
										{task.title}
									</h4>
									<p class="mt-1 truncate text-sm text-slate-400">
										{task.sub}
									</p>
								</div>

								<div
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors
									{task.done ? 'border-cyan-500 bg-cyan-500' : 'border-slate-200 bg-slate-50'}"
								>
									{#if task.done}<span class="font-bold text-white">✓</span>{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<div class="pb-10">
				<h3 class="mb-6 border-l-4 border-orange-400 pl-2 text-2xl font-bold text-slate-700">
					Edukasi Hari Ini
				</h3>
				<div class="scrollbar-hide -mx-6 flex gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:px-0">
					<div
						class="min-w-[280px] cursor-pointer rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
					>
						<div
							class="mb-4 flex h-32 items-center justify-center rounded-2xl bg-slate-100 text-4xl"
						>
							🎬
						</div>
						<span class="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-600"
							>Video • 5 Min</span
						>
						<h4 class="mt-3 text-lg font-bold text-slate-700">Mengatasi Panic Attack</h4>
					</div>
					<div
						class="min-w-[280px] cursor-pointer rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
					>
						<div
							class="mb-4 flex h-32 items-center justify-center rounded-2xl bg-slate-100 text-4xl"
						>
							📖
						</div>
						<span class="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600"
							>Artikel</span
						>
						<h4 class="mt-3 text-lg font-bold text-slate-700">Keajaiban Dzikir Pagi</h4>
					</div>
				</div>
			</div>
		{/if}

		{#if activeTab === 'care'}
			<div class="animate-in fade-in space-y-6 pt-10">
				<h2 class="text-3xl font-bold text-slate-800">Teman Sehatmu</h2>
				<div
					class="flex items-center gap-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
				>
					<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-100 text-3xl">
						👩‍⚕️
					</div>
					<div class="flex-1">
						<h3 class="text-xl font-bold text-slate-800">Ns. Ratna</h3>
						<p class="text-slate-500">Perawat Pendamping</p>
					</div>
					<button
						class="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-200"
						>Chat</button
					>
				</div>
				<div
					class="flex items-center gap-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
				>
					<div
						class="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl"
					>
						👥
					</div>
					<div class="flex-1">
						<h3 class="text-xl font-bold text-slate-800">Grup GERD Fighter</h3>
						<p class="text-slate-500">12 Teman Online</p>
					</div>
					<button class="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-600">Gabung</button>
				</div>
			</div>
		{/if}

		{#if activeTab === 'consult'}
			<div class="animate-in fade-in space-y-6 pt-10">
				<h2 class="text-3xl font-bold text-slate-800">Konsultasi Ahli</h2>
				{#each consultants as doc}
					<div
						class="flex items-center gap-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
					>
						<div class="h-16 w-16 rounded-2xl bg-slate-100"></div>
						<div class="flex-1">
							<h3 class="text-xl font-bold text-slate-800">{doc.name}</h3>
							<p class="text-slate-500">{doc.role}</p>
						</div>
						<span class="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-500"
							>{doc.status}</span
						>
					</div>
				{/each}
			</div>
		{/if}
	</main>

	<nav
		class="fixed bottom-0 z-50 w-full border-t border-slate-200 bg-white/90 px-6 py-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl"
	>
		<div class="mx-auto flex max-w-4xl items-center justify-around">
			<button
				onclick={() => (activeTab = 'home')}
				class="flex flex-col items-center gap-1 transition {activeTab === 'home'
					? 'scale-110 text-cyan-600'
					: 'text-slate-400'}"
			>
				<span class="text-3xl drop-shadow-sm filter">🏠</span>
			</button>

			<button
				onclick={() => (activeTab = 'care')}
				class="flex flex-col items-center gap-1 transition {activeTab === 'care'
					? 'scale-110 text-cyan-600'
					: 'text-slate-400'}"
			>
				<span class="text-3xl">🤝</span>
			</button>

			<button
				onclick={() => (activeTab = 'shop')}
				class="-mt-12 rounded-2xl border-4 border-white bg-gradient-to-r from-orange-400 to-orange-500 p-4 text-white shadow-xl ring-1 ring-slate-100 transition hover:scale-105"
			>
				<span class="text-3xl">🛒</span>
			</button>

			<button
				onclick={() => (activeTab = 'consult')}
				class="flex flex-col items-center gap-1 transition {activeTab === 'consult'
					? 'scale-110 text-cyan-600'
					: 'text-slate-400'}"
			>
				<span class="text-3xl">🩺</span>
			</button>

			<button
				onclick={() => (activeTab = 'profile')}
				class="flex flex-col items-center gap-1 transition {activeTab === 'profile'
					? 'scale-110 text-cyan-600'
					: 'text-slate-400'}"
			>
				<span class="text-3xl">👤</span>
			</button>
		</div>
	</nav>
</div>
	