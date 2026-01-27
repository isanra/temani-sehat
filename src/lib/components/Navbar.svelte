<script>
	import { page } from '$app/stores';

	let currentPath = $derived($page.url.pathname);

	const navItems = [
		{
			id: 'assist',
			label: 'Pendampingan',
			iconClass: 'fa-solid fa-hand-holding-heart',
			href: '/app/care'
		},
		{
			id: 'shop',
			label: 'Toko',
			iconClass: 'fa-solid fa-cart-shopping',
			href: '/app/shop'
		},
		{
			id: 'dashboard',
			label: '',
			iconClass: 'fa-solid fa-house',
			href: '/app/dashboard',
			special: true
		},
		{
			id: 'consult',
			label: 'Konsultasi',
			iconClass: 'fa-solid fa-user-doctor',
			href: '/app/consult'
		},
		{
			id: 'profile',
			label: 'Profil',
			iconClass: 'fa-solid fa-user',
			href: '/app/profile'
		}
	];
</script>

<nav
	class="fixed bottom-0 z-50 w-full rounded-t-3xl border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl"
>
	<div class="mx-auto flex w-full max-w-2xl items-end justify-between px-6 md:max-w-4xl md:px-12">
		{#each navItems as item}
			{@const isActive = currentPath === item.href}

			<a
				href={item.href}
				class="group transition-all duration-300 {item.special
					? `-mt-20 flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-slate-50 bg-gradient-to-r from-orange-400 to-orange-500 shadow-xl ${isActive ? 'ring-4 shadow-orange-300 ring-orange-100' : ''}`
					: 'flex flex-col items-center gap-1.5 p-1'}"
			>
				<i
					class="{item.iconClass} transition-all duration-500 {item.special
						? `text-3xl ${isActive ? 'scale-110 text-cyan-100' : 'text-white'}`
						: `text-2xl ${isActive ? 'scale-110 text-cyan-600' : 'text-slate-400 group-hover:text-slate-500'}`}"
				>
				</i>

				{#if !item.special}
					<span
						class="text-xs font-bold transition-colors duration-300 {isActive
							? 'text-cyan-600'
							: 'text-slate-400'}"
					>
						{item.label}
					</span>
				{/if}
			</a>
		{/each}
	</div>
</nav>
