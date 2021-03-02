<script>
  import TreeView from '../components/TreeView.svelte'

  import { assets } from '../stores/assets.js'
  import { selectionManager } from '../stores/selectionManager.js'

  $: treeItems = [$assets]
</script>

<div class="h-full w-full">
  <zea-scroll-pane>
    <TreeView items={treeItems} selectionManager={$selectionManager} />
  </zea-scroll-pane>
</div>
