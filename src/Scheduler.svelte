<script>
    import pako from "pako"
    import { onMount, onDestroy } from "svelte";
    import { term, courses, active, crns, pinned, schedules, options, theme, tutorial } from './store.js';
    import Spinner from './LoadingSpinner.svelte'
    import Modal from './Modal.svelte'
    import TermPlan from './TermPlan.svelte'
    import Pin from './Pin.svelte'

    const showTutorial = !$tutorial.schedules;
    let sse = [];
    let showModal = false;
    let itemsFull = [];
    $: idx = items ? (index => index >= 0 ? index : 0)(items.findIndex((sched) => sched[1].every((crn, index) => crn === $crns[index]))) : 0;

    $: items = itemsFull.filter(function(sched, a) {
        for (const crn of $pinned)
        {
            if (!sched[1].includes(crn))
            { 
                return false;
            }
        }
        return true;
    });

    onMount(async () => {
        start();
        
        if ($schedules.length)
        {
            itemsFull = $schedules;
            update();
        }
        else if (!$courses.length)
        {
            window.alert("You have no couses selected!");
            active.set('Select Courses');
        }
        else
        {
            // const sse = new EventSource(`http://localhost:8000/schedules?term=${$term['code']}&courses=${$courses.join(',')}&options=${JSON.stringify($options)}`)
            const sse = new EventSource(`https://jcurda-api.herokuapp.com/schedules?term=${$term['code']}&courses=${$courses.join(',')}&options=${JSON.stringify($options)}`)

            sse.addEventListener('error', (e) => {
                const response = e.data
                console.log(response);
                window.alert(response);
                active.set('Select Courses');
                sse.close();
            });

            sse.addEventListener('message', (e) => {
                const str = atob(e.data.substring(2, e.data.length - 1))
                const charData = str.split('').map(function(x){return x.charCodeAt(0); });
                const binData = new Uint8Array(charData);
                const response = JSON.parse(pako.inflate(binData, {to:'string'}))
                itemsFull = [...itemsFull, response]
            });

            sse.addEventListener('stream-end', (e) => {
                schedules.set(itemsFull.slice(0, 2500))
                update();
                sse.close();
                // console.log('Server Sent Events Stream Closed!')
            });
        }
    });

    onDestroy(() => {
        if (sse.readyState && sse.readyState === 1) {
            sse.close();
        }
    })  

    let pin_objs = [];
    
    function start() {
        // console.log('starting')
        scheduler.config.multi_day = true;
        scheduler.config.readonly = true;
        // scheduler.config.readonly_form = true;
        scheduler.config.start_on_monday = false;
        scheduler.config.first_hour = 7;
        scheduler.config.last_hour = 24;
        scheduler.config.hour_date="%h %A";
        scheduler.config.day_date="%l";
        scheduler.config.hour_size_px=42;
        
		scheduler.init('scheduler_here',new Date(2020,0,0),"week");

        scheduler.attachEvent("onClick", function (id, e){
			// show modal for course information
            return true;
        });
        
        scheduler.attachEvent("onDataRender", function(){
            var divs = document.getElementsByClassName("dhx_cal_event");
            for(let i = 0; i < pin_objs.length; i++)
            {
                pin_objs[i].$destroy()
            }
            pin_objs = []
            for(var i = 0; i < divs.length; i++){
                let element = divs[i];
                for (const e of element.getElementsByClassName("dhx_event_resize"))
                {
                    e.remove()
                }
                const pin = new Pin({
                    target: element,
                    props: {
                        id: parseInt(element.getAttribute("event_id")).toString()
                    }
                })
                pin_objs.push(pin)
            }
        });
    }

    const typeIDX = (e) => {
        let num = e.target.value - 1
        if (!(num >= 0 && num <= items.length))
            return
        // console.log(num)
        idx = num
        update()
    }

    const next = () => {
        // console.log(idx);
        if (idx + 1 >= items.length)
            return;
        idx++;
        update();
    }

    const prev = () => {
        // console.log(idx);
        if (idx <= 0)
            return;
        idx--;
        update();
    }

    function update() {
        if (itemsFull.length === 0) { return }
        let temp = items.length == 0 ? itemsFull : items;
        scheduler.clearAll();
        try {
            scheduler.parse(temp[idx][0]);
            crns.set(temp[idx][1]);
        } catch (error) {
            console.log(error)
        }
    }

    let innerWidth = 0;
