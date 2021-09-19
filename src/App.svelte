<script>
	const version = 1.0;
	import {theme, active} from './store.js';
	import Header from './Header.svelte'
	import Home from './Home.svelte'
	import SelectCourse from './SelectCourse.svelte'
	import Scheduler from './Scheduler.svelte'
	import VersionCheck from './VersionCheck.svelte'
</script>

<VersionCheck current={version}/>
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