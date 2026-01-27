<script>
	let { children, className = '', onclick } = $props();
</script>

<div
	{onclick}
	class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all {className} {onclick
		? 'cursor-pointer hover:shadow-md'
		: ''}"
	role={onclick ? 'button' : 'presentation'}
>
	{@render children()}
</div>
