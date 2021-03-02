<script>
  import TreeItem from './TreeItem.svelte'

  export let expanded = true
  export let items
  export let selectionManager
  export let undoRedoManager
</script>

<div class="TreeView">
  {#each items as item}
    <TreeItem {item} {selectionManager} {undoRedoManager} />
  {/each}
</div>
