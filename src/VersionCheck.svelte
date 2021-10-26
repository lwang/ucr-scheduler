<script>
    export let current;
    import { version, active, term, courses } from "./store.js";
    if (current != $version) {
        active.set('Home');
        term.set({});
        courses.set([]);
        version.set(current);
        localStorage.removeItem('options');
        location.reload();
    }
</script>