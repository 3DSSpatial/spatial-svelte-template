<script>
  import { onMount } from 'svelte'

  import { APP_DATA } from '../stores/appData'

  let treeView

  onMount(() => {
    APP_DATA.subscribe((appData) => {
      if (!appData || !treeView) return
      treeView.selectionManager = appData.selectionManager
      treeView.items = [appData.assets]
    })
  })
</script>

<div class="h-full w-full">
  <zea-scroll-pane>
    <zea-tree-view id="zea-tree-view" bind:this={treeView} />
  </zea-scroll-pane>
</div>
