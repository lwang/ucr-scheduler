<script>
	import { fade } from 'svelte/transition';
    import { theme, term, courses, options, schedules, pinned } from './store.js';
	import MediaQuery from './MediaQuery.svelte'
	import VirtualList from './VirtualList.svelte';
	import ListItem from './ListItem.svelte';
    $: $options, schedules.set([]), pinned.set([])

    export let items = [];
	fetch(`json/${$term['code']}.json`)
        .then((data) => data.json())
		.then((jsonData) => 
		{
			jsonData.forEach((element) => 
			{
				items = [...items, 
				{
					"name": element.code,
					"content": element.description,
					"sendDispatch":element.code,
				}];
			});
		});
    ;

	let searchTerm = "";
	$: filteredList = items.filter(item => item.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);
	
	let start, end;
	function receiveDispatch(e) {
		schedules.set([])
		pinned.set([])
		let tempcourses = $courses;
		console.log(tempcourses.indexOf(e.detail.text))
		if (tempcourses.indexOf(e.detail.text) == -1)
			tempcourses = [...tempcourses, e.detail.text];
		console.log(tempcourses);
		courses.set(tempcourses);
	}

	function removeCourse(course) {
		schedules.set([])
		pinned.set([])
		let tempcourses = $courses;
		tempcourses.splice(tempcourses.indexOf(course), 1);
		courses.set(tempcourses);
	}

	function clear() {
		schedules.set([])
		pinned.set([])
		courses.set([])
	}
</script>

<div>
	<div style='float:left; width:30%;'>
		<h1 for="search" style='display:inline;'>Filter:&nbsp;</h1>
		<input type="text" id="search" bind:value={searchTerm} style='display:inline;width:50%;padding: 0.5%;' />
	</div>
	<div style='float:left; width:20%;'>
		<h1 style='display:inline;'>Selected ({$courses.length}):</h1>
	</div>
	<div style='float:right; width:50%;'>
		<h1 style='display:inline;'>Scheduler Options:</h1>
	</div>
