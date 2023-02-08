<script>
    import { backend_host } from "./store.js";
    import { term, crns, courses } from './store.js';

    const url = `${backend_host}/ical?term=${$term['code']}&crns=${$crns}&courses=${$courses}`

    function downloadCal() {
        // window.location.assign(url);
        fetch(url)
        .then(response => response.text())
        .then(filename => {
            fetch(`${backend_host}/cal/${filename}`)
            .then(response => response.blob())
            .then(blob => URL.createObjectURL(blob))
            .then(uril => {
                var link = document.createElement("a");
                link.href = uril;
                link.download = "schedule.ics";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        });
    }

    function googleCal() {
        fetch(url)
		.then(response => response.text())
        .then(filename => {
            window.open(`https://calendar.google.com/calendar/u/0/r?cid=${backend_host}/cal/${filename}`, '_blank');
        });
    }
</script>

<div style="position: relative; max-height: calc(100vh - 5%); overflow: auto;">
    <h1>Export to Calendar</h1>
    <!-- <span>Learn how to import iCal files into Google Calendar </span> <a href='https://support.google.com/calendar/answer/37118#import_to_gcal' target="_blank" rel="noopener noreferrer">here</a> <br> <br> -->
    <button on:click={() => googleCal()}>Google Calendar</button>
    <button on:click={() => downloadCal()}>Download ICS File</button>
    <hr style='width:75%'>
    <!-- <h1>Upload term plan to RWeb</h1>
    <input type="text" placeholder="Term plan name" bind:value={plan_name} style="width: 50%"/> <br>
    <input type="text" placeholder="RWeb username" bind:value={username} style="width: 50%"/> <br>
    <input type="password" placeholder="RWeb password" bind:value={password} style="width: 50%"/> <br>
    <label style="padding:0 0 15px 0;"><input type="checkbox" bind:checked={preferred}/> Set current schedule as preferred term plan</label> 
    <button on:click={() => submit_term_plan()}>Submit</button>
    <hr> -->
    <h1>Section Crns</h1>
    <textarea style='height:{$crns.length*2}em; overflow:hidden;'>{[...new Set($crns)].join('\n')}</textarea>
</div>

<style>
    h1 {
		text-transform: uppercase;
		font-size: 1.8em;
		font-weight: 100;
        margin-top: 1em;
        /* top: 100px; */
        margin-bottom: 10px;
    }

    button {
        text-transform: uppercase;
		font-size: 1.5em;
		font-weight: 100;
        margin-top: 0;
        top: 100px;
        margin-bottom: 10px;
        width: 50%;
        /* height: 10%; */
        font-size: 20px;
    }

    textarea {
        font-size: 1.25em;
        width: 50%; 
    }

    a:visited {
       color: mediumpurple;
    }
</style>