<script>
	import { page } from '$app/stores';
</script>

<div class="flex h-screen bg-gray-50 font-sans">
	<aside class="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-white shadow-lg">
		<div class="flex h-16 items-center justify-center border-b border-gray-100">
			<h1 class="text-2xl font-bold text-blue-600">Temani Sehat</h1>
		</div>

		<nav class="flex-1 space-y-2 overflow-y-auto p-4">
			{#each [{ name: 'Dashboard', href: '/admin', icon: '🏠' }, { name: 'Consultations', href: '/admin/consultations', icon: '🩺' }, { name: 'Experts', href: '/admin/experts', icon: '👨‍⚕️' }, { name: 'Products', href: '/admin/products', icon: '🍎' }, { name: 'Orders', href: '/admin/orders', icon: '📦' }, { name: 'Contents', href: '/admin/contents', icon: '📺' }] as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200
                   {$page.url.pathname === item.href
						? 'bg-blue-500 text-white shadow-md shadow-blue-200'
						: 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}"
				>
					<span>{item.icon}</span>
					<span class="font-medium">{item.name}</span>
				</a>
			{/each}
		</nav>
	</aside>

	<div class="ml-64 flex flex-1 flex-col">
		<main class="flex-1 overflow-y-auto bg-gray-50">
			<header class="bg-gradient-to-r from-blue-500 to-blue-600 p-8 pb-20 text-white">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-3xl font-bold">Assalamualaikum, Admin</h2>
						<p class="mt-1 opacity-90">Selamat datang di Panel Kontrol Temani Sehat.</p>
					</div>
					<div class="rounded-full bg-white/20 p-2">
						<span class="text-2xl">TS</span>
					</div>
				</div>
			</header>

			<div class="-mt-16 px-8 pb-10">
				<slot />
			</div>
		</main>
	</div>
</div>
