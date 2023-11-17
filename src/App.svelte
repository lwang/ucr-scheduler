<script>
	import { onMount } from 'svelte';
	import { theme, active, version, term, courses} from './store.js';
	import Header from './Header.svelte'
	import Home from './Home.svelte'
	import SelectCourse from './SelectCourse.svelte'
	import Scheduler from './Scheduler.svelte'
	
	if (process.env.VERSION != $version) {
        active.set('Home');
        term.set({});
        courses.set([]);
        version.set(process.env.VERSION);
        localStorage.removeItem('options');
        location.reload();
    }
</script>

<body class='{$theme}'>
	<div style='height:100%; overflow:hidden;'>
		<Header />
		{#if $active == 'Home'}
			<Home />
		{:else if $active == 'Select Courses'}
			<SelectCourse />
		{:else if $active == 'Choose Schedule'}
			<Scheduler />
		{/if}
	</div>
</body>

<style>
	* {
		text-align: center;
		transition: 0.15s;
	}

	body.light {
		background-color: var(--gray2);
		color: var(--gray6);
	}

	body.dark {
		background-color: var(--gray4);
		color: var(--gray0);
	}

	@media (min-width: 640px) {
		body {
			max-width: none;
		}
	}
</style>