<script>
    import { goto } from '$app/navigation';
    import { fly } from 'svelte/transition';
    import { API_BASE_URL } from '$lib/utils/api';

    // --- STATE ---
    let name = $state('');
    let email = $state('');
    let password = $state('');
    let passwordConfirmation = $state('');
    let diagnosis = $state('');

    // State UI
    let currentStep = $state(1);
    let showPassword = $state(false);
    let showConfirmPassword = $state(false); // State baru buat konfirmasi
    let isLoading = $state(false);
    let errorMessage = $state('');

    const inputClass = 'block w-full text-lg rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none';

    // --- LOGIC ---
    function validateCurrentStep() {
        switch (currentStep) {
            case 1:
                if (!name || name.trim().length < 3) return 'Nama minimal 3 karakter.';
                return true;
            case 2:
                if (!email || !email.includes('@')) return 'Masukkan email yang valid.';
                return true;
            case 3:
                if (!password || password.length < 6) return 'Password minimal 6 karakter.';
                return true;
            case 4:
                if (password !== passwordConfirmation) return 'Password tidak cocok.';
                return true;
            case 5:
                if (!diagnosis || diagnosis.trim() === '') return 'Diagnosis/Keluhan wajib diisi.';
                return true;
            default:
                return true;
        }
    }

    function processStep() {
        errorMessage = '';
        const validationResult = validateCurrentStep();

        if (validationResult !== true) {
            return showError(validationResult);
        }

        if (currentStep < 5) {
            currentStep += 1;
        } else {
            submitToAPI();
        }
    }

    function prevStep() {
        errorMessage = '';
        if (currentStep > 1) currentStep -= 1;
    }

    function showError(msg) {
        errorMessage = msg;
        setTimeout(() => (errorMessage = ''), 3000);
    }

    function handleEnter(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            processStep();
        }
    }

    async function submitToAPI() {
        isLoading = true;
        errorMessage = '';

        try {
            // PENTING: Gunakan /api/register (Proxy akan meneruskan ke Ngrok)
            // Pastikan endpoint di backend emang /api/register, kalau cuma /register, sesuaikan.
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Header ngrok tetap dipasang jaga-jaga
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                    diagnosis
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert('Registrasi Berhasil! Silakan Login.');
                goto('/login'); // PATH SUDAH DIPERBAIKI
            } else {
                errorMessage = result.message || 'Registrasi gagal.';
            }
        } catch (error) {
            console.error(error);
            errorMessage = 'Gagal koneksi. Pastikan Backend & Ngrok jalan.';
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 font-sans text-slate-800">
    <div class="absolute bottom-0 left-1/2 z-0 h-[65%] w-[150%] -translate-x-1/2 rounded-t-[100%] bg-gradient-to-t from-sky-500 to-cyan-400 shadow-[0_-10px_40px_rgba(14,165,233,0.3)]"></div>

    <div class="relative z-10 w-full max-w-md p-6">
        <div class="flex min-h-[500px] flex-col rounded-3xl border border-slate-100 bg-white px-8 py-10 shadow-2xl">
            
            <div class="mb-6">
                <div class="mb-6 flex items-center justify-between">
                    <div class="w-8">
                        {#if currentStep > 1}
                            <button type="button" on:click={prevStep} class="relative z-20 -ml-2 p-1 text-slate-400 transition-colors hover:text-sky-500">
                                <i class="fa-solid fa-arrow-left text-xl"></i>
                            </button>
                        {/if}
                    </div>
                    <div class="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 shadow-sm">
                        <span class="text-lg font-bold text-sky-500">TS</span>
                    </div>
                    <div class="w-8"></div>
                </div>

                <div class="mb-2 flex gap-2">
                    {#each Array(5) as _, i}
                        <div class="h-1.5 flex-1 rounded-full transition-all duration-500 {i + 1 <= currentStep ? 'bg-sky-500' : 'bg-slate-100'}"></div>
                    {/each}
                </div>
                <p class="text-center text-xs font-medium tracking-widest text-slate-400 uppercase">Langkah {currentStep} dari 5</p>
            </div>

            {#if errorMessage}
                <div class="mb-4 animate-pulse rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-500">
                    {errorMessage}
                </div>
            {/if}

            <div class="flex flex-grow flex-col justify-center">
                {#if currentStep === 1}
                    <div in:fly={{ x: 20, duration: 300 }}>
                        <h2 class="mb-2 text-2xl font-bold text-slate-900">Siapa namamu?</h2>
                        <p class="mb-6 text-slate-500">Agar kami bisa menyapamu dengan akrab.</p>
                        <input type="text" bind:value={name} on:keydown={handleEnter} class={inputClass} placeholder="Nama Lengkap" autofocus />
                    </div>
                {/if}

                {#if currentStep === 2}
                    <div in:fly={{ x: 20, duration: 300 }}>
                        <h2 class="mb-2 text-2xl font-bold text-slate-900">Apa emailmu?</h2>
                        <p class="mb-6 text-slate-500">Kami akan mengirimkan informasi penting ke sini.</p>
                        <input type="email" bind:value={email} on:keydown={handleEnter} class={inputClass} placeholder="nama@email.com" autofocus />
                    </div>
                {/if}

                {#if currentStep === 3}
                    <div in:fly={{ x: 20, duration: 300 }}>
                        <h2 class="mb-2 text-2xl font-bold text-slate-900">Buat Password</h2>
                        <p class="mb-6 text-slate-500">Minimal 6 karakter.</p>
                        <div class="relative">
                            <input type={showPassword ? 'text' : 'password'} bind:value={password} on:keydown={handleEnter} class="{inputClass} pr-12" placeholder="******" autofocus />
                            <button type="button" on:click={() => (showPassword = !showPassword)} class="absolute top-1/2 right-4 -translate-y-1/2 p-2 text-slate-400 hover:text-sky-500">
                                <i class="fa-regular {showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg"></i>
                            </button>
                        </div>
                    </div>
                {/if}

                {#if currentStep === 4}
                    <div in:fly={{ x: 20, duration: 300 }}>
                        <h2 class="mb-2 text-2xl font-bold text-slate-900">Ulangi Password</h2>
                        <p class="mb-6 text-slate-500">Ketik ulang password tadi.</p>
                        <div class="relative">
                            <input type={showConfirmPassword ? 'text' : 'password'} bind:value={passwordConfirmation} on:keydown={handleEnter} class="{inputClass} pr-12" placeholder="******" autofocus />
                            <button type="button" on:click={() => (showConfirmPassword = !showConfirmPassword)} class="absolute top-1/2 right-4 -translate-y-1/2 p-2 text-slate-400 hover:text-sky-500">
                                <i class="fa-regular {showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg"></i>
                            </button>
                        </div>
                    </div>
                {/if}

                {#if currentStep === 5}
                    <div in:fly={{ x: 20, duration: 300 }}>
                        <h2 class="mb-2 text-2xl font-bold text-slate-900">Kondisi Kesehatan</h2>
                        <p class="mb-6 text-slate-500">Keluhan utama?</p>
                        <textarea bind:value={diagnosis} class="{inputClass} h-32 resize-none" placeholder="Contoh: Sering pusing..." autofocus></textarea>
                    </div>
                {/if}
            </div>

            <div class="mt-8 relative z-20">
                <button type="button" on:click={processStep} disabled={isLoading} class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-4 text-base font-bold text-white shadow-lg shadow-sky-200 transition-all hover:scale-[1.02] hover:shadow-sky-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70">
                    {#if isLoading}
                        Memproses...
                    {:else if currentStep === 5}
                        Daftar Sekarang
                    {:else}
                        Lanjut
                    {/if}
                </button>
            </div>

            {#if currentStep === 1}
                <p class="mt-6 text-center text-sm text-slate-500">Sudah punya akun? <a href="/login" class="font-bold text-sky-600 hover:text-sky-500">Masuk</a></p>
            {/if}
        </div>
        <p class="relative z-10 mt-8 text-center text-xs font-medium text-white/80">&copy; 2026 Temani Sehat.</p>
    </div>
</div>