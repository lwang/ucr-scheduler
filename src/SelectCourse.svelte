<script>
	import { fade } from 'svelte/transition';
    import { theme, term, courses, options, schedules, pinned, tutorial } from './store.js';
	import VirtualList from './VirtualList.svelte';
	import ListItem from './ListItem.svelte';
	import Modal from './Modal.svelte'
    $: $options, schedules.set([]), pinned.set([])

	const showTutorial = !$tutorial.courses;
    export let items = [];
	fetch(`json/ratings.json`)
		.then((data) => data.json())
		.then((ratings) => 
		{
			fetch(`json/${$term['code']}.json`)
				.then((data) => data.json())
				.then((jsonData) => 
				{
					jsonData.forEach((element) => 
					{
						let temp = {}
						temp.name = element.code;
						temp.content = element.description;
						if (ratings.hasOwnProperty(element.code))
						{
							temp.difficulty = ratings[element.code].average;
							temp.comments = ratings[element.code].comments.reverse();
						}
						else
						{
							temp.difficulty = '---';
							temp.comments = [];
						}
						items = [...items, temp];
					});
				});
			;
		});
	;

	let searchTerm = "";
	$: filteredList = items.filter(item => item.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);

	
	let start, end;

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
    let innerWidth = 0;
</script>

<svelte:window bind:innerWidth/>

