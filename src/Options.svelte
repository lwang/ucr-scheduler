<script>
    import { options, schedules } from './store.js';
    $: $options, schedules.set([])
</script>

<div style='display:flex; flex-direction: column;'>
    <h1>Schedule Options</h1>
    <hr style="border-top: 1px solid #bbb; width: 40%">
    <div><input style='margin-right: 0.2em;' type=checkbox bind:checked={$options.randomize}><span>Randomize generated schedule order</span></div>
    <div><span>Generate a maximum of <input type="number" bind:value={$options.max_schedules} min=0 max=5000> schedule(s)</span></div>
    <div><span>Generate schedules with a minimum of <input type="number" bind:value={$options.min_seats} min=0> seat(s)</span></div>
    <div><span>Generate schedules with sections that start after
        <input style='margin:0.2em 0.2em;' type=checkbox bind:checked={$options.enable_early_time}>
        <input style='height:1.5em;' type="time" disabled={!$options.enable_early_time} bind:value={$options.early_time} min="00:00" max="24:00"></span>
    </div>
    <div><span>Generate schedules with sections on </span>
        <input type=checkbox bind:checked={$options.day_restrictions.monday}><span>Mon</span>
        <input type=checkbox bind:checked={$options.day_restrictions.tuesday}><span>Tue</span>
        <input type=checkbox bind:checked={$options.day_restrictions.wednesday}><span>Wed</span>
        <input type=checkbox bind:checked={$options.day_restrictions.thursday}><span>Thu</span>
        <input type=checkbox bind:checked={$options.day_restrictions.friday}><span>Fri</span>
        <input type=checkbox bind:checked={$options.day_restrictions.saturday}><span>Sat</span>
        <input type=checkbox bind:checked={$options.day_restrictions.sunday}><span>Sun</span>
    </div>
</div>

<style>
    *{
        -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none; /* Safari */
        -khtml-user-select: none; /* Konqueror HTML */
        -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
        user-select: none; /* Non-prefixed version, currently */
    }

    h1 {
		font-size: 3em;
		font-weight: 100;
        margin-top: 0;
        margin-bottom: 0.2em;
    }

    span {
        display: inline-block;
        justify-content: center;
        text-align: center;
		font-size: 1.75em;
		font-weight: 100;
        margin: 0.5em 0.5em 0.5em 0.5em;
    }

    input[type='checkbox'] {
        transform : scale(2);
        margin: 0;
        position: relative;
        top: -5px;
    }

    input[type='number'] {
        height:1.5em;
        width:7ch;
        /* background-color: transparent; */
    }
</style>