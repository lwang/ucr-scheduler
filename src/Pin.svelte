<script>
    export let id;
    import { pinned } from './store.js'
    $: selected = $pinned.includes(id);
    
    function toggle() {
        selected = !selected;
        if (selected)
        {
            pinned.set([...$pinned, id]);
        }
        else
        {
            let tempPinned = $pinned;
            tempPinned.splice(tempPinned.indexOf(id), 1);
            pinned.set(tempPinned);
        }
    }
</script>

<div class="pin showPulse {selected?'selected':''}" tabindex="-1" on:click={toggle}>
	<svg class="icon" width="16" height="16" viewBox="0 0 24 24"> 
		<path 
			fill="currentColor" 
			style="stroke: black;
			stroke-width: .5px;
			stroke-linejoin: round;"
			d="M22 12L12.101 2.10101L10.686 3.51401L12.101 4.92901L7.15096 9.87801V9.88001L5.73596 8.46501L4.32196 9.88001L8.56496 14.122L2.90796 19.778L4.32196 21.192L9.97896 15.536L14.222 19.778L15.636 18.364L14.222 16.95L19.171 12H19.172L20.586 13.414L22 12Z">
		</path>
	</svg>
</div>

<style>
*:focus {
	outline: 0;
	outline: none;
}

.pin {
	position: absolute;
	top: 10px;
	right: 0px;
	z-index: 4;
	opacity: 100;
	-webkit-box-sizing: border-box;
	box-sizing: border-box;
	-webkit-transform: translateY(-10px);
	transform: translateY(-10px);
	-webkit-transition: opacity .1s ease,-webkit-transform .2s ease;
	transition: opacity .1s ease,-webkit-transform .2s ease;
	transition: transform .2s ease,opacity .1s ease;
	transition: transform .2s ease,opacity .1s ease,-webkit-transform .2s ease;
	width: 2em;
	/* height: 3em; */
	cursor: pointer;
	color: white;
}

.pin.selected {
	color: red;
}

.pin.selected.showPulse .icon {
	-webkit-animation:bounce-3lTARC .4s linear;
	animation:bounce-3lTARC .4s linear;
}

@-webkit-keyframes bounce-3lTARC {
	25% {
		-webkit-transform: scale(.6);
		transform: scale(.6)
	}
	50% {
		-webkit-transform: scale(1.2);
		transform: scale(1.2)
	}
	to {
		-webkit-transform: scale(1);
		transform: scale(1)
	}
}

@keyframes bounce-3lTARC {
	25% {
		-webkit-transform: scale(.6);
		transform: scale(.6)
	}
	50% {
		-webkit-transform: scale(1.2);
		transform: scale(1.2)
	}
	to {
		-webkit-transform: scale(1);
		transform: scale(1)
	}
}

.icon {
	display: block;
	width: 100%;
	height: 100%;
}

</style>