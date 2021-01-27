<script>
  import { onMount, getContext } from 'svelte'
  import { menuKey } from './menuKey.js'

  export let text = ''

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  const { dispatchClick } = getContext(menuKey)

  const handleClick = (e) => {
    dispatch('click')
    dispatchClick()
  }
</script>

<style>
  div {
    padding: 4px 15px;
    cursor: default;
    font-size: 14px;
    display: flex;
    align-items: center;
    grid-gap: 5px;
  }
  div:hover {
    background: #0002;
  }
</style>

<div class="MenuOption text-gray-600" on:click={handleClick}>
  {#if text}
    {text}
  {:else}
    <slot />
  {/if}
</div>