</div>
<hr style="border-top: 1px solid #bbb; width: 100%">
<div style='width: 100%; height:75vh'>
	<MediaQuery query="(max-width: 750px)" let:matches>
	<div class='container' style='float:left; width:30%; height:100%'>
		<div style='height:100%'>
			<VirtualList items={filteredList} height={'100%'} bind:start bind:end let:item>
				<ListItem {...item} fontScale={matches?0.7:1.0} on:message={receiveDispatch} />
			</VirtualList>
		</div>
	</div>
	<div class='container' style='float:left; width:20%; height:100%'>
		<div style='height: 100%; overflow: auto;'>
			{#if $courses.length}
				{#each $courses as course, index (course)}
					<div in:fade={{delay:10}} on:click={removeCourse(course)} class='card {$theme}'>
						<h2>{course}</h2>
					</div>
				{/each}
			{:else}
				<h2>No courses</h2>
			{/if}
			<h1 on:click={clear} style='position:absolute; bottom:10px; margin: 0 auto; width:20%; cursor: pointer; '>Clear All Courses</h1>
		</div>
	</div>
	<div class='container options' style='float:right; width:50%; display:flex; flex-direction: column;'>
		<div><input style='margin-right: 0.1em;' type=checkbox bind:checked={$options.randomize}><span>Randomize generated schedule order</span></div>
		<div><span>Generate a maximum of <input type="number" bind:value={$options.max_schedules} min=0 max=9999> schedule(s)</span></div>
		<div><span>Only find sections with a minimum of <input type="number" bind:value={$options.min_seats} min=0> seat(s)</span></div>
		<div><span>Only find sections that start after
			<input style='margin:0 0.3em 0 0.35em;' type=checkbox checked={$options.time_restrictions.hasOwnProperty('early')} on:change={(e) => {
				if (e.target.checked) $options.time_restrictions.early = {start:'0:00', end:$options.early_time}
				else delete $options.time_restrictions.early;
				options.set($options);
			}}>
			<input style='height:1.5em;' type="time" disabled={!$options.time_restrictions.hasOwnProperty('early')} bind:value={$options.early_time} on:change={() => {$options.time_restrictions.early = {start:'0:00', end:$options.early_time}; options.set($options);}}>
		</div>
		<div><span>Only find sections that end before
			<input style='margin:0 0.3em 0 0.35em;' type=checkbox checked={$options.time_restrictions.hasOwnProperty('late')} on:change={(e) => {
				if (e.target.checked) $options.time_restrictions.late = {start:$options.late_time, end:'24:00'}
				else delete $options.time_restrictions.late;
				options.set($options);
			}}>
			<input style='height:1.5em;' type="time" disabled={!$options.time_restrictions.hasOwnProperty('late')} bind:value={$options.late_time} on:change={() => {$options.time_restrictions.late = {start:$options.late_time, end:'24:00'}; options.set($options);}}>
		</div>
		<div><span style='margin-bottom:0em'>Only find sections that meet on the following days</span>
			<div>
				<input type=checkbox bind:checked={$options.day_restrictions.monday}><span>Mon</span>
				<input type=checkbox bind:checked={$options.day_restrictions.tuesday}><span>Tue</span>
				<input type=checkbox bind:checked={$options.day_restrictions.wednesday}><span>Wed</span>
				<input type=checkbox bind:checked={$options.day_restrictions.thursday}><span>Thu</span>
				<input type=checkbox bind:checked={$options.day_restrictions.friday}><span>Fri</span>
				<input type=checkbox bind:checked={$options.day_restrictions.saturday}><span>Sat</span>
				<input type=checkbox bind:checked={$options.day_restrictions.sunday}><span>Sun</span>
			</div>
		</div>
	</div>
	</MediaQuery>
</div>


<style>
	h1 {
		font-size: 2em;
		font-weight: 1;
    }

	h2 {
		font-size: 20px;
	}

	.container {
		min-height: 200px;
		height: calc(100vh - 15em);
		grid-template-rows: calc(105%);
		width:100%;
	}

	.card {
		cursor: pointer;
		position: relative;
		margin: 0.5em;
		padding: 1em 0.5em 1em 0.5em;
		border-radius: 8px;
		box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
		min-height: 2em;

		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	.light {
		background-color: var(--gray2);
		color: var(--gray6);
	}

	.dark {
		background-color: var(--gray5);
		color: var(--gray0);
	}

	.card::after {
		clear: both;
		display: block;
	}

	.card:hover.light {
		background: #6c79837a;
	}

	.card:hover.dark {
		background: #0000003d /* var(--gray4); */
	}

	* {
		text-align: center;
		transition: 0.15s;
	}

    .options span {
        display: inline-block;
        justify-content: center;
        text-align: center;
		font-size: 1.25em;
		font-weight: 1;
        margin: 0.5em 0.5em 0.5em 0.5em;
    }

    .options input[type='checkbox'] {
        transform : scale(2);
        margin: 0;
        position: relative;
        top: 0;
    }

    .options input[type='number'] {
        height:1.5em;
        width:7ch;
    }

	@media (max-width: 1024px) {
        h1 {
            font-size: 1.5em;
        }

		.card {
			padding: .5em 0;
		}

		.card h2 {
			font-size: .7em;
		}

        .options span {
			font-size: 1em;
		}

		.options input[type='checkbox'] {
			transform : scale(1.5);
		}

		div.container.options {
			max-width: 90%;
		}
    }

	@media (max-width: 600px) {
        h1 {
            font-size: 1em;
        }

		.card {
			padding: .5em 0;
		}

		.card h2 {
			font-size: .6em;
		}

        .options span {
			font-size: .8em;
		}

		.options input[type='checkbox'] {
			transform : scale(1);
		}

		div.container.options {
			max-width: 90%;
		}
    }
</style>