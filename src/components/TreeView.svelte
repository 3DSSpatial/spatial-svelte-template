<script>
  import TreeItem from './TreeItem.svelte'

  export let items
  export let selectionManager = null
  export let undoRedoManager = null
</script>

<div class="TreeView">
  {#each items as item}
    <TreeItem {item} {selectionManager} {undoRedoManager} />
  {/each}
</div>
