import { browser } from '$app/environment';

export const createUserStore = () => {
	// 1. Coba ambil skor terakhir dari LocalStorage (Kalau ada)
	let initialScore = 0;
	if (browser) {
		const savedScore = localStorage.getItem('global_health_score');
		if (savedScore) {
			initialScore = parseInt(savedScore, 10);
		}
	}

	// --- STATE ---
	// Gunakan initialScore agar saat refresh TIDAK MULAI DARI 0
	let score = $state(initialScore);

	let data = $state({
		name: 'Pengguna',
		email: 'user@example.com',
		package: 'Free',
		photoUrl: null
	});

	// Data dummy task (tetap ada biar ga error)
	let tasks = $state([
		{ id: 1, done: false },
		{ id: 2, done: false }
	]);

	return {
		// Getters
		get score() {
			return score;
		},
		get tasks() {
			return tasks;
		},
		get totalTasks() {
			return tasks.length;
		},
		get completedTasks() {
			return tasks.filter((t) => t.done).length;
		},
		get data() {
			return data;
		},

		// Actions
		updateScore(newScore) {
			score = newScore;
			// AUTO SAVE: Setiap skor berubah, langsung simpan ke 'memori' browser
			if (browser) {
				localStorage.setItem('global_health_score', newScore.toString());
			}
		},

		updateProfile(newData) {
			data = { ...data, ...newData };
		},

		// Reset (Opsional, dipanggil kalau ganti hari)
		resetScore() {
			score = 0;
			if (browser) localStorage.removeItem('global_health_score');
		}
	};
};

// Buat instance store
export const userStore = createUserStore();