</script>

<svelte:window bind:innerWidth/>

{#if showTutorial}
	<Modal showModal=true width="{innerWidth>1024?35:60}%" height="60%">
		<h1 style='margin: 0;'>Select Courses</h1>
		<ul style='max-width:80%'>
			<li style='text-align:left'>Browse through the generated schedules until you find one that is right for you</li>
			<li style='text-align:left'>Pin a section to only show schedules containing that section</li>
			<!-- <li style='text-align:left'>Click on a section to show additional information</li> -->
			<li style='text-align:left'>Save your schedule by downloading the iCal file to import into Google Calendar, then use the list of CRNs to create a term plan on RWEB</li>
		</ul>
		<div><input id='show_again' type=checkbox bind:checked={$tutorial.schedules}><label for='show_again' style='display:inline;'>Never show again</label></div>
	</Modal>
{/if}
{#if itemsFull.length === 0}
    <Spinner />
    <h1>Loading Schedules...</h1>
{/if}
<div id="scheduler_here" class="dhx_cal_container {$theme}" style='width:100%; height:90%; visibility:{itemsFull.length>0?'visible':'hidden'};'>
    <Modal bind:showModal width="{innerWidth>1024?35:60}%" height="55%">
        <TermPlan/>
    </Modal>
    <div class='overlay'>
        <span class='schedule_num {$theme}'>Showing schedule <input class="inpnum" type="number" value={idx+1} on:input={e=>typeIDX(e)} min=1 max={items.length}> of {items.length}</span>
        <span class='save button {$theme}' on:click={() => showModal=!showModal}>Save Schedule</span>
        <span class='prev button {$theme}' on:click={prev}>Previous Schedule</span>
        <span class='next button {$theme}' on:click={next}>Next Schedule</span>
    </div>
    <div class='font'>
    <div class="dhx_cal_navline"></div>
    <div class="dhx_cal_header"></div>
    <div class="dhx_cal_data"></div>
    </div>
</div>


<style>
    h1 {
		font-size: 2em;
		font-weight: 100;
        margin-top: 0;
        top: 100px;
        margin-bottom: 10px;
    }

   .inpnum {
        width: 25%;
        margin: 0;
        padding: 0.5%;
   }

   .dhx_cal_navline {
        visibility: hidden;
        margin: 0px;
        padding: 0px;
        height: 0px;
   }

   .overlay {
        max-width: 90%;
        margin: auto;
        display: flex;
        align-items:center;
        justify-content: space-between;
        flex-wrap: wrap;
        height: 5em;
        z-index: 99;
   }

   .overlay * {
        -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none; /* Safari */
        -khtml-user-select: none; /* Konqueror HTML */
        -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
        user-select: none; /* Non-prefixed version, currently*/
   }

   .overlay span {
        cursor: pointer;
        display: table-cell;
        text-align: center;
        color: black;
		font-size: 1.5em;
    }

    .schedule_num {
        width: 40%;
    }

    .font {
        font-size: .8em;
    }

    span {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        font-weight: 600;
    }

    span.button {
        border: 1px solid black;
        background: rgb(213 106 124);
        display: inline-block;
        padding: .5em .5em;
        border: 0;
        border-radius: .4em;
    }

    @media (max-width: 800px) {
        span.save {
            max-width: 15%;
        }

        span.prev {
            max-width: 20%;
        }

        span.next {
            max-width: 15%;
        }

        .overlay span {
            font-size: 1.2em;
        }
    }

    @media (max-width: 700px) {
        span.button {
            padding: .4em 0;
        }
    }

    @media (max-width: 600px) {
        .overlay span {
            font-size: 1em;
        }

        .schedule_num {
            width: 30%;
        }
    }

    @media (max-width: 500px) {
        .font {
            font-size: .6em;
        }

        :global(.dhx_cal_event .dhx_title) {
            font-size: 1em !important;
        }

        span.button {
            padding: .4em .4em;
        }
    }
    
    div.light {
		background-color: var(--gray2);
		color: var(--gray6);
	}

	div.dark {
		background-color: var(--gray4);
		color: var(--gray0);
	}

    span.light {
		color: var(--gray6);
	}

	span.dark {
		color: var(--gray0);
	}
</style>