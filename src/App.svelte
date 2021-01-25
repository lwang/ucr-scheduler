<script>
	export let name;
	let count = 0;

	function doSomething() {
		count += 1;
	}
</script>

<main>
	<h1>Hello {name}!</h1>
	<div>Current count: {count}</div>
	<button on:click={doSomething}>Click me</button>
	{#if count >= 5}
		<p>Above five</p>
	{:else}
		<p>Less than five</p>
	{/if}
</main>



<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #26ff00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>