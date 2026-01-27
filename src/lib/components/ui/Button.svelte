<script>
	let {
		children,
		onclick,
		disabled = false,
		className = '',
		variant = 'primary', // primary, secondary, ghost, outline
		type = 'button'
	} = $props();

	// Base styles
	const base =
		'transition-all duration-300 font-bold rounded-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2';

	// Variants
	const variants = {
		primary:
			'bg-cyan-500 text-white shadow-lg shadow-cyan-200 hover:bg-cyan-600 hover:shadow-cyan-300',
		secondary: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
		ghost: 'bg-transparent text-slate-500 hover:bg-slate-50',
		outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
		danger: 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
	};
</script>

<button
	{type}
	{onclick}
	{disabled}
	class="{base} {variants[variant] || variants.primary} {className}"
>
	{@render children()}
</button>
