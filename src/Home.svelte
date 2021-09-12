<script>
    import {term, courses, theme} from './store.js';

    let undergradLimitDate, nextTermtDate, countdownTimeFunc, term_select={}, terms=[];
    let undergradLimitTime = '0:00:00:00'
    let nextTermTime = '0:00:00:00'
    let nextTerm = ''

    fetch('json/terms.json')
        .then((data) => data.json())
        .then((jsonData) => 
        {
            terms = jsonData;
            if (!$term)
            {
                term.set(terms[0]);   
            }
            termUpdate();
            countdownTimeFunc = setInterval(function() {countdownTime()}, 1000)
        });
    ;

    $: term_select, termUpdate()

    function termUpdate()
    {
        if (Object.keys(term_select).length && JSON.stringify(term_select) !== JSON.stringify($term))
        {
            courses.set([])
            term.set(term_select)
        }
        else
        {
            term_select = $term
        }
        nextTermtDate = new Date($term['next_term_data_date']).getTime();
        undergradLimitDate = new Date($term['undergrad_limit_date']).getTime();
        nextTerm = $term['next_term'];
        countdownTime()
    }

    function countdownTime()
    {
        let timeleft = undergradLimitDate - new Date().getTime();
        let days = Math.floor(timeleft / (1000 * 60 * 60 * 24)).toString();
        let hours = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString();
        let minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60)).toString();
        let seconds = Math.floor((timeleft % (1000 * 60)) / 1000).toString();
        undergradLimitTime = days < 0 ? '0 days, 00:00:00' : `${days} days, ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`

        timeleft = nextTermtDate - new Date().getTime();
        days = Math.floor(timeleft / (1000 * 60 * 60 * 24)).toString();
        hours = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString();
        minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60)).toString();
        seconds = Math.floor((timeleft % (1000 * 60)) / 1000).toString();
        nextTermTime = days < 0 ? '0 days, 00:00:00' : `${days} days, ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
    }
</script>


<h2 style='display: inline-block;'>Current scheduling term:</h2>
{#if terms.length}
    <select class='{$theme}' bind:value={term_select}>
        {#each terms as term}
            <option value={term} selected={JSON.stringify(term_select) === JSON.stringify(term) ? 'selected' : ''}>
                {term['description']}
            </option>
        {/each}
    </select>
{/if}
<h2>Undergraduate 17 unit maximum load lifted in: <span class='{$theme}' style="margin-left: 0.25em;">{undergradLimitTime}</span></h2>
<h2>Next term (<span class='{$theme}'>{nextTerm}</span>) data will be available in: <span class='{$theme}' style="margin-left: 0.25em">{nextTermTime}</span></h2>
<hr style="border-top: 1px solid #bbb; width: 50%">
<p>Welcome to the University of California, Riverside schedule generator. 
    This tool allows you to easily create several potential class schedules by choosing the courses you want to take without having to deal with time conflicts or linked sections yourself.
    Schedules containing sections with no specified meeting time such as asynchronous lecture sections cannot be generated, please add those courses to your term plan manually.
    Corequisite courses will be added automatically however restrictions and prerequisites are not considered.
</p>

<style>
    h2 {
        display: flex;
        justify-content: center;
        text-align: center;
		font-size: 1.5em;
		font-weight: 1;
        margin-top: 0;
    }

    span {
        display: inline-block; 
    }

    .light {
		color: rgb(185, 0, 185); 
	}

	.dark {
		color: rgb(164, 149, 231); 
	}

    p {
        margin-top: 0.3em;
        max-width:60%;
        display: inline-block;
        justify-content: center;
        text-align: center;
		font-size: 1.5em;
		font-weight: 100;
        line-height: 1.5em;
    }

    select {
        font-size: 1.5em;
		font-weight: 100;
        appearance: none;
        background-color: transparent;
        border: none;
        padding: 0 1em 0 0;
        margin-left: 0.25em;
        outline: none;
        width: 100%;
        min-width: 10ch;
        max-width: 13ch;
        border-radius: 0.25em;
        padding: 0.25em 0.5em;
        cursor: pointer;
        line-height: 1.1;
    }

    select.dark {
        border: 1px solid var(--gray2);
        background-color: rgba(255, 255, 255, 0.05);
    }

    select.light {
        border: 1px solid var(--gray4);
        background-color: rgba(0, 0, 0, 0.05);
    }
</style>