{#if showTutorial}
	<Modal showModal=true width="{innerWidth>1024?35:60}%" height="60%">
		<h1 style='margin: 0;'>Select Courses</h1>
		<ul style='max-width:80%'>
			<li style='text-align:left'>The number to the right of each course's title is its average difficulty based on student reviews (if available)</li>
			<li style='text-align:left'>Click on the course card to add it to the selected courses list</li>
			<li style='text-align:left'>Click on the average difficulty rating to show the student reviews</li>
			<li style='text-align:left'>Click on a course in the selected courses list to remove it</li>
			<li style='text-align:left'>Data taken from the UCR course database on Reddit</li>
		</ul>
		<div><input id='show_again' type=checkbox bind:checked={$tutorial.courses}><label for='show_again' style='display:inline;'>Never show again</label></div>
	</Modal>
{/if}
<div>
	<div class='header list'>
		<h1 for="search" style='display:inline;'>Filter:&nbsp;</h1>
		<input type="text" id="search" bind:value={searchTerm} on:click={(e)=>{e.target.value='';searchTerm=''}} style='display:inline;width:50%;padding: 0.5%;' />
	</div>
	<div class='header selected'>
		<h1 style='display:inline;'>Selected ({$courses.length}):</h1>
	</div>
	<div class='header options'>
		<h1 style='display:inline;'>Scheduler Options:</h1>
	</div>
</div>
<hr style="border-top: 1px solid #bbb; width: 100%">
<div class='container list wrap'>
	<div class='container list'>
		<div style='height:100%'>
			<VirtualList items={filteredList} height={'100%'} bind:start bind:end let:item>
				<ListItem {...item}/>
			</VirtualList>
		</div>
	</div>
	<div class='container selected'>
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
			<h1 class='container clear' on:click={clear}>Clear All Courses</h1>
		</div>
	</div>
	<div class='container options'>
		<div style='display: flex;align-items: center;justify-content: center;'><input id='randomize' type=checkbox bind:checked={$options.randomize}><label class='randomize' for='randomize'>Randomize generated schedule order</label></div>
		<div><label class='max_schedule' for='max_schedule'>Generate a maximum of <input id='max_schedule' type="number" bind:value={$options.max_schedules} min=0 max=9999> schedule(s)</label></div>
		<div><label class='min_seats' for='min_seats'>Only find sections with a minimum of <input id='min_seats' type="number" bind:value={$options.min_seats} min=0> seat(s)</label></div>
		<div><label class='start_after' for='start_after'>Only find sections that start after
			<input id='start_after' type=checkbox checked={$options.time_restrictions.hasOwnProperty('early')} on:change={(e) => {
				if (e.target.checked) $options.time_restrictions.early = {start:'0:00', end:$options.early_time}
				else delete $options.time_restrictions.early;
				options.set($options);
			}}>
			<input style='height:1.5em;' type="time" disabled={!$options.time_restrictions.hasOwnProperty('early')} bind:value={$options.early_time} on:change={() => {$options.time_restrictions.early = {start:'0:00', end:$options.early_time}; options.set($options);}}>
		</div>
		<div><label class='end_before' for='end_before'>Only find sections that end before
			<input id='end_before' type=checkbox checked={$options.time_restrictions.hasOwnProperty('late')} on:change={(e) => {
				if (e.target.checked) $options.time_restrictions.late = {start:$options.late_time, end:'24:00'}
				else delete $options.time_restrictions.late;
				options.set($options);
			}}>
			<input style='height:1.5em;' type="time" disabled={!$options.time_restrictions.hasOwnProperty('late')} bind:value={$options.late_time} on:change={() => {$options.time_restrictions.late = {start:$options.late_time, end:'24:00'}; options.set($options);}}>
		</div>
		<div class='days'><span style='margin-bottom:0em'>Only find sections that meet on the following days:</span>
			<div>
				<input id='monday' type=checkbox bind:checked={$options.day_restrictions.monday}><label for='monday'>Mon</label>
				<input id='tuesday' type=checkbox bind:checked={$options.day_restrictions.tuesday}><label for='tuesday'>Tue</label>
				<input id='wednesday' type=checkbox bind:checked={$options.day_restrictions.wednesday}><label for='wednesday'>Wed</label>
				<input id='thursday' type=checkbox bind:checked={$options.day_restrictions.thursday}><label for='thursday'>Thu</label>
				<input id='friday' type=checkbox bind:checked={$options.day_restrictions.friday}><label for='friday'>Fri</label>
				<input id='saturday' type=checkbox bind:checked={$options.day_restrictions.saturday}><label for='saturday'>Sat</label>
				<input id='sunday' type=checkbox bind:checked={$options.day_restrictions.sunday}><label for='sunday'>Sun</label>
			</div>
		</div>
	</div>
</div>


<style>
	h1 {
		font-size: 2em;
		font-weight: 1;
    }

	h2 {
		font-size: 20px;
	}

	.card {
		cursor: pointer;
		position: relative;
		margin: 0.5em;
		padding: 0.3em 0.5em 0.3em 0.5em;
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

	.card.light {
		box-shadow:inset 0px 0px 0px 2px var(--gray5);
	}

	.card.dark {
		box-shadow:inset 0px 0px 0px 2px var(--gray2);
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

	.options label {
        display: inline-block;
        justify-content: center;
        text-align: center;
		font-size: 1.25em;
		font-weight: 1;
        margin: 0.5em 0.5em 0.5em 0.5em;
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
        position: relative;
        top: 0;
		margin:0 0.3em 0 0.3em;
    }

    .options input[type='number'] {
        height:1.5em;
        width:7ch;
    }

	.header.list {
		width: 30%;
		float: left;
	}
	.header.selected {
		width: 30%;
		float: left;
	}
	.header.options {
		width: 40%;
		float: right;
	}

	/* .container {
		min-height: 200px;
		height: calc(100vh - 15em);
		grid-template-rows: calc(105%);
		width:100%;
	} */
	
	.container.list.wrap {
		width: 100%;
		height:80vh
	}
	.container.list {
		width: 30%; 
		float: left;
		height: 100%
	}
	.container.selected {
		width: 30%;
		float: left;
		height: 100%
	}
	.container.clear {
		width: 29%;
		/* width: 31%; */
		position: absolute; 
		bottom: 10px; 
		margin: 0 auto; 
		cursor: pointer;

		font-weight: bold;
		border: 1px solid black;
        background: rgb(213 106 124);
        padding: .3em .2em;
        border: 0;
        border-radius: .4em;
	}
	.container.options {
		width: 40%;
		float: right;
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 1024px) {
		.container.list.wrap {
			height:80vh
		}

        h1 {
            font-size: 1.5em;
        }

		.card {
			padding: .5em 0;
		}

		.card h2 {
			font-size: .7em;
		}

		.options label {
			font-size: 1em;
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

		.days div {
			max-width:70%;
			margin: auto;
		}
    }

	@media (max-width: 768px) {
		label.randomize {
			max-width:50%;
		}
		label.max_schedule {
			max-width:60%;
		}
		label.min_seats {
			max-width:65%;
		}
		label.start_after {
			max-width:60%;
		}
		label.end_before {
			max-width:65%;
		}
		div.days {
			max-width:80%;
			margin: auto;
		}
		.days div {
			max-width:100%;
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

		.options label {
			font-size: .75em;
			margin: 0.25em 0.25em;
		}

        .options span {
			font-size: .75em;
			margin: 0.25em 0.25em;
		}

		.options input[type='checkbox'] {
			transform : scale(1);
		}

		div.container.options {
			max-width: 90%;
		}

		label.start_after {
			max-width:65%;
		}
		div.days {
			max-width:75%;
			margin: auto;
		}
    }

	@media (max-width: 450px) {
		.container.list.wrap {
			height:80vh
		}

		label.randomize {
			max-width:70%;
		}
		label.max_schedule {
			max-width:80%;
		}
		label.end_before {
			max-width:75%;
		}

		h2 {
			font-size: 16px;
		}
    }

	@media (max-width: 400px) {
		.header.selected {
			width:30%;
		}
		.header.options {
			width:40%;
		}

		label.randomize {
			max-width:75%;
		}

		.options input[type='checkbox'] {
			transform: translateY(2px);
    		margin: 0px 0em 0.5em 0em;
		}
    }
</style>