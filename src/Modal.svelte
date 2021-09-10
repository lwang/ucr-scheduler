<script>
    import { theme } from './store.js';
    import { fade } from 'svelte/transition';
    export let showModal;
</script>

{#if showModal}
    <div class="backdrop" on:click|self={() => showModal=!showModal} transition:fade="{{duration: 100}}">
        <div class="modal {$theme}">
            <!-- <div style="padding: 1em;"> -->
            <slot></slot>
            <!-- </div> -->
        </div>
    </div>
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
        /* border-radius: 10px; */
        /* border-radius: 5%; */
        /* box-shadow: 0 10px 50px 0 rgb(0 0 0 / 50%); */
        padding: 10px;
        max-width: 80%;
        min-height: 25%;
        margin:5% auto;
        /* text-align: center; */
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: auto;
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