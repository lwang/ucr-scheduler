import { writable } from "svelte/store";

export const temp = writable({});

export const version = localStorage.getItem('version') ? writable(localStorage.getItem('version')) : writable(0.0);
version.subscribe(value => {
    localStorage.setItem("version", value);
});

export const theme = localStorage.getItem('theme') ? writable(localStorage.getItem('theme')) : writable('dark');
theme.subscribe(value => {
    localStorage.setItem("theme", value);
});

export const active = localStorage.getItem('active') ? writable(localStorage.getItem('active')) : writable('Home');
active.subscribe(value => {
    localStorage.setItem("active", value);
});

export const term = localStorage.getItem('term') ? writable(JSON.parse(localStorage.getItem('term'))) : writable({});
term.subscribe(value => {
    localStorage.setItem("term", JSON.stringify(value));
});

export const courses = localStorage.getItem('courses') ? writable(JSON.parse(localStorage.getItem('courses'))) : writable([]);
courses.subscribe(value => {
    localStorage.setItem("courses", JSON.stringify(value));
});

export const options = localStorage.getItem('options') ? writable(JSON.parse(localStorage.getItem('options'))) : writable({
    randomize : false,
    allow_empty : false,
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
    early_time : '07:00',
    late_time : '20:00',
    time_restrictions : {}
});
options.subscribe(value => {
    localStorage.setItem("options", JSON.stringify(value));
});

export const tutorial = localStorage.getItem('tutorial') ? writable(JSON.parse(localStorage.getItem('tutorial'))) : writable({
    courses : false,
    schedules : false
});
tutorial.subscribe(value => {
    localStorage.setItem("tutorial", JSON.stringify(value));
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