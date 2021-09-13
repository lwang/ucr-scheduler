<script>
    import pako from "pako"
    import { onMount, onDestroy } from "svelte";
    import { term, courses, active, crns, pinned, schedules, options } from './store.js';
    import Spinner from './LoadingSpinner.svelte'
    import Modal from './Modal.svelte'
    import TermPlan from './TermPlan.svelte'
    import Pin from './Pin.svelte'
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
                console.log('Server Sent Events Stream Closed!')
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
        console.log('starting')
        scheduler.config.multi_day = true;
        scheduler.config.readonly = true;
        // scheduler.config.readonly_form = true;
        scheduler.config.start_on_monday = false;
        scheduler.config.first_hour = 7;
        scheduler.config.last_hour = 24;
        scheduler.config.hour_date="%h %A";
        scheduler.config.day_date="%l";
        // scheduler.config.hour_size_px=30;
        
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
</script>

{#if itemsFull.length === 0}
    <Spinner />
    <h1>Loading Schedules...</h1>
{/if}
<div id="scheduler_here" class="dhx_cal_container" style='width:100%; height:100%; visibility:{itemsFull.length>0?'visible':'hidden'};'>
    <Modal bind:showModal>
        <TermPlan/>
    </Modal>
    <div class='overlay'>
        <span class='invisible'>aa</span>
        <span>Showing schedule <input class="inpnum" type="number" value={idx+1} on:input={e=>typeIDX(e)} min=1 max={items.length}> of {items.length}</span>
        <span on:click={() => showModal=!showModal}>Save<br>Schedule</span>
        <span on:click={prev}>Previous<br>Schedule</span>
        <span on:click={next}>Next<br>Schedule</span>
        <span class='invisible'></span>
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
   }

   .dhx_cal_navline {
        visibility: hidden;
        margin: 0px;
        padding: 0px;
        height: 0px;
   }

   .overlay {
        display: flex;
        align-items:center;
        justify-content: space-between;
        flex-wrap: wrap;
        height: 5em;
        z-index: 99;
   }

   .overlay span {
        cursor: pointer;
        display: table-cell;
        text-align: center;
        color: black;
		font-size: 1.5em;
    }

    .overlay span.invisible {
        background: transparent;
        color: transparent;
    }

    @media (max-width: 570px) {
        .overlay span {
            font-size: 1em;
        }

        .font {
            font-size:.7em;
        }

        :global(.dhx_cal_event .dhx_title) {
            font-size: 1em !important;
        }
    }
</style>