<script>
  import MenuItem from './MenuItem.svelte'

  export let disabled = false
  export let label
  export let shortcut = ''
  export let value = false

  const handleClick = () => {
    value = !value
  }
</script>

<MenuItem
  {disabled}
  iconLeft={value ? 'check' : ''}
  {label}
  {shortcut}
  on:click={handleClick}
/>
