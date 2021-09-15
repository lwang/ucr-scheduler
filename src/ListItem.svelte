<script>
	import { theme, courses, schedules, pinned } from './store.js';
	import Modal from './Modal.svelte'
	export let name;
	export let content;
	export let difficulty = '---';
	export let comments = [];
	$: active = $courses.indexOf(name) != -1

	function addCourse(e) {
		schedules.set([])
		pinned.set([])
		let tempcourses = $courses;
		// console.log(tempcourses.indexOf(e.detail.text))
		if (tempcourses.indexOf(name) == -1)
			tempcourses = [...tempcourses, name];
		// console.log(tempcourses);
		courses.set(tempcourses);
	}

	let showModal = false;
	function handleClick() {
		if (comments.length)
			showModal=!showModal
	}
</script>

<Modal bind:showModal width={'60%'} height='{comments.length*40}%'>
	<h2>{name}</h2>
	<h3>Difficulty: {difficulty}</h3>
	<h3>Difficulty Reviews ({comments.length}):</h3>
	<!-- <div style='display:flex; flex-direction:column;'> -->
		{#each comments as comment, index (comment)}
			<div class='comment'><span style='font-weight: bold;'>{comment.date} - Difficulty Rating: {comment.rating}/10</span><br>{comment.comment}</div>
		{/each}
	<!-- </div> -->
</Modal>
<div class='card {$theme}' class:active={active} on:click={(e) => addCourse(e)}>
	<!-- <div> -->
	<h2 class='font' style='display:inline-block;'>{name}</h2>
	<span class='font' on:click|stopPropagation={handleClick}>({difficulty})</span>
	<p class='font'>{content}</p>
	<!-- </div> -->
	<!-- <svg style='height:1em' viewBox="0 0 512 512" class="svg-inline--fa fa-info-circle fa-w-16"><path fill="currentColor" d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z" class=""></path></svg> -->
</div>

<style>
	h3 {
		margin: 0.2em 0;
	}

	.comment {
		margin: 1em 3em; 
		text-align:left;
	}

	.card {
		cursor: pointer;
		position: relative;
		margin: 0.3em;
		/* padding: 0.5em 0.5em 0.5em 6em; */
		padding: 1em 0.5em 0.5em 0.5em;
		border-radius: 8px;
		box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
		/* min-height: 2em; */
		/* transition: 0.25s; */
		/* background: #454e56; */

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

	.card:hover:not(.active).light {
		background: #6c79837a;
	}

	.card:hover:not(.active).dark {
		background: #0000003d /* var(--gray4); */
	}

	.active.light {
		box-shadow:inset 0px 0px 0px 2px var(--gray5);
	}

	.active.dark {
		box-shadow:inset 0px 0px 0px 2px var(--gray2);
	}

	h2 {
		margin: 0;
	}

	p {
		margin: 0.7em 0;
	}

	.font {
		font-size: 16px;
	}

	p.font {
		font-size: 14px;
	}

	@media (max-width: 1024px) {
		.font {
			font-size: 14px;
		}

		p.font {
			font-size: 12px;
		}
	}

	@media (max-width: 750px) {
		.font {
			font-size: 11px;
		}

		p.font {
			font-size: 10px;
		}

		.card {
			padding: 0.25em 0.25em;
		}
	}

	@media (max-width: 500px) {
		.font {
			font-size: 9px;
		}

		p.font {
			font-size: 8px;
		}

		.card {
			padding: 0.25em 0.25em;
		}
	}
</style>