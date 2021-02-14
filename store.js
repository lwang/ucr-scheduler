import { writable } from "svelte/store";

export const theme = localStorage.getItem('theme') ? writable(JSON.parse(localStorage.getItem('theme'))) : writable('dark');
theme.subscribe(value => {
    localStorage.setItem("theme", JSON.stringify(value));
});

export const active = localStorage.getItem('active') ? writable(JSON.parse(localStorage.getItem('active'))) : writable('Select Term');
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

export const crns = sessionStorage.getItem('crns') ? writable(JSON.parse(sessionStorage.getItem('crns'))) : writable([]);
crns.subscribe(value => {
    sessionStorage.setItem("crns", JSON.stringify(value));
});