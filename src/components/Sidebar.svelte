<script>
  export let appData = {}
  export let rootItems = []

  let treeView
</script>

<div class="panel-container">
  <zea-tree-view bind:this={treeView} items={rootItems} {appData} />
</div>
