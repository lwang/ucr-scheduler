<svelte:head>
    <!-- <script src="./codebase/dhtmlxscheduler.js" on:load={fetchSchedules}></script> -->
    <!-- <script src="./codebase/ext/dhtmlxscheduler_limit.js"></script>  -->
    <!-- <link rel="stylesheet" href="./codebase/dhtmlxscheduler_terrace.css" type="text/css"> -->
</svelte:head>

<script>
    import {term, courses, active, crns} from './store.js';
    import Spinner from './LoadingSpinner.svelte'
    import Modal from './Modal.svelte'
    import TermPlan from './TermPlan.svelte'
    import Star from './Star.svelte'
    import { crossfade } from 'svelte/transition';
    let showModal = false;
    let loaded = false;
    let items = [];
    let idx = 0;
    function fetchSchedules() {
        if (!$courses.length)
        {
            window.alert("You have no couses selected!");
            active.set('Select Courses');
        }
        else
        {
            fetch(`http://localhost:8000/schedules?term=${$term['code']}&courses=${$courses.join(',')}`)
            // fetch(`https://jcurda-api.herokuapp.com/schedules?term=${$term['code']}&courses=${$courses.join(',')}`)
                .then((response) => 
                {
                    if (!response.ok) 
                    {
                        response.text()
                            .then(text => {window.alert(text); active.set('Select Courses');})
                    }
                    else 
                    {
                        response.json()
                            .then((jsonData) => 
                            {
                                items = jsonData;
                                console.log(items);
                                start();
                            })
                    }
                })
            ;
        }
    }
    
    function start(){
        scheduler.config.multi_day = true;
        scheduler.config.readonly = true;
        // scheduler.config.readonly_form = true;
        scheduler.config.start_on_monday = false;
        scheduler.config.first_hour = 7;
        scheduler.config.last_hour = 22;
        scheduler.config.hour_date="%h %A";
        scheduler.config.day_date="%l";
        scheduler.config.drag_resize = false;
        scheduler.config.drag_move = false;
        // scheduler.config.hour_size_px=30;

        // scheduler.templates.event_class = function(start, end, event) {
        //     return "my_event";
        // };

        scheduler.renderEvent = function(container, ev, width, height, header_content, body_content) {
            var container_width = container.style.width; // e.g. "105px"

            // move section
            var html = "<div class='dhx_event_move my_event_move' style='width: " + container_width + "'></div>";
            html+= "<Star/>";
            // container for event contents
            html+= "<div class='my_event_body'>";
                html += "<span class='event_date'>";
                // two options here: show only start date for short events or start+end for long
                if ((ev.end_date - ev.start_date) / 60000 > 40) { // if event is longer than 40 minutes
                    html += scheduler.templates.event_header(ev.start_date, ev.end_date, ev);
                    html += "</span><br/>";
                } else {
                    html += scheduler.templates.event_date(ev.start_date) + "</span>";
                }
                // displaying event text
                html += "<span>" + scheduler.templates.event_text(ev.start_date, ev.end_date, ev) + "</span>";
            html += "</div>";

            // resize section
            html += "<div class='dhx_event_resize my_event_resize' style='width: " + container_width + "'></div>";

            container.innerHTML = html;
            return false; // required, true - we've created custom form; false - display default one instead
        };
        
		scheduler.init('scheduler_here',new Date(2020,0,0),"week");
        update();
        loaded = true;

        scheduler.attachEvent("onClick", function (id, e){
            //any custom logic here
            console.log('test')
            return true;
        });
        
    }

	function show_minical(){
		if (scheduler.isCalendarVisible())
            scheduler.destroyCalendar();
		else
			scheduler.renderCalendar({
				position:"dhx_minical_icon",
				date:scheduler.getState().date,
				navigation:true,
				handler:function(date,calendar){
					scheduler.setCurrentView(date);
					scheduler.destroyCalendar()
				}
			});
    }

    const typeIDX = (e) => {
        let num = e.target.value - 1
        if (!(num >= 0 && num <= items.length))
            return
        console.log(num)
        idx = num
        update()
    }

    const next = () => {
        console.log(idx);
        if (idx + 1 >= items.length)
            return;
        idx++;
        update();
    }

    const prev = () => {
        console.log(idx);
        if (idx <= 0)
            return;
        idx--;
        update();
    }

    function update() {
        scheduler.clearAll();
        // scheduler.load("./common/events.json");
        scheduler.parse(items[idx][0]);
        crns.set(items[idx][1]);

        var divs = document.getElementsByClassName("dhx_cal_event");
        for(var i = 0; i < divs.length; i++){
            let element = divs[i];
            new Star({
                target: element,
                props: {
                    id: element.getAttribute("event_id")
                }
            })
        }
    }

    fetchSchedules();
</script>

{#if !loaded}
    <Spinner />
    <h1>Loading Schedules...</h1>
{/if}
<div id="scheduler_here" class="dhx_cal_container" style='width:100%; height:{loaded?100:0}%;'>
    <Modal bind:showModal>
        <TermPlan/>
    </Modal>
    <div class='overlay'>
        <span class='invisible'>aa</span>
        <span>Showing schedule <input class="inpnum" type="number" value={idx+1} on:input={e=>typeIDX(e)} min=1 max={items.length}> of {items.length}
            <Star id={idx+1} custom={true}}/>
        </span>
        <span on:click={() => showModal=!showModal}>Save<br>Schedule</span>
        <span on:click={prev}>Previous<br>Schedule</span>
        <span on:click={next}>Next<br>Schedule</span>
        <span class='invisible'></span>
    </div>
    <div class="dhx_cal_navline"></div>
    <div class="dhx_cal_header"></div>
    <div class="dhx_cal_data"></div>
</div>


<style>
    :global(.my_event) {
        background-color: #000000;
        border: 1px solid #778899;
        overflow: hidden;
    }

    h1 {
		font-size: 2em;
		font-weight: 100;
        margin-top: 0;
        top: 100px;
        margin-bottom: 10px;
    }

    /* body{
        margin:0px;
        padding:0px;
        height:100%;
        overflow:hidden;
   }    */

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
        /* background: black; */
        height: 5em;
        z-index: 99;
        /* display: table;
        width: 100%;
        table-layout: fixed; */
   }

   .overlay span {
        cursor: pointer;
        display: table-cell;
        text-align: center;
        /* background: rgba(255, 255, 255, 0); */
        color: black;
        /* text-transform: uppercase; */
		font-size: 1.5em;
		/* font-weight: 0; */
    }

    .overlay span.invisible {
        background: transparent;
        color: transparent;
    }
</style>