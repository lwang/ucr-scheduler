<script>
export let id = '';
let selected = false;
export let custom = false;

function toggle() {
    selected = !selected;
    if (selected)
    {
        
    }
    // console.log(id)
}

</script>

<div class="favButton gifFavoriteButton showPulse {custom?'custom':'default'} {selected?'selected':''}" tabindex="-1" on:click={toggle}>
    <svg class="icon" width="16" height="16" viewBox="0 0 24 24"> 
        <!-- <path d="M0,0H24V24H0Z" fill="none"></path> -->
        <!-- <path fill="currentColor" style="opacity:{selected?100:0}%;" d="M12.5,17.6l3.6,2.2a1,1,0,0,0,1.5-1.1l-1-4.1a1,1,0,0,1,.3-1l3.2-2.8A1,1,0,0,0,19.5,9l-4.2-.4a.87.87,0,0,1-.8-.6L12.9,4.1a1.05,1.05,0,0,0-1.9,0l-1.6,4a1,1,0,0,1-.8.6L4.4,9a1.06,1.06,0,0,0-.6,1.8L7,13.6a.91.91,0,0,1,.3,1l-1,4.1a1,1,0,0,0,1.5,1.1l3.6-2.2A1.08,1.08,0,0,1,12.5,17.6Z"></path>
        <path fill="currentColor" d="M19.6,9l-4.2-0.4c-0.4,0-0.7-0.3-0.8-0.6l-1.6-3.9c-0.3-0.8-1.5-0.8-1.8,0L9.4,8.1C9.3,8.4,9,8.6,8.6,8.7L4.4,9 c-0.9,0.1-1.2,1.2-0.6,1.8L7,13.6c0.3,0.2,0.4,0.6,0.3,1l-1,4.1c-0.2,0.9,0.7,1.5,1.5,1.1l3.6-2.2c0.3-0.2,0.7-0.2,1,0l3.6,2.2 c0.8,0.5,1.7-0.2,1.5-1.1l-1-4.1c-0.1-0.4,0-0.7,0.3-1l3.2-2.8C20.9,10.2,20.5,9.1,19.6,9z M12,15.4l-3.8,2.3l1-4.3l-3.3-2.9 l4.4-0.4l1.7-4l1.7,4l4.4,0.4l-3.3,2.9l1,4.3L12,15.4z"></path> -->
        <!-- <path fill="currentColor" d="M17.592,8.936l-6.531-6.534c-0.593-0.631-0.751-0.245-0.751,0.056l0.002,2.999L5.427,9.075H2.491c-0.839,0-0.162,0.901-0.311,0.752l3.683,3.678l-3.081,3.108c-0.17,0.171-0.17,0.449,0,0.62c0.169,0.17,0.448,0.17,0.618,0l3.098-3.093l3.675,3.685c-0.099-0.099,0.773,0.474,0.773-0.296v-2.965l3.601-4.872l2.734-0.005C17.73,9.688,18.326,9.669,17.592,8.936 M3.534,9.904h1.906l4.659,4.66v1.906L3.534,9.904z M10.522,13.717L6.287,9.48l4.325-3.124l3.088,3.124L10.522,13.717z M14.335,8.845l-3.177-3.177V3.762l5.083,5.083H14.335z"></path> -->
        <path fill="currentColor" d="M22 12L12.101 2.10101L10.686 3.51401L12.101 4.92901L7.15096 9.87801V9.88001L5.73596 8.46501L4.32196 9.88001L8.56496 14.122L2.90796 19.778L4.32196 21.192L9.97896 15.536L14.222 19.778L15.636 18.364L14.222 16.95L19.171 12H19.172L20.586 13.414L22 12Z"></path>
    </svg>
</div>

<style>
*:focus {
    outline: 0;
    outline: none;
}

.custom {
    margin: 0;
  padding: 0;
    float: left;
    left: 0px;
}

.default {
    position: absolute;
    top: 10px;
    right: 0px;
}

.favButton {
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
}

.gifFavoriteButton {
    color: black;
}

.gifFavoriteButton:hover,.gifFavoriteButton.selected {
    color: red;
}

.gifFavoriteButton.selected.showPulse .icon {
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