
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function self(fn) {
        return function (event) {
            // @ts-ignore
            if (event.target === this)
                fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const theme = localStorage.getItem('theme') ? writable(JSON.parse(localStorage.getItem('theme'))) : writable('dark');
    theme.subscribe(value => {
        localStorage.setItem("theme", JSON.stringify(value));
    });

    const active$1 = localStorage.getItem('active') ? writable(JSON.parse(localStorage.getItem('active'))) : writable('Select Term');
    active$1.subscribe(value => {
        localStorage.setItem("active", JSON.stringify(value));
    });

    const term = localStorage.getItem('term') ? writable(JSON.parse(localStorage.getItem('term'))) : writable('');
    term.subscribe(value => {
        localStorage.setItem("term", JSON.stringify(value));
    });

    const courses = localStorage.getItem('courses') ? writable(JSON.parse(localStorage.getItem('courses'))) : writable([]);
    courses.subscribe(value => {
        localStorage.setItem("courses", JSON.stringify(value));
    });

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src\Header.svelte generated by Svelte v3.32.0 */
    const file = "src\\Header.svelte";

    // (18:0) {#if showHeader}
    function create_if_block(ctx) {
    	let header;
    	let t0;
    	let button0;
    	let t2;
    	let h1;
    	let t3;
    	let t4;
    	let button1;
    	let t6;
    	let br;
    	let header_class_value;
    	let header_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$theme*/ ctx[0] == "dark") return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			if_block.c();
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "prev";
    			t2 = space();
    			h1 = element("h1");
    			t3 = text(/*$active*/ ctx[1]);
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "next";
    			t6 = space();
    			br = element("br");
    			attr_dev(button0, "class", "left svelte-1c70wmm");
    			add_location(button0, file, 25, 8, 981);
    			attr_dev(h1, "class", "svelte-1c70wmm");
    			add_location(h1, file, 26, 8, 1060);
    			attr_dev(button1, "class", "right svelte-1c70wmm");
    			add_location(button1, file, 27, 8, 1088);
    			add_location(br, file, 27, 79, 1159);
    			attr_dev(header, "class", header_class_value = "" + (null_to_empty(/*$theme*/ ctx[0]) + " svelte-1c70wmm"));
    			add_location(header, file, 18, 4, 703);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			if_block.m(header, null);
    			append_dev(header, t0);
    			append_dev(header, button0);
    			append_dev(header, t2);
    			append_dev(header, h1);
    			append_dev(h1, t3);
    			append_dev(header, t4);
    			append_dev(header, button1);
    			append_dev(header, t6);
    			append_dev(header, br);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(header, t0);
    				}
    			}

    			if (!current || dirty & /*$active*/ 2) set_data_dev(t3, /*$active*/ ctx[1]);

    			if (!current || dirty & /*$theme*/ 1 && header_class_value !== (header_class_value = "" + (null_to_empty(/*$theme*/ ctx[0]) + " svelte-1c70wmm"))) {
    				attr_dev(header, "class", header_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!header_transition) header_transition = create_bidirectional_transition(header, fade, {}, true);
    				header_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!header_transition) header_transition = create_bidirectional_transition(header, fade, {}, false);
    			header_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if_block.d();
    			if (detaching && header_transition) header_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(18:0) {#if showHeader}",
    		ctx
    	});

    	return block;
    }

    // (22:8) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t0;
    	let br;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Dark");
    			br = element("br");
    			t1 = text("Mode");
    			add_location(br, file, 22, 62, 937);
    			attr_dev(button, "class", "toggle svelte-1c70wmm");
    			add_location(button, file, 22, 12, 887);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, br);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggleTheme*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(22:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:8) {#if $theme == 'dark'}
    function create_if_block_1(ctx) {
    	let button;
    	let t0;
    	let br;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Light");
    			br = element("br");
    			t1 = text("Mode");
    			add_location(br, file, 20, 63, 839);
    			attr_dev(button, "class", "toggle svelte-1c70wmm");
    			add_location(button, file, 20, 12, 788);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, br);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggleTheme*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(20:8) {#if $theme == 'dark'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*showHeader*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showHeader*/ ctx[3]) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $theme;
    	let $active;
    	validate_store(theme, "theme");
    	component_subscribe($$self, theme, $$value => $$invalidate(0, $theme = $$value));
    	validate_store(active$1, "active");
    	component_subscribe($$self, active$1, $$value => $$invalidate(1, $active = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);

    	const toggleTheme = () => {
    		theme.set($theme == "dark" ? "light" : "dark");
    	};

    	let tabs = ["Select Term", "Select Courses", "Choose Schedule"];
    	let showHeader = true;

    	const toggleTab = direction => {
    		if (direction == "prev" && tabs.indexOf($active) > 0) active$1.set(tabs[tabs.indexOf($active) - 1]); else if (direction == "next" && tabs.indexOf($active) + 1 < tabs.length) active$1.set(tabs[tabs.indexOf($active) + 1]);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => toggleTab("prev");
    	const click_handler_1 = () => toggleTab("next");

    	$$self.$capture_state = () => ({
    		theme,
    		active: active$1,
    		fade,
    		toggleTheme,
    		tabs,
    		showHeader,
    		toggleTab,
    		$theme,
    		$active
    	});

    	$$self.$inject_state = $$props => {
    		if ("tabs" in $$props) tabs = $$props.tabs;
    		if ("showHeader" in $$props) $$invalidate(3, showHeader = $$props.showHeader);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		$theme,
    		$active,
    		toggleTheme,
    		showHeader,
    		toggleTab,
    		click_handler,
    		click_handler_1
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\SelectTerm.svelte generated by Svelte v3.32.0 */
    const file$1 = "src\\SelectTerm.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (22:0) {#each term_codes as term_, i (i)}
    function create_each_block(key_1, ctx) {
    	let h1;

    	let t_value = (/*term_*/ ctx[3]["description"].indexOf("(") != -1
    	? /*term_*/ ctx[3]["description"].substring(0, /*term_*/ ctx[3]["description"].indexOf("(") - 1)
    	: /*term_*/ ctx[3]["description"]) + "";

    	let t;
    	let h1_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			h1 = element("h1");
    			t = text(t_value);

    			attr_dev(h1, "class", h1_class_value = "" + (null_to_empty(/*$term*/ ctx[1] == /*term_*/ ctx[3]["code"]
    			? "active"
    			: "") + " svelte-w303dg"));

    			add_location(h1, file$1, 22, 4, 462);
    			this.first = h1;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					h1,
    					"click",
    					function () {
    						if (is_function(/*setTerm*/ ctx[2](/*term_*/ ctx[3]["code"]))) /*setTerm*/ ctx[2](/*term_*/ ctx[3]["code"]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*term_codes*/ 1 && t_value !== (t_value = (/*term_*/ ctx[3]["description"].indexOf("(") != -1
    			? /*term_*/ ctx[3]["description"].substring(0, /*term_*/ ctx[3]["description"].indexOf("(") - 1)
    			: /*term_*/ ctx[3]["description"]) + "")) set_data_dev(t, t_value);

    			if (dirty & /*$term, term_codes*/ 3 && h1_class_value !== (h1_class_value = "" + (null_to_empty(/*$term*/ ctx[1] == /*term_*/ ctx[3]["code"]
    			? "active"
    			: "") + " svelte-w303dg"))) {
    				attr_dev(h1, "class", h1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(22:0) {#each term_codes as term_, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value = /*term_codes*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[5];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$term, term_codes, setTerm*/ 7) {
    				each_value = /*term_codes*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block, each_1_anchor, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $term;
    	validate_store(term, "term");
    	component_subscribe($$self, term, $$value => $$invalidate(1, $term = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SelectTerm", slots, []);
    	let term_codes = [];

    	fetch("json/terms.json").then(data => data.json()).then(jsonData => {
    		$$invalidate(0, term_codes = jsonData);
    		if (!$term) term.set(term_codes[0]["code"]);
    	});

    	

    	const setTerm = code => {
    		term.set(code);
    		courses.set([]);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SelectTerm> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		term,
    		courses,
    		term_codes,
    		setTerm,
    		$term
    	});

    	$$self.$inject_state = $$props => {
    		if ("term_codes" in $$props) $$invalidate(0, term_codes = $$props.term_codes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [term_codes, $term, setTerm];
    }

    class SelectTerm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectTerm",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\VirtualList.svelte generated by Svelte v3.32.0 */
    const file$2 = "src\\VirtualList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    const get_default_slot_changes = dirty => ({ item: dirty & /*visible*/ 16 });
    const get_default_slot_context = ctx => ({ item: /*row*/ ctx[27].data });

    // (214:26) Missing template
    function fallback_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Missing template");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(214:26) Missing template",
    		ctx
    	});

    	return block;
    }

    // (212:2) {#each visible as row (row.index)}
    function create_each_block$1(key_1, ctx) {
    	let svelte_virtual_list_row;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], get_default_slot_context);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			svelte_virtual_list_row = element("svelte-virtual-list-row");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			t = space();
    			set_custom_element_data(svelte_virtual_list_row, "class", "svelte-1m47y5e");
    			add_location(svelte_virtual_list_row, file$2, 212, 3, 6318);
    			this.first = svelte_virtual_list_row;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svelte_virtual_list_row, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(svelte_virtual_list_row, null);
    			}

    			append_dev(svelte_virtual_list_row, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, visible*/ 16400) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svelte_virtual_list_row);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(212:2) {#each visible as row (row.index)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let svelte_virtual_list_viewport;
    	let svelte_virtual_list_contents;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let svelte_virtual_list_viewport_resize_listener;
    	let t;
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*visible*/ ctx[4];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*row*/ ctx[27].index;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			svelte_virtual_list_viewport = element("svelte-virtual-list-viewport");
    			svelte_virtual_list_contents = element("svelte-virtual-list-contents");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div = element("div");
    			set_style(svelte_virtual_list_contents, "padding-top", /*top*/ ctx[5] + "px");
    			set_style(svelte_virtual_list_contents, "padding-bottom", /*bottom*/ ctx[6] + "px");
    			set_custom_element_data(svelte_virtual_list_contents, "class", "svelte-1m47y5e");
    			add_location(svelte_virtual_list_contents, file$2, 207, 1, 6162);
    			set_style(svelte_virtual_list_viewport, "height", /*height*/ ctx[0]);
    			set_custom_element_data(svelte_virtual_list_viewport, "class", "svelte-1m47y5e");
    			add_render_callback(() => /*svelte_virtual_list_viewport_elementresize_handler*/ ctx[18].call(svelte_virtual_list_viewport));
    			add_location(svelte_virtual_list_viewport, file$2, 201, 0, 6016);
    			attr_dev(div, "class", "back-to-top svelte-1m47y5e");
    			add_location(div, file$2, 218, 0, 6499);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svelte_virtual_list_viewport, anchor);
    			append_dev(svelte_virtual_list_viewport, svelte_virtual_list_contents);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svelte_virtual_list_contents, null);
    			}

    			/*svelte_virtual_list_contents_binding*/ ctx[16](svelte_virtual_list_contents);
    			/*svelte_virtual_list_viewport_binding*/ ctx[17](svelte_virtual_list_viewport);
    			svelte_virtual_list_viewport_resize_listener = add_resize_listener(svelte_virtual_list_viewport, /*svelte_virtual_list_viewport_elementresize_handler*/ ctx[18].bind(svelte_virtual_list_viewport));
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(svelte_virtual_list_viewport, "scroll", /*handle_scroll*/ ctx[7], false, false, false),
    					listen_dev(div, "click", /*goTop*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$$scope, visible*/ 16400) {
    				each_value = /*visible*/ ctx[4];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, svelte_virtual_list_contents, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}

    			if (!current || dirty & /*top*/ 32) {
    				set_style(svelte_virtual_list_contents, "padding-top", /*top*/ ctx[5] + "px");
    			}

    			if (!current || dirty & /*bottom*/ 64) {
    				set_style(svelte_virtual_list_contents, "padding-bottom", /*bottom*/ ctx[6] + "px");
    			}

    			if (!current || dirty & /*height*/ 1) {
    				set_style(svelte_virtual_list_viewport, "height", /*height*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svelte_virtual_list_viewport);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*svelte_virtual_list_contents_binding*/ ctx[16](null);
    			/*svelte_virtual_list_viewport_binding*/ ctx[17](null);
    			svelte_virtual_list_viewport_resize_listener();
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VirtualList", slots, ['default']);
    	let { items } = $$props;
    	let { height = "100%" } = $$props;
    	let { itemHeight = undefined } = $$props;
    	let foo;
    	let { start = 0 } = $$props;
    	let { end = 0 } = $$props;

    	// local state
    	let height_map = [];

    	let rows;
    	let viewport;
    	let contents;
    	let viewport_height = 0;
    	let visible;
    	let mounted;
    	let top = 0;
    	let bottom = 0;
    	let average_height;
    	let itemLength;
    	let oldItemsLength = items.length;

    	async function refreshItems() {
    		let itemsLength = items.length;
    		rows = contents.getElementsByTagName("svelte-virtual-list-row");
    		$$invalidate(5, top = 0);
    		$$invalidate(6, bottom = 0);
    		height_map = [];

    		if (itemsLength == 0) {
    			$$invalidate(9, start = 0);
    			$$invalidate(10, end = 0);
    			return;
    		}

    		if (start > items.length - 1) {
    			$$invalidate(9, start = items.length - 1);
    			$$invalidate(10, end = items.length - 1);
    		}

    		refresh();
    		handle_scroll();
    	}

    	async function refresh() {
    		const { scrollTop } = viewport;

    		// if items has changed, we have to check to see if start and end are still in range
    		await tick(); // wait until the DOM is up to date

    		let content_height = top - scrollTop;
    		let i = start;

    		while (content_height < viewport_height && i < items.length) {
    			let row = rows[i - start];

    			if (!row) {
    				$$invalidate(10, end = i + 1);
    				await tick(); // render the newly visible row
    				row = rows[i - start];
    			}

    			const row_height = height_map[i] = itemHeight || row.offsetHeight;
    			content_height += row_height;
    			i += 1;
    		}

    		$$invalidate(10, end = i);
    		const remaining = items.length - end;
    		average_height = (top + content_height) / end;
    		$$invalidate(6, bottom = remaining * average_height);
    		height_map.length = items.length;
    	}

    	async function handle_scroll() {
    		const { scrollTop } = viewport;
    		const old_start = start;

    		for (let v = 0; v < rows.length; v += 1) {
    			height_map[start + v] = itemHeight || rows[v].offsetHeight;
    		}

    		let i = 0;
    		let y = 0;

    		while (i < items.length) {
    			const row_height = height_map[i] || average_height;

    			if (y + row_height > scrollTop) {
    				$$invalidate(9, start = i);
    				$$invalidate(5, top = y);
    				break;
    			}

    			y += row_height;
    			i += 1;
    		}

    		while (i < items.length) {
    			y += height_map[i] || average_height;
    			i += 1;
    			if (y > scrollTop + viewport_height) break;
    		}

    		$$invalidate(10, end = i);
    		const remaining = items.length - end;
    		average_height = y / end;
    		while (i < items.length) height_map[i++] = average_height;
    		$$invalidate(6, bottom = remaining * average_height);

    		// prevent jumping if we scrolled up into unknown territory
    		if (start < old_start) {
    			await tick();
    			let expected_height = 0;
    			let actual_height = 0;

    			for (let i = start; i < old_start; i += 1) {
    				if (rows[i - start]) {
    					expected_height += height_map[i];
    					actual_height += itemHeight || rows[i - start].offsetHeight;
    				}
    			}

    			const d = actual_height - expected_height;
    			viewport.scrollTo(0, scrollTop + d);
    		}
    	} // TODO if we overestimated the space these
    	// rows would occupy we may need to add some

    	// more. maybe we can just call handle_scroll again?
    	// trigger initial refresh
    	onMount(() => {
    		rows = contents.getElementsByTagName("svelte-virtual-list-row");
    		$$invalidate(13, mounted = true);
    	});

    	async function goTop() {
    		await tick();
    		viewport.scrollTo(0, 0);
    	}

    	const writable_props = ["items", "height", "itemHeight", "start", "end"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VirtualList> was created with unknown prop '${key}'`);
    	});

    	function svelte_virtual_list_contents_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			contents = $$value;
    			$$invalidate(3, contents);
    		});
    	}

    	function svelte_virtual_list_viewport_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			viewport = $$value;
    			$$invalidate(2, viewport);
    		});
    	}

    	function svelte_virtual_list_viewport_elementresize_handler() {
    		viewport_height = this.offsetHeight;
    		$$invalidate(1, viewport_height);
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(11, items = $$props.items);
    		if ("height" in $$props) $$invalidate(0, height = $$props.height);
    		if ("itemHeight" in $$props) $$invalidate(12, itemHeight = $$props.itemHeight);
    		if ("start" in $$props) $$invalidate(9, start = $$props.start);
    		if ("end" in $$props) $$invalidate(10, end = $$props.end);
    		if ("$$scope" in $$props) $$invalidate(14, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		tick,
    		items,
    		height,
    		itemHeight,
    		foo,
    		start,
    		end,
    		height_map,
    		rows,
    		viewport,
    		contents,
    		viewport_height,
    		visible,
    		mounted,
    		top,
    		bottom,
    		average_height,
    		itemLength,
    		oldItemsLength,
    		refreshItems,
    		refresh,
    		handle_scroll,
    		goTop
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(11, items = $$props.items);
    		if ("height" in $$props) $$invalidate(0, height = $$props.height);
    		if ("itemHeight" in $$props) $$invalidate(12, itemHeight = $$props.itemHeight);
    		if ("foo" in $$props) foo = $$props.foo;
    		if ("start" in $$props) $$invalidate(9, start = $$props.start);
    		if ("end" in $$props) $$invalidate(10, end = $$props.end);
    		if ("height_map" in $$props) height_map = $$props.height_map;
    		if ("rows" in $$props) rows = $$props.rows;
    		if ("viewport" in $$props) $$invalidate(2, viewport = $$props.viewport);
    		if ("contents" in $$props) $$invalidate(3, contents = $$props.contents);
    		if ("viewport_height" in $$props) $$invalidate(1, viewport_height = $$props.viewport_height);
    		if ("visible" in $$props) $$invalidate(4, visible = $$props.visible);
    		if ("mounted" in $$props) $$invalidate(13, mounted = $$props.mounted);
    		if ("top" in $$props) $$invalidate(5, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(6, bottom = $$props.bottom);
    		if ("average_height" in $$props) average_height = $$props.average_height;
    		if ("itemLength" in $$props) itemLength = $$props.itemLength;
    		if ("oldItemsLength" in $$props) oldItemsLength = $$props.oldItemsLength;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*items, start, end*/ 3584) {
    			 $$invalidate(4, visible = items.slice(start, end).map((data, i) => {
    				return { index: i + start, data };
    			}));
    		}

    		if ($$self.$$.dirty & /*mounted, viewport_height, itemHeight*/ 12290) {
    			// whenever `items` changes, invalidate the current heightmap
    			 if (mounted && (viewport_height || true) && (itemHeight || true)) refresh();
    		}

    		if ($$self.$$.dirty & /*mounted, items*/ 10240) {
    			 if (mounted && items) refreshItems();
    		}

    		if ($$self.$$.dirty & /*items*/ 2048) {
    			 itemLength = items.length;
    		}
    	};

    	return [
    		height,
    		viewport_height,
    		viewport,
    		contents,
    		visible,
    		top,
    		bottom,
    		handle_scroll,
    		goTop,
    		start,
    		end,
    		items,
    		itemHeight,
    		mounted,
    		$$scope,
    		slots,
    		svelte_virtual_list_contents_binding,
    		svelte_virtual_list_viewport_binding,
    		svelte_virtual_list_viewport_elementresize_handler
    	];
    }

    class VirtualList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			items: 11,
    			height: 0,
    			itemHeight: 12,
    			start: 9,
    			end: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VirtualList",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[11] === undefined && !("items" in props)) {
    			console.warn("<VirtualList> was created without expected prop 'items'");
    		}
    	}

    	get items() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get itemHeight() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemHeight(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ListItem.svelte generated by Svelte v3.32.0 */

    const { console: console_1 } = globals;
    const file$3 = "src\\ListItem.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let h2;
    	let t0;
    	let t1;
    	let p;
    	let t2;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			p = element("p");
    			t2 = text(/*content*/ ctx[1]);
    			attr_dev(h2, "class", "svelte-16dyg99");
    			add_location(h2, file$3, 20, 1, 584);
    			attr_dev(p, "class", "svelte-16dyg99");
    			add_location(p, file$3, 21, 1, 601);
    			attr_dev(div, "class", div_class_value = "card " + /*$theme*/ ctx[4] + " svelte-16dyg99");
    			toggle_class(div, "active", /*active*/ ctx[3]);
    			add_location(div, file$3, 18, 0, 404);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);
    			if (dirty & /*content*/ 2) set_data_dev(t2, /*content*/ ctx[1]);

    			if (dirty & /*$theme*/ 16 && div_class_value !== (div_class_value = "card " + /*$theme*/ ctx[4] + " svelte-16dyg99")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*$theme, active*/ 24) {
    				toggle_class(div, "active", /*active*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $theme;
    	validate_store(theme, "theme");
    	component_subscribe($$self, theme, $$value => $$invalidate(4, $theme = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ListItem", slots, []);
    	const dispatch = createEventDispatcher();
    	let { name } = $$props;
    	let { content } = $$props;
    	let { sendDispatch = null } = $$props;
    	let active = false;

    	function handleDispatch(e) {
    		console.log($theme);
    		$$invalidate(3, active = !active);
    		dispatch("message", { text: e.sendDispatch, enabled: active });
    	}

    	const writable_props = ["name", "content", "sendDispatch"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<ListItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		handleDispatch({ sendDispatch });
    	};

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("content" in $$props) $$invalidate(1, content = $$props.content);
    		if ("sendDispatch" in $$props) $$invalidate(2, sendDispatch = $$props.sendDispatch);
    	};

    	$$self.$capture_state = () => ({
    		theme,
    		createEventDispatcher,
    		dispatch,
    		name,
    		content,
    		sendDispatch,
    		active,
    		handleDispatch,
    		$theme
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("content" in $$props) $$invalidate(1, content = $$props.content);
    		if ("sendDispatch" in $$props) $$invalidate(2, sendDispatch = $$props.sendDispatch);
    		if ("active" in $$props) $$invalidate(3, active = $$props.active);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, content, sendDispatch, active, $theme, handleDispatch, click_handler];
    }

    class ListItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { name: 0, content: 1, sendDispatch: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListItem",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console_1.warn("<ListItem> was created without expected prop 'name'");
    		}

    		if (/*content*/ ctx[1] === undefined && !("content" in props)) {
    			console_1.warn("<ListItem> was created without expected prop 'content'");
    		}
    	}

    	get name() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get content() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sendDispatch() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sendDispatch(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\SelectCourse.svelte generated by Svelte v3.32.0 */

    const { console: console_1$1 } = globals;
    const file$4 = "src\\SelectCourse.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (65:3) <VirtualList items={filteredList} bind:start bind:end let:item>
    function create_default_slot(ctx) {
    	let listitem;
    	let current;
    	const listitem_spread_levels = [/*item*/ ctx[17]];
    	let listitem_props = {};

    	for (let i = 0; i < listitem_spread_levels.length; i += 1) {
    		listitem_props = assign(listitem_props, listitem_spread_levels[i]);
    	}

    	listitem = new ListItem({ props: listitem_props, $$inline: true });
    	listitem.$on("message", /*receiveDispatch*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(listitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(listitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const listitem_changes = (dirty & /*item*/ 131072)
    			? get_spread_update(listitem_spread_levels, [get_spread_object(/*item*/ ctx[17])])
    			: {};

    			listitem.$set(listitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(65:3) <VirtualList items={filteredList} bind:start bind:end let:item>",
    		ctx
    	});

    	return block;
    }

    // (73:2) {#each $courses as course}
    function create_each_block$2(ctx) {
    	let div;
    	let h2;
    	let t0_value = /*course*/ ctx[14] + "";
    	let t0;
    	let t1;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(h2, "class", "svelte-lmzvpb");
    			add_location(h2, file$4, 74, 4, 2162);
    			attr_dev(div, "class", div_class_value = "card " + /*$theme*/ ctx[5] + " svelte-lmzvpb");
    			add_location(div, file$4, 73, 3, 2129);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(
    					h2,
    					"click",
    					function () {
    						if (is_function(/*removeCourse*/ ctx[7](/*course*/ ctx[14]))) /*removeCourse*/ ctx[7](/*course*/ ctx[14]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$courses*/ 16 && t0_value !== (t0_value = /*course*/ ctx[14] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$theme*/ 32 && div_class_value !== (div_class_value = "card " + /*$theme*/ ctx[5] + " svelte-lmzvpb")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(73:2) {#each $courses as course}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let h10;
    	let t1;
    	let input;
    	let t2;
    	let div1;
    	let h11;
    	let t4;
    	let div6;
    	let div4;
    	let div3;
    	let virtuallist;
    	let updating_start;
    	let updating_end;
    	let t5;
    	let p;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let div5;
    	let br;
    	let t11;
    	let t12;
    	let h12;
    	let current;
    	let mounted;
    	let dispose;

    	function virtuallist_start_binding(value) {
    		/*virtuallist_start_binding*/ ctx[11].call(null, value);
    	}

    	function virtuallist_end_binding(value) {
    		/*virtuallist_end_binding*/ ctx[12].call(null, value);
    	}

    	let virtuallist_props = {
    		items: /*filteredList*/ ctx[3],
    		$$slots: {
    			default: [
    				create_default_slot,
    				({ item }) => ({ 17: item }),
    				({ item }) => item ? 131072 : 0
    			]
    		},
    		$$scope: { ctx }
    	};

    	if (/*start*/ ctx[1] !== void 0) {
    		virtuallist_props.start = /*start*/ ctx[1];
    	}

    	if (/*end*/ ctx[2] !== void 0) {
    		virtuallist_props.end = /*end*/ ctx[2];
    	}

    	virtuallist = new VirtualList({ props: virtuallist_props, $$inline: true });
    	binding_callbacks.push(() => bind(virtuallist, "start", virtuallist_start_binding));
    	binding_callbacks.push(() => bind(virtuallist, "end", virtuallist_end_binding));
    	let each_value = /*$courses*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Filter: ";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			div1 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Selected Courses:";
    			t4 = space();
    			div6 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			create_component(virtuallist.$$.fragment);
    			t5 = space();
    			p = element("p");
    			t6 = text("showing items ");
    			t7 = text(/*start*/ ctx[1]);
    			t8 = text("-");
    			t9 = text(/*end*/ ctx[2]);
    			t10 = space();
    			div5 = element("div");
    			br = element("br");
    			t11 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t12 = space();
    			h12 = element("h1");
    			h12.textContent = "Clear All Courses";
    			attr_dev(h10, "for", "search");
    			set_style(h10, "display", "inline");
    			attr_dev(h10, "class", "svelte-lmzvpb");
    			add_location(h10, file$4, 54, 2, 1429);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "search");
    			set_style(input, "display", "inline");
    			set_style(input, "width", "50%");
    			set_style(input, "padding", "0.5%");
    			attr_dev(input, "class", "svelte-lmzvpb");
    			add_location(input, file$4, 55, 2, 1492);
    			set_style(div0, "float", "left");
    			set_style(div0, "width", "60%");
    			attr_dev(div0, "class", "svelte-lmzvpb");
    			add_location(div0, file$4, 53, 1, 1390);
    			attr_dev(h11, "class", "svelte-lmzvpb");
    			add_location(h11, file$4, 58, 2, 1649);
    			set_style(div1, "float", "right");
    			set_style(div1, "width", "40%");
    			attr_dev(div1, "class", "svelte-lmzvpb");
    			add_location(div1, file$4, 57, 1, 1609);
    			set_style(div2, "width", "100%");
    			attr_dev(div2, "class", "svelte-lmzvpb");
    			add_location(div2, file$4, 52, 0, 1361);
    			set_style(div3, "height", "100%");
    			attr_dev(div3, "class", "svelte-lmzvpb");
    			add_location(div3, file$4, 63, 2, 1782);
    			set_style(p, "margin", "auto");
    			attr_dev(p, "class", "svelte-lmzvpb");
    			add_location(p, file$4, 68, 2, 1965);
    			attr_dev(div4, "class", "container svelte-lmzvpb");
    			set_style(div4, "float", "left");
    			set_style(div4, "width", "60%");
    			add_location(div4, file$4, 62, 1, 1724);
    			attr_dev(br, "class", "svelte-lmzvpb");
    			add_location(br, file$4, 71, 2, 2090);
    			attr_dev(div5, "class", "container svelte-lmzvpb");
    			set_style(div5, "float", "right");
    			set_style(div5, "width", "40%");
    			add_location(div5, file$4, 70, 1, 2031);
    			set_style(h12, "float", "right");
    			set_style(h12, "width", "40%");
    			set_style(h12, "margin", "0 auto");
    			attr_dev(h12, "class", "svelte-lmzvpb");
    			add_location(h12, file$4, 80, 1, 2347);
    			set_style(div6, "width", "100%");
    			attr_dev(div6, "class", "svelte-lmzvpb");
    			add_location(div6, file$4, 61, 0, 1695);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			set_input_value(input, /*searchTerm*/ ctx[0]);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, h11);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div4);
    			append_dev(div4, div3);
    			mount_component(virtuallist, div3, null);
    			append_dev(div4, t5);
    			append_dev(div4, p);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(p, t8);
    			append_dev(p, t9);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			append_dev(div5, br);
    			append_dev(div5, t11);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			append_dev(div6, t12);
    			append_dev(div6, h12);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[10]),
    					listen_dev(h12, "click", /*clear*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchTerm*/ 1 && input.value !== /*searchTerm*/ ctx[0]) {
    				set_input_value(input, /*searchTerm*/ ctx[0]);
    			}

    			const virtuallist_changes = {};
    			if (dirty & /*filteredList*/ 8) virtuallist_changes.items = /*filteredList*/ ctx[3];

    			if (dirty & /*$$scope, item*/ 393216) {
    				virtuallist_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_start && dirty & /*start*/ 2) {
    				updating_start = true;
    				virtuallist_changes.start = /*start*/ ctx[1];
    				add_flush_callback(() => updating_start = false);
    			}

    			if (!updating_end && dirty & /*end*/ 4) {
    				updating_end = true;
    				virtuallist_changes.end = /*end*/ ctx[2];
    				add_flush_callback(() => updating_end = false);
    			}

    			virtuallist.$set(virtuallist_changes);
    			if (!current || dirty & /*start*/ 2) set_data_dev(t7, /*start*/ ctx[1]);
    			if (!current || dirty & /*end*/ 4) set_data_dev(t9, /*end*/ ctx[2]);

    			if (dirty & /*$theme, removeCourse, $courses*/ 176) {
    				each_value = /*$courses*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div5, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(virtuallist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(virtuallist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div6);
    			destroy_component(virtuallist);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let filteredList;
    	let $term;
    	let $courses;
    	let $theme;
    	validate_store(term, "term");
    	component_subscribe($$self, term, $$value => $$invalidate(13, $term = $$value));
    	validate_store(courses, "courses");
    	component_subscribe($$self, courses, $$value => $$invalidate(4, $courses = $$value));
    	validate_store(theme, "theme");
    	component_subscribe($$self, theme, $$value => $$invalidate(5, $theme = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SelectCourse", slots, []);
    	let { items = [] } = $$props;

    	fetch(`json/${$term}.json`).then(data => data.json()).then(jsonData => {
    		jsonData.forEach(element => {
    			$$invalidate(9, items = [
    				...items,
    				{
    					// "key":element.id,
    					"name": element.code, //`${element.code} | ${element.description}`,
    					"content": element.description,
    					"sendDispatch": element.code
    				}
    			]);
    		});
    	});

    	
    	let searchTerm = "";
    	let start, end;

    	// let tempcourses = []
    	function receiveDispatch(e) {
    		let tempcourses = $courses;
    		console.log(tempcourses.indexOf(e.detail.text));
    		if (tempcourses.indexOf(e.detail.text) == -1) tempcourses = [...tempcourses, e.detail.text];

    		if (tempcourses.length > 5) {
    			window.alert("You can only select a maximum of 5 courses!");
    			return;
    		}

    		console.log(tempcourses);
    		courses.set(tempcourses);
    	}

    	function removeCourse(course) {
    		let tempcourses = $courses;
    		tempcourses.splice(tempcourses.indexOf(course), 1);
    		courses.set(tempcourses);
    	}

    	function clear() {
    		courses.set([]);
    	}

    	const writable_props = ["items"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<SelectCourse> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchTerm = this.value;
    		$$invalidate(0, searchTerm);
    	}

    	function virtuallist_start_binding(value) {
    		start = value;
    		$$invalidate(1, start);
    	}

    	function virtuallist_end_binding(value) {
    		end = value;
    		$$invalidate(2, end);
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(9, items = $$props.items);
    	};

    	$$self.$capture_state = () => ({
    		theme,
    		active: active$1,
    		term,
    		courses,
    		VirtualList,
    		ListItem,
    		items,
    		searchTerm,
    		start,
    		end,
    		receiveDispatch,
    		removeCourse,
    		clear,
    		$term,
    		filteredList,
    		$courses,
    		$theme
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(9, items = $$props.items);
    		if ("searchTerm" in $$props) $$invalidate(0, searchTerm = $$props.searchTerm);
    		if ("start" in $$props) $$invalidate(1, start = $$props.start);
    		if ("end" in $$props) $$invalidate(2, end = $$props.end);
    		if ("filteredList" in $$props) $$invalidate(3, filteredList = $$props.filteredList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*items, searchTerm*/ 513) {
    			 $$invalidate(3, filteredList = items.filter(item => item.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1));
    		}
    	};

    	return [
    		searchTerm,
    		start,
    		end,
    		filteredList,
    		$courses,
    		$theme,
    		receiveDispatch,
    		removeCourse,
    		clear,
    		items,
    		input_input_handler,
    		virtuallist_start_binding,
    		virtuallist_end_binding
    	];
    }

    class SelectCourse extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { items: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectCourse",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get items() {
    		throw new Error("<SelectCourse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<SelectCourse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\LoadingSpinner.svelte generated by Svelte v3.32.0 */

    const file$5 = "src\\LoadingSpinner.svelte";

    function create_fragment$5(ctx) {
    	let div9;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let div4;
    	let t4;
    	let div5;
    	let t5;
    	let div6;
    	let t6;
    	let div7;
    	let t7;
    	let div8;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			t4 = space();
    			div5 = element("div");
    			t5 = space();
    			div6 = element("div");
    			t6 = space();
    			div7 = element("div");
    			t7 = space();
    			div8 = element("div");
    			attr_dev(div0, "class", "sk-cube sk-cube1 svelte-vw5bzd");
    			set_style(div0, "background-color", /*randomColor*/ ctx[0]);
    			add_location(div0, file$5, 5, 4, 123);
    			attr_dev(div1, "class", "sk-cube sk-cube2 svelte-vw5bzd");
    			set_style(div1, "background-color", /*randomColor*/ ctx[0]);
    			add_location(div1, file$5, 6, 4, 205);
    			attr_dev(div2, "class", "sk-cube sk-cube3 svelte-vw5bzd");
    			set_style(div2, "background-color", /*randomColor*/ ctx[0]);
    			add_location(div2, file$5, 7, 4, 287);
    			attr_dev(div3, "class", "sk-cube sk-cube4 svelte-vw5bzd");
    			set_style(div3, "background-color", /*randomColor*/ ctx[0]);
    			add_location(div3, file$5, 8, 4, 369);
    			attr_dev(div4, "class", "sk-cube sk-cube5 svelte-vw5bzd");
    			set_style(div4, "background-color", /*randomColor*/ ctx[0]);
    			add_location(div4, file$5, 9, 4, 451);
    			attr_dev(div5, "class", "sk-cube sk-cube6 svelte-vw5bzd");
    			set_style(div5, "background-color", /*randomColor*/ ctx[0]);
    			add_location(div5, file$5, 10, 4, 533);
    			attr_dev(div6, "class", "sk-cube sk-cube7 svelte-vw5bzd");
    			set_style(div6, "background-color", /*randomColor*/ ctx[0]);
    			add_location(div6, file$5, 11, 4, 615);
    			attr_dev(div7, "class", "sk-cube sk-cube8 svelte-vw5bzd");
    			set_style(div7, "background-color", /*randomColor*/ ctx[0]);
    			add_location(div7, file$5, 12, 4, 697);
    			attr_dev(div8, "class", "sk-cube sk-cube9 svelte-vw5bzd");
    			set_style(div8, "background-color", /*randomColor*/ ctx[0]);
    			add_location(div8, file$5, 13, 4, 779);
    			attr_dev(div9, "class", "sk-cube-grid svelte-vw5bzd");
    			add_location(div9, file$5, 4, 0, 91);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div0);
    			append_dev(div9, t0);
    			append_dev(div9, div1);
    			append_dev(div9, t1);
    			append_dev(div9, div2);
    			append_dev(div9, t2);
    			append_dev(div9, div3);
    			append_dev(div9, t3);
    			append_dev(div9, div4);
    			append_dev(div9, t4);
    			append_dev(div9, div5);
    			append_dev(div9, t5);
    			append_dev(div9, div6);
    			append_dev(div9, t6);
    			append_dev(div9, div7);
    			append_dev(div9, t7);
    			append_dev(div9, div8);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LoadingSpinner", slots, []);
    	let randomColor = "#" + ((1 << 24) * Math.random() | 0).toString(16);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LoadingSpinner> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ randomColor });

    	$$self.$inject_state = $$props => {
    		if ("randomColor" in $$props) $$invalidate(0, randomColor = $$props.randomColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [randomColor];
    }

    class LoadingSpinner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoadingSpinner",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Modal.svelte generated by Svelte v3.32.0 */
    const file$6 = "src\\Modal.svelte";

    // (6:0) {#if showModal}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Hello world";
    			add_location(p, file$6, 8, 12, 262);
    			attr_dev(div0, "class", "modal svelte-19p8j17");
    			add_location(div0, file$6, 7, 8, 229);
    			attr_dev(div1, "class", "backdrop svelte-19p8j17");
    			add_location(div1, file$6, 6, 4, 118);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", self(/*click_handler*/ ctx[1]), false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: 100 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: 100 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(6:0) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*showModal*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showModal*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showModal*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, []);
    	let { showModal } = $$props;
    	const writable_props = ["showModal"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, showModal = !showModal);

    	$$self.$$set = $$props => {
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    	};

    	$$self.$capture_state = () => ({ fade, showModal });

    	$$self.$inject_state = $$props => {
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showModal, click_handler];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { showModal: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*showModal*/ ctx[0] === undefined && !("showModal" in props)) {
    			console.warn("<Modal> was created without expected prop 'showModal'");
    		}
    	}

    	get showModal() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showModal(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Scheduler.svelte generated by Svelte v3.32.0 */

    const { console: console_1$2 } = globals;
    const file$7 = "src\\Scheduler.svelte";

    // (142:0) {#if !loaded}
    function create_if_block$2(ctx) {
    	let spinner;
    	let t0;
    	let h1;
    	let current;
    	spinner = new LoadingSpinner({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(spinner.$$.fragment);
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Loading Schedules...";
    			attr_dev(h1, "class", "svelte-k0q3gb");
    			add_location(h1, file$7, 143, 4, 4093);
    		},
    		m: function mount(target, anchor) {
    			mount_component(spinner, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spinner, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(142:0) {#if !loaded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let link;
    	let t0;
    	let t1;
    	let div4;
    	let div0;
    	let span0;
    	let t3;
    	let span1;
    	let t4;
    	let br0;
    	let t5;
    	let t6;
    	let span2;
    	let t7;
    	let input;
    	let input_value_value;
    	let input_max_value;
    	let t8;
    	let t9_value = /*items*/ ctx[1].length + "";
    	let t9;
    	let t10;
    	let span3;
    	let t11;
    	let br1;
    	let t12;
    	let t13;
    	let span4;
    	let t14;
    	let div1;
    	let t15;
    	let div2;
    	let t16;
    	let div3;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = !/*loaded*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			link = element("link");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			div4 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "aa";
    			t3 = space();
    			span1 = element("span");
    			t4 = text("Previous");
    			br0 = element("br");
    			t5 = text("Schedule");
    			t6 = space();
    			span2 = element("span");
    			t7 = text("Showing schedule ");
    			input = element("input");
    			t8 = text(" of ");
    			t9 = text(t9_value);
    			t10 = space();
    			span3 = element("span");
    			t11 = text("Next");
    			br1 = element("br");
    			t12 = text("Schedule");
    			t13 = space();
    			span4 = element("span");
    			t14 = space();
    			div1 = element("div");
    			t15 = space();
    			div2 = element("div");
    			t16 = space();
    			div3 = element("div");
    			if (script0.src !== (script0_src_value = "./codebase/dhtmlxscheduler.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$7, 1, 4, 19);
    			if (script1.src !== (script1_src_value = "./codebase/ext/dhtmlxscheduler_limit.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$7, 2, 4, 103);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "./codebase/dhtmlxscheduler_terrace.css");
    			attr_dev(link, "type", "text/css");
    			add_location(link, file$7, 3, 4, 173);
    			attr_dev(span0, "class", "invisible svelte-k0q3gb");
    			add_location(span0, file$7, 147, 8, 4263);
    			add_location(br0, file$7, 148, 38, 4336);
    			attr_dev(span1, "class", "svelte-k0q3gb");
    			add_location(span1, file$7, 148, 8, 4306);
    			attr_dev(input, "class", "inpnum svelte-k0q3gb");
    			attr_dev(input, "type", "number");
    			input.value = input_value_value = /*idx*/ ctx[2] + 1;
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", input_max_value = /*items*/ ctx[1].length);
    			add_location(input, file$7, 150, 31, 4452);
    			attr_dev(span2, "class", "svelte-k0q3gb");
    			add_location(span2, file$7, 150, 8, 4429);
    			add_location(br1, file$7, 151, 34, 4613);
    			attr_dev(span3, "class", "svelte-k0q3gb");
    			add_location(span3, file$7, 151, 8, 4587);
    			attr_dev(span4, "class", "invisible svelte-k0q3gb");
    			add_location(span4, file$7, 152, 8, 4642);
    			attr_dev(div0, "class", "overlay svelte-k0q3gb");
    			add_location(div0, file$7, 146, 4, 4232);
    			attr_dev(div1, "class", "dhx_cal_navline svelte-k0q3gb");
    			add_location(div1, file$7, 154, 4, 4691);
    			attr_dev(div2, "class", "dhx_cal_header");
    			add_location(div2, file$7, 155, 4, 4732);
    			attr_dev(div3, "class", "dhx_cal_data");
    			add_location(div3, file$7, 156, 4, 4772);
    			attr_dev(div4, "id", "scheduler_here");
    			attr_dev(div4, "class", "dhx_cal_container");
    			set_style(div4, "width", "100%");
    			set_style(div4, "height", (/*loaded*/ ctx[0] ? 100 : 0) + "%");
    			add_location(div4, file$7, 145, 0, 4131);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t3);
    			append_dev(div0, span1);
    			append_dev(span1, t4);
    			append_dev(span1, br0);
    			append_dev(span1, t5);
    			append_dev(div0, t6);
    			append_dev(div0, span2);
    			append_dev(span2, t7);
    			append_dev(span2, input);
    			append_dev(span2, t8);
    			append_dev(span2, t9);
    			append_dev(div0, t10);
    			append_dev(div0, span3);
    			append_dev(span3, t11);
    			append_dev(span3, br1);
    			append_dev(span3, t12);
    			append_dev(div0, t13);
    			append_dev(div0, span4);
    			append_dev(div4, t14);
    			append_dev(div4, div1);
    			append_dev(div4, t15);
    			append_dev(div4, div2);
    			append_dev(div4, t16);
    			append_dev(div4, div3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(script0, "load", /*fetchSchedules*/ ctx[3], false, false, false),
    					listen_dev(span1, "click", /*prev*/ ctx[6], false, false, false),
    					listen_dev(input, "input", /*input_handler*/ ctx[7], false, false, false),
    					listen_dev(span3, "click", /*next*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*loaded*/ ctx[0]) {
    				if (if_block) {
    					if (dirty & /*loaded*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t1.parentNode, t1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*idx*/ 4 && input_value_value !== (input_value_value = /*idx*/ ctx[2] + 1)) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (!current || dirty & /*items*/ 2 && input_max_value !== (input_max_value = /*items*/ ctx[1].length)) {
    				attr_dev(input, "max", input_max_value);
    			}

    			if ((!current || dirty & /*items*/ 2) && t9_value !== (t9_value = /*items*/ ctx[1].length + "")) set_data_dev(t9, t9_value);

    			if (!current || dirty & /*loaded*/ 1) {
    				set_style(div4, "height", (/*loaded*/ ctx[0] ? 100 : 0) + "%");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function show_minical() {
    	if (scheduler.isCalendarVisible()) scheduler.destroyCalendar(); else scheduler.renderCalendar({
    		position: "dhx_minical_icon",
    		date: scheduler.getState().date,
    		navigation: true,
    		handler(date, calendar) {
    			scheduler.setCurrentView(date);
    			scheduler.destroyCalendar();
    		}
    	});
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $courses;
    	let $term;
    	validate_store(courses, "courses");
    	component_subscribe($$self, courses, $$value => $$invalidate(8, $courses = $$value));
    	validate_store(term, "term");
    	component_subscribe($$self, term, $$value => $$invalidate(9, $term = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Scheduler", slots, []);

    	function print() {
    		$courses.split(",").forEach(element => {
    			fetch(`https://jcurda-api.herokuapp.com/?term=${$term}&course=${element}`).then(data => data.json()).then(jsonData => {
    				console.log(jsonData);
    			});

    			
    		});
    	}

    	// console.log($courses.join(','))
    	let loaded = false;

    	let items = [];
    	let idx = 0;

    	function fetchSchedules() {
    		fetch(`https://jcurda-api.herokuapp.com/schedules?term=${$term}&courses=${$courses.join(",")}`).then(response => {
    			if (!response.ok) {
    				response.text().then(text => {
    					window.alert(text);
    					active$1.set("Select Courses");
    				});
    			} else {
    				response.json().then(jsonData => {
    					$$invalidate(1, items = jsonData);
    					console.log(items);
    					start();
    				});
    			}
    		});
    	}

    	function start() {
    		scheduler.config.multi_day = true;
    		scheduler.config.readonly = true;

    		// scheduler.config.readonly_form = true;
    		scheduler.config.start_on_monday = false;

    		scheduler.config.first_hour = 7;
    		scheduler.config.last_hour = 22;
    		scheduler.config.hour_date = "%h %A";
    		scheduler.config.day_date = "%l";

    		// scheduler.config.hour_size_px=30;
    		scheduler.init("scheduler_here", new Date(2020, 0, 0), "week");

    		update();
    		$$invalidate(0, loaded = !loaded);

    		scheduler.attachEvent("onClick", function (id, e) {
    			//any custom logic here
    			console.log("test");

    			return true;
    		});
    	}

    	const typeIDX = e => {
    		let num = e.target.value - 1;
    		if (!(num >= 0 && num <= items.length)) return;
    		console.log(num);
    		$$invalidate(2, idx = num);
    		update();
    	};

    	const next = () => {
    		console.log(idx);
    		if (idx + 1 >= items.length) return;
    		$$invalidate(2, idx++, idx);
    		update();
    	};

    	const prev = () => {
    		console.log(idx);
    		if (idx <= 0) return;
    		$$invalidate(2, idx--, idx);
    		update();
    	};

    	const save = () => {
    		// idx++;
    		// update();
    		console.log($term);

    		console.log($courses);

    		// fetch(`http://127.0.0.1:5000/schedules?term=${$term}&courses=${$courses}`)
    		fetch(`https://jcurda-api.herokuapp.com/schedules?term=${$term}&courses=${$courses}`).then(data => console.log(data.json())).then(jsonData => {
    			console.log(jsonData);
    		});

    		
    	};

    	function update() {
    		scheduler.clearAll();

    		// scheduler.load("./common/events.json");
    		scheduler.parse(items[idx]);
    	}

    	let modal = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Scheduler> was created with unknown prop '${key}'`);
    	});

    	const input_handler = e => typeIDX(e);

    	$$self.$capture_state = () => ({
    		term,
    		courses,
    		active: active$1,
    		Spinner: LoadingSpinner,
    		Modal,
    		print,
    		loaded,
    		items,
    		idx,
    		fetchSchedules,
    		start,
    		show_minical,
    		typeIDX,
    		next,
    		prev,
    		save,
    		update,
    		modal,
    		$courses,
    		$term
    	});

    	$$self.$inject_state = $$props => {
    		if ("loaded" in $$props) $$invalidate(0, loaded = $$props.loaded);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("idx" in $$props) $$invalidate(2, idx = $$props.idx);
    		if ("modal" in $$props) modal = $$props.modal;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loaded, items, idx, fetchSchedules, typeIDX, next, prev, input_handler];
    }

    class Scheduler extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Scheduler",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.32.0 */
    const file$8 = "src\\App.svelte";

    // (19:1) {:else}
    function create_else_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "do something";
    			attr_dev(p, "class", "svelte-str3c3");
    			add_location(p, file$8, 19, 2, 461);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(19:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:40) 
    function create_if_block_2(ctx) {
    	let scheduler;
    	let current;
    	scheduler = new Scheduler({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(scheduler.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(scheduler, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scheduler.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scheduler.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scheduler, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(17:40) ",
    		ctx
    	});

    	return block;
    }

    // (15:39) 
    function create_if_block_1$1(ctx) {
    	let selectcourse;
    	let current;
    	selectcourse = new SelectCourse({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(selectcourse.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(selectcourse, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selectcourse.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selectcourse.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(selectcourse, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(15:39) ",
    		ctx
    	});

    	return block;
    }

    // (13:1) {#if $active == 'Select Term'}
    function create_if_block$3(ctx) {
    	let selectterm;
    	let current;
    	selectterm = new SelectTerm({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(selectterm.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(selectterm, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selectterm.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selectterm.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(selectterm, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(13:1) {#if $active == 'Select Term'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let body;
    	let header;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let body_class_value;
    	let current;
    	header = new Header({ $$inline: true });
    	const if_block_creators = [create_if_block$3, create_if_block_1$1, create_if_block_2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$active*/ ctx[1] == "Select Term") return 0;
    		if (/*$active*/ ctx[1] == "Select Courses") return 1;
    		if (/*$active*/ ctx[1] == "Choose Schedule") return 2;
    		return 3;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			body = element("body");
    			create_component(header.$$.fragment);
    			t = space();
    			if_block.c();
    			attr_dev(body, "class", body_class_value = "" + (null_to_empty(/*$theme*/ ctx[0]) + " svelte-str3c3"));
    			add_location(body, file$8, 9, 0, 248);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			mount_component(header, body, null);
    			append_dev(body, t);
    			if_blocks[current_block_type_index].m(body, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(body, null);
    			}

    			if (!current || dirty & /*$theme*/ 1 && body_class_value !== (body_class_value = "" + (null_to_empty(/*$theme*/ ctx[0]) + " svelte-str3c3"))) {
    				attr_dev(body, "class", body_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_component(header);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $theme;
    	let $active;
    	validate_store(theme, "theme");
    	component_subscribe($$self, theme, $$value => $$invalidate(0, $theme = $$value));
    	validate_store(active$1, "active");
    	component_subscribe($$self, active$1, $$value => $$invalidate(1, $active = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		theme,
    		active: active$1,
    		term,
    		Header,
    		SelectTerm,
    		SelectCourse,
    		Scheduler,
    		$theme,
    		$active
    	});

    	return [$theme, $active];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
