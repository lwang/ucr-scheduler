import { writable } from "svelte/store";

export const theme = localStorage.getItem('theme') ? writable(JSON.parse(localStorage.getItem('theme'))) : writable('dark');
theme.subscribe(value => {
    localStorage.setItem("theme", JSON.stringify(value));
});

export const active = localStorage.getItem('active') ? writable(JSON.parse(localStorage.getItem('active'))) : writable('Home');
active.subscribe(value => {
    localStorage.setItem("active", JSON.stringify(value));
});

export const term = localStorage.getItem('term') ? writable(JSON.parse(localStorage.getItem('term'))) : writable('');
term.subscribe(value => {
    localStorage.setItem("term", JSON.stringify(value));
});

export const courses = localStorage.getItem('courses') ? writable(JSON.parse(localStorage.getItem('courses'))) : writable([]);
courses.subscribe(value => {
    localStorage.setItem("courses", JSON.stringify(value));
});

export const options = localStorage.getItem('options') ? writable(JSON.parse(localStorage.getItem('options'))) : writable({
    randomize : false,
    max_schedules : 500,
    min_seats : 1,
    day_restrictions : {
        monday : true,
        tuesday : true,
        wednesday : true,
        thursday : true,
        friday : true,
        saturday : true,
        sunday : true
    },
    enable_early_time : false
});
options.subscribe(value => {
    localStorage.setItem("options", JSON.stringify(value));
});

export const crns = sessionStorage.getItem('crns') ? writable(JSON.parse(sessionStorage.getItem('crns'))) : writable([]);
crns.subscribe(value => {
    sessionStorage.setItem("crns", JSON.stringify(value));
});

export const schedules = sessionStorage.getItem('schedules') ? writable(JSON.parse(sessionStorage.getItem('schedules'))) : writable([]);
schedules.subscribe(value => {
    sessionStorage.setItem("schedules", JSON.stringify(value));
});

export const pinned = sessionStorage.getItem('pinned') ? writable(JSON.parse(sessionStorage.getItem('pinned'))) : writable([]);
pinned.subscribe(value => {
    sessionStorage.setItem("pinned", JSON.stringify(value));
});