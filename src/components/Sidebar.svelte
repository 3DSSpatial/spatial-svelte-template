<script>
  import { onMount } from 'svelte'

  import { APP_DATA } from '../stores/appData'

  let treeViewEl

  onMount(() => {
    APP_DATA.subscribe((appData) => {
      if (!appData || !treeViewEl) return
      treeViewEl.selectionManager = appData.selectionManager
      treeViewEl.items = [appData.assets]
    })
  })
</script>

<div class="h-full w-full">
  <zea-scroll-pane>
    <zea-tree-view id="zea-tree-view" bind:this={treeViewEl} />
  </zea-scroll-pane>
</div>
