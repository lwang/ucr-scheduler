<script>
    import { theme, temp } from './store.js';
    import { fade } from 'svelte/transition';
    import MediaQuery from "./MediaQuery.svelte";
    export let showModal;
    export let width = '80%';
    export let height = '40%';
    export let backdrop = true;
</script>

{#if showModal}
<MediaQuery query="(max-width: 500px)" let:matches>
    <div class="backdrop" on:click|self={() => showModal=!showModal} transition:fade="{{duration: 100}}" style="visibility: {backdrop?'visible':'hidden'}">
        <div class="modal {$theme}" style='max-width:{matches?'100%':width}; height:{height}; max-height:{matches?'90%':'70%'}; margin:{matches&&parseInt(height)<50?`${parseInt(height)/2}% 0`:'5% auto'};'>
            <div class='close' on:click={() => showModal=!showModal}><svg width="36" height="36" viewBox="0 0 24 24"><path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"></path></svg></div>
            <div class='container'>
                <div class='spacer'></div>
                <slot></slot>
                <div class='spacer'></div>
            </div>
        </div>
    </div>
</MediaQuery>
{/if}

<style>
    .backdrop {
        top:0;
        z-index:999 !important;
        width: 100%;
        height: 100vh;
        position: fixed;
        background: rgba(0, 0, 0, 0.65);
    }

    .modal {
        border-radius: 1rem;
        visibility:visible;
        /* border-radius: 10px; */
        /* border-radius: 5%; */
        box-shadow: 0 10px 50px 0 rgb(0 0 0 / 50%);
        padding: 10px;
        min-height: 25%;
        /* text-align: center; */
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: auto;
        position:relative;
    }

    .container {
        position: absolute;
        display: flex;
        flex-direction: column;
        max-height: 100%;
        /* height: 50%; */
        overflow: auto;
        left: 0;
        right: 0;
        margin: auto;
    }

    .container::-webkit-scrollbar {
   		width: 0.5em;
	}
	.container::-webkit-scrollbar-track {
		background-color: transparent;
	}
	.container::-webkit-scrollbar-thumb {
		background-color: var(--gray3);
		border-radius: 8px;
	}

    .spacer {
        margin: 1em 1em;
    }

    .close {
        position:absolute;
        top:10px;
        right:10px;
        cursor: pointer;
        fill: white;
        z-index: 100;
    }

    .light {
		background-color: var(--gray1);
		color: var(--gray6);
	}

	.dark {
		background-color: var(--gray4);
		color: var(--gray0);
	}
</style>