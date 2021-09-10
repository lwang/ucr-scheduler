<script>
    import { theme, active } from './store.js';
    import { fade } from 'svelte/transition';
    const toggleTheme = () => {theme.set($theme == 'dark' ? 'light' : 'dark');}

    let tabs = ['Home', 'Select Courses', 'Choose Schedule'];
    let showHeader = true;
	
	const toggleTab = (direction) => {
		if (direction == 'prev' && tabs.indexOf($active) > 0)
			active.set(tabs[tabs.indexOf($active) - 1]);
		else if (direction == 'next' && tabs.indexOf($active) + 1 < tabs.length)
            active.set(tabs[tabs.indexOf($active) + 1]);
	}
</script>

<!-- <div class="triangle" title="Toggle header" on:click={()=>showHeader=!showHeader}></div> -->
{#if showHeader}
    <header class={$theme}>
        <button on:click={toggleTheme} class='toggle'>{$theme}<br>mode</button>

        {#if tabs.indexOf($active) != 0}
            <button class='left' on:click={() => toggleTab('prev')}>prev</button>
        {/if}
        <h1>{$active}</h1>
        {#if tabs.indexOf($active) + 1 != tabs.length}
            <button class='right' on:click={() => toggleTab('next')}>next</button> <br>
        {/if}
    </header>
{:else}
    <div style='height:5%'></div>
{/if}

<style>
    * {
        -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none; /* Safari */
        -khtml-user-select: none; /* Konqueror HTML */
        -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
        user-select: none; /* Non-prefixed version, currently
    }
    header {
        z-index: 90;
        height: 95px;
        margin-bottom: 2em;
        /* border-bottom: 1px solid var(--gray3); */
    }

    h1 {
		/* display: inline; */
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
        margin-top: 0;
        top: 100px;
        margin-bottom: 10px;
    }

    .light h1 {
		color: rgb(185, 0, 185);
	}

	.dark h1 {
		color: rgb(139, 160, 255);
    }
    
    button {
        opacity: 0.7;
        transition: opacity 0.5s, visibility 0.5s;
		border-radius: 50%;
		background-color: #000;
		color: white;
        position: absolute;
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        cursor: pointer;
        top: 1em;
        bottom: auto;
        z-index: 100;
        width: 4em;
        height: 4em;
        border: none;
    }
    
    .toggle {
        right: 2em;
    }

    .left {
        left: 15%;
    }

    .right {
        right: 15%;
    }

	.triangle {
		position: fixed;
		top: 0;
		left: 0;
		z-index:99;
        cursor: pointer;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 50px 50px 0 0;
        border-color: rgb(0, 0, 0) transparent transparent transparent;
    }

</style>