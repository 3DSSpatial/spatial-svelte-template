<script>
  import ToolbarButton from './ToolbarButton.svelte'

  export let isHighlighted = false
  export let isOpen = false
  export let title = ''

  const handleOutsideClick = () => {
    isOpen = false
    window.removeEventListener('click', handleOutsideClick)
  }

  const handleClick = (event) => {
    event.stopPropagation()

    isOpen = !isOpen

    window.addEventListener('click', handleOutsideClick)
  }
</script>

<button class="ToolbarButtonPopup relative">
  <ToolbarButton {isHighlighted} {title} on:click={handleClick}>
    <slot />
  </ToolbarButton>

  <div class:hidden={!isOpen}>
    <slot name="popup" />
  </div>
</button>
