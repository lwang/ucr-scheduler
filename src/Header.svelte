<script>
    import { theme, active } from './store.js';
    import MediaQuery from "./MediaQuery.svelte";
    import { fade } from 'svelte/transition';

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
    <header class={$theme} id='header'>
        <MediaQuery query="(min-width: 750px)" let:matches>
            {#if matches}
                <h1>UCR Scheduler</h1>
            {/if}
        <nav id="nav" style="right: {matches?'1.5em':''}">
            <ul>
                <li><span on:click={() => active.set(tabs[0])} style="color: {$active === tabs[0] ? "#e44c65" : ""}">Home</span></li>
                <li><span on:click={() => active.set(tabs[1])} style="color: {$active === tabs[1] ? "#e44c65" : ""}">Courses</span></li>
                <li><span on:click={() => active.set(tabs[2])} style="color: {$active === tabs[2] ? "#e44c65" : ""}">Schedules</span></li>
            </ul>
        </nav>
        </MediaQuery>
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
        user-select: none; /* Non-prefixed version, currently*/
    }

    h1 {
        height: inherit;
        line-height: inherit;
		text-transform: uppercase;
        display:inline-block;
		font-size: 4em;
		font-weight: 100;
        position: absolute;
        left: .5em;
        margin: 0;
    }

    .light h1 {
		color: rgb(185, 0, 185);
	}

	.dark h1 {
		color: rgb(139, 160, 255);
    }

    #header {
        height: 5em;
        cursor: default;
        line-height: 5em;
        width: 100%;
    }

    #header nav {
        top: 0;
    }

    #header nav ul {
        padding: 0;
        margin: 0;
    }

    #header nav ul li {
        display: inline-block;
        margin-left: 1.25em;
    }

    #header nav ul li span {
        /* border: 0; */
        display: inline-block;
        height: inherit;
        line-height: 1.5;
        outline: 0;
    }

    span {
        -moz-transition: border-color 0.2s ease-in-out, color 0.2s ease-in-out;
        -webkit-transition: border-color 0.2s ease-in-out, color 0.2s ease-in-out;
        -ms-transition: border-color 0.2s ease-in-out, color 0.2s ease-in-out;
        transition: border-color 0.2s ease-in-out, color 0.2s ease-in-out;
        border-bottom: solid 1px;
        font-size: 2em;
        font-weight: 1;
        cursor: pointer;
    }

    span:hover {
        color: #e44c65 !important;
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

    @media (max-width: 950px) {
        h1 {
            font-size: 3em;
        }
        span {
            font-size: 1.75em;
        }
    }

    @media (min-width: 750px) {
        #header nav {
            position: absolute;
        }
    }

    @media (max-width: 360px) {
        span {
            font-size: 1.5em;
        }
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