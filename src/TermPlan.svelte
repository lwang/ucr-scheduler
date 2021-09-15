<script>
    import { term, crns, courses } from './store.js';

    // let plan_name = '';
	// let username = '';
	// let password = '';
	// let preferred = true;

	// function submit_term_plan()
    // {
		// if (!username || !password)
        // {
            // window.alert('Missing username or password!');
			// return;
        // }
        // window.alert('Term plan submitted')
        // fetch('http://localhost:8000/term_plan', {
			// method: 'post',
			// body: JSON.stringify
            // ({
				// "plan_name": plan_name,
				// "username": username,
    			// "password": password,
				// "term": $term['code'],
				// "crns": $crns,
				// "preferred": preferred
			// })
		// })
        // .then((response) => 
            // {
                // if (!response.ok) 
                // {
                    // response.text()
                        // .then(text => {window.alert(text); active.set('Select Courses');})
                // }
                // else 
                // {
                    // response.text()
                        // .then(text => {window.alert(text);})
                // }
            // })
		// ;
	// }

    function cal()
    {
        window.location=`https://jcurda-api.herokuapp.com/ical?term=${$term['code']}&crns=${$crns}&courses=${$courses}`
        // window.location=`http://localhost:8000/ical?term=${$term['code']}&crns=${$crns}&courses=${$courses}`
    }
</script>

<div style="position: relative; max-height: calc(100vh - 5%); overflow: auto;">
    <h1>Export to Google Calendar</h1>
    <span>Learn how to import iCal files into Google Calender </span> <a href='https://support.google.com/calendar/answer/37118#import_to_gcal' target="_blank" rel="noopener noreferrer">here</a> <br> <br>
    <button on:click={() => cal()}>Download</button>
    <hr style='width:75%'>
    <!-- <h1>Upload term plan to RWeb</h1>
    <input type="text" placeholder="Term plan name" bind:value={plan_name} style="width: 50%"/> <br>
    <input type="text" placeholder="RWeb username" bind:value={username} style="width: 50%"/> <br>
    <input type="password" placeholder="RWeb password" bind:value={password} style="width: 50%"/> <br>
    <label style="padding:0 0 15px 0;"><input type="checkbox" bind:checked={preferred}/> Set current schedule as preferred term plan</label> 
    <button on:click={() => submit_term_plan()}>Submit</button>
    <hr> -->
    <h1>section crns</h1>
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