<script>
	import { onMount, tick } from 'svelte';
	// props
	export let items;
	export let height = '100%';
	export let itemHeight = undefined;
	let foo;
	// read-only, but visible to consumers via bind:start
	export let start = 0;
	export let end = 0;
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

	$: visible = items.slice(start, end).map((data, i) => {
		return { index: i + start, data };
	});

	// whenever `items` changes, invalidate the current heightmap
	$: if (mounted && (viewport_height || true) && (itemHeight || true)) refresh();

	$: if (mounted && items) refreshItems()

	let itemLength
	let oldItemsLength = items.length
	$: itemLength = items.length

	async function refreshItems() {
		let itemsLength = items.length
			rows = contents.getElementsByTagName('svelte-virtual-list-row');
		top = 0
		bottom = 0
		height_map = []

		if (itemsLength == 0) {
			start = 0
			end = 0
			return
		}
		if (start > items.length - 1) {
			start = items.length - 1
			end = items.length - 1
		}
		refresh()
		handle_scroll()
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
				end = i + 1;
				await tick(); // render the newly visible row
				row = rows[i - start];
			}
			const row_height = height_map[i] = itemHeight || row.offsetHeight;
			content_height += row_height;
			i += 1;
		}

		end = i;
		const remaining = items.length - end;
		average_height = (top + content_height) / end;
		bottom = remaining * average_height;
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
				start = i;
				top = y;
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
		end = i;
		const remaining = items.length - end;
		average_height = y / end;
		while (i < items.length) 
			height_map[i++] = average_height;
		bottom = remaining * average_height;
		// prevent jumping if we scrolled up into unknown territory
		if (start < old_start) {
			await tick();
			let expected_height = 0;
			let actual_height = 0;
			for (let i = start; i < old_start; i +=1) {
				if (rows[i - start]) {
					expected_height += height_map[i];
					actual_height += itemHeight || rows[i - start].offsetHeight;
				}
			}
			const d = actual_height - expected_height;
			viewport.scrollTo(0, scrollTop + d);
		}
		// TODO if we overestimated the space these
		// rows would occupy we may need to add some
		// more. maybe we can just call handle_scroll again?
	}
	// trigger initial refresh
	onMount(() => {
		rows = contents.getElementsByTagName('svelte-virtual-list-row');
		mounted = true;
	});

	async function goTop() {
		await tick();
		viewport.scrollTo(0, 0);
    }

</script>

<style>
	svelte-virtual-list-viewport {
		position: relative;
		overflow-y: auto;
		-webkit-overflow-scrolling:touch;
		/* display: block; */
		display: flex;
		flex-direction: column;
	}
	svelte-virtual-list-contents, svelte-virtual-list-row {
		display: block;
	}
	svelte-virtual-list-row {
		overflow: hidden;
	}

	svelte-virtual-list-viewport::-webkit-scrollbar {
   		width: 0.75em;
	}
	svelte-virtual-list-viewport::-webkit-scrollbar-track {
		background-color: transparent;
	}
	svelte-virtual-list-viewport::-webkit-scrollbar-thumb {
		background-color: var(--gray3);
		border-radius: 8px;
	}


	.back-to-top {
        opacity: 0.7;
        transition: opacity 0.5s, visibility 0.5s;
        border-radius: 50%;
        background-color: #000;
        /* border: 1px solid #fff; */
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGUAAAA0CAYAAACTrvadAAADWUlEQVR42u1av2sUURBek0juEpQcGrjiUigpkqApDpSDGPREwRBBOcghGJuYKjYmlV55XQ6swpEqjZ2dSHpBhICdhaWV1bX+AfecJy8xnLu3t++b/T0fDAsHuztvvr335psZx0k5lFJ3yH5o6/f77+g64QhiJeSJGgAR85Eu0xKdeAjZUt74RnZVohQdGRfIWsofP8muScTCJ2SCrKuC4aZELjxCpsx5YYN7EkF+QkrmnECwIZHkI6RiUl4O7EhEcUIWyXqKF22dLEh07Qi5rUICnU3v6TIpUQ5GyJoKH1/JLku0RyNkU0WH72RlifpwUbinooc+sxaEAXdCOkBgtXqvmastbgkT/wiZNAevLU5O61x0nTFnhS3WhBA6aMEgfiArDjyzYH63xWaeCSmbg9YW+169E1Mj2wee/SZ3WoYWPA+Kwl2/oDEkDp3cNMxooVUwW3oWVYptCqBTWSfkAUjIfcv3PgbeqQuhpawSsgFqiWXw/TX68n9bvl8XRCtZI2QH2EJ+cXUQ6TlLwFmm77uRFVHY5tAgjD7NgSJzJc2E6LT0kFODMPp2xRBui6dpFYXHYWgQRh+LtDV+AnzcThMhs6AofBWVcDP/5oNMN8z0gQzu180YfB4jewv4fJhYkalHeUANUo/Z/20gQ/ycuIYZOXQ3Tg3CuI5GJhpmbvO8Afsgcwn7wOrgeuadtP7lTcm+lNCtuAqof41qXKKwlUQNkqBK9sOoRWE3yRqEca1lMJt8HoWT08A8b6QahHHNl8i+AGt+HdqaGeZ5m05KQb5fJDsCG2Zj3E6h87x1J+WgNYwjLWYzHFLgcgaZ502MBmFMcHZjzTh1mTpLGoSRHGSK075hRjeuZ1GDMBLzCKxiLAZ94YssaxBGYmqgyFwZdc/cy4MGYSQGaTFrrPuVsDt50iDM2SkiMrfcHloA53mbTs5hdBzSYm6dfdTmYcg876ojOI1lEZxj7v7d/gFRqPfRJaHCtTZo3WLWDTMH0CAVoWDo+WzbYm7bzPZmXoMwkvMyYGwPzmpkAZT7EVv9Jj/ENALou/HBm/3aoO3/bhKMSsyqT2yPPfXdkNJKbjUIIzHLHiLzxLcC4vJ3a0hI2Yi5bgbWzydMM0FqXz3RIKEQM2vI6HkNr/8Bm6ReqxbVux8AAAAASUVORK5CYII=);
        position: fixed;
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        cursor: pointer;
        top: auto;
        /* right: 2em; */
		right: 72%;
        bottom: 1em;
        left: auto;
        z-index: 100;
        width: 4em;
        height: 4em;
        background-size: 50%;
        background-repeat: no-repeat;
        background-position: 50%;
    }
  
    /* .back-to-top.hidden {
      opacity: 0;
      visibility: hidden;
    } */
</style>

<svelte-virtual-list-viewport
	bind:this={viewport}
	bind:offsetHeight={viewport_height}
	on:scroll={handle_scroll}
	style="height: {height};"
>
	<svelte-virtual-list-contents
		bind:this={contents}
		style="padding-top: {top}px; padding-bottom: {bottom}px;"
	>
		{#each visible as row (row.index)}
			<svelte-virtual-list-row>
				<slot item={row.data}>Missing template</slot>
			</svelte-virtual-list-row>
		{/each}
	</svelte-virtual-list-contents>
</svelte-virtual-list-viewport>
<div class="back-to-top" on:click={goTop}></div>