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
            termUpdate();
            countdownTimeFunc = setInterval(function() {countdownTime()}, 1000)
        });
    ;

    $: term_select, termUpdate()

    function termUpdate()
    {
        if (!$term || !Object.keys($term).length) // no term saved in local storage
        {
            courses.set([]);
            term.set(terms[0]);
        }
        else if (Object.keys(term_select).length && JSON.stringify(term_select) !== JSON.stringify($term)) // on dropdown change
        {
            courses.set([]);
            term.set(term_select);
        }
        term_select = $term;
        nextTermtDate = new Date($term['next_term_data_date']).getTime();
        undergradLimitDate = new Date($term['undergrad_limit_date']).getTime();
        nextTerm = $term['next_term'];
        countdownTime();
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


<div><span>Current scheduling term:</span>
{#if terms.length}
    <select class='{$theme}' bind:value={term_select}>
        {#each terms as term}
            <option value={term} selected={JSON.stringify(term_select) === JSON.stringify(term) ? 'selected' : ''}>
                {term['description']}
            </option>
        {/each}
    </select>
{/if}
</div>
<div><span>Undergraduate 17 unit maximum load lifted in:&nbsp;</span><span class='{$theme}'>{undergradLimitTime}</span></div>
<div><span>Next term (</span><span class='{$theme}'>{nextTerm}</span><span>) data will be available in:&nbsp;</span><span class='{$theme}'>{nextTermTime}</span></div>
<hr style="border-top: 1px solid #bbb; width: 50%; margin-top:1em;">
<p>Welcome to the University of California, Riverside schedule generator. 
    This tool allows you to easily create several potential class schedules by choosing the courses you want to take without having to deal with time conflicts or linked sections yourself.
    Schedules containing sections with no specified meeting time such as asynchronous lecture sections cannot be generated, please add those courses to your term plan manually.
    Corequisite courses will be added automatically however restrictions and prerequisites are not considered.
</p>
<footer style='position:absolute; width:100%; bottom:1em'>
<span on:click={() => {theme.set($theme == 'dark' ? 'light' : 'dark');}} class='toggle'>Toggle {$theme} mode</span>
</footer>

<style>
    div {
        max-width: 90%;
        margin: 0.5em auto;
    }

    span {
        justify-content: center;
        text-align: center;
		font-size: 1.5em;
		font-weight: 1;
        margin-top: 0;
    }

    .toggle {
        cursor: pointer;
    }

    .light {
		color: rgb(185, 0, 185); 
	}

	.dark {
		color: rgb(164, 149, 231); 
	}

    p {
        margin-top: 0.3em;
        display: inline-block;
        justify-content: center;
        text-align: center;
        max-width:60%;
		font-weight: 1;
		font-size: 1.5em;
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
        margin-bottom: 0;
        outline: none;
        width: 100%;
        min-width: 10ch;
        max-width: 14ch;
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

    @media (max-width: 1024px) {
        p {
            max-width:80%;
            font-size: 1.25em;
            line-height: 1.35em;
        }
    }

    @media (max-width: 600px) {
        p {
            max-width:90%;
            font-size: 1.25em;
            line-height: 1.2em;
        }

        span {
            font-size: 1.25em;
        }

        select {
            font-size: 1.25em;
        }
    }

    @media (max-width: 500px) {
        p {
            max-width:90%;
            font-size: 1em;
            line-height: 1.2em;
        }

        span {
            font-size: 1.25em;
        }

        select {
            font-size: 1.25em;
        }
    }
</style>