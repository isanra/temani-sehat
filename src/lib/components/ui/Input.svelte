<script>
	let { value = $bindable(), placeholder, type = 'text', className = '' } = $props();
</script>

<input
	{type}
	bind:value
	{placeholder}
	class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition-all outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 {className}"
/>
