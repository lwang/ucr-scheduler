<script>
	import { theme } from './store.js';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let name;
	export let content;
	export let sendDispatch = null;
	export let fontScale = 1;
	let active = false;

	function handleDispatch(e) {
		active = !active;
		dispatch('message',{text: e.sendDispatch, enabled: active});
	}
</script>

<div class='card {$theme}' class:active="{active}" on:click="{() => {handleDispatch({sendDispatch});}}">
	<h2 style='font-size: {fontScale*16}px;'>{name}</h2>
	<p style='font-size: {fontScale*14}px;'>{content}</p>
</div>

<style>
	.card {
		cursor: pointer;
		position: relative;
		margin: 0.5em;
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

	/* .active {
		background: #ff9b7a;/*
		/* color: #fff; */
	/*} */

	h2 {
		margin: 0;
	}

	p {
		margin: 0.7em 0;
	}
</style>