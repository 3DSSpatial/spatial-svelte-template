<script>
  import { onMount, setContext, createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'
  import { menuKey } from './menuKey.js'

  export let x
  export let y

  // whenever x and y is changed, restrict box to be within bounds
  $: (() => {
    if (!menuEl) return

    const rect = menuEl.getBoundingClientRect()
    x = Math.min(window.innerWidth - rect.width, x)
    if (y > window.innerHeight - rect.height) y -= rect.height
  })(x, y)

  const dispatch = createEventDispatcher()

  setContext(menuKey, {
    dispatchClick: () => dispatch('click'),
  })

  let menuEl
  const onPageClick = (e) => {
    if (e.target === menuEl || menuEl.contains(e.target)) return
    dispatch('clickoutside')
  }
</script>

<style>
  div {
    position: absolute;
    display: grid;
    border: 1px solid #0003;
    box-shadow: 2px 2px 5px 0px #0002;
    background: white;
  }
</style>

<svelte:body on:click={onPageClick} />

<div
  class="Menu"
  transition:fade={{ duration: 100 }}
  bind:this={menuEl}
  style="top: {y}px; left: {x}px;">
  <slot />
</div>
