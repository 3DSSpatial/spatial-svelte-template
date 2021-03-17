<script>
  import SearchTool from '../components/SearchTool.svelte'
  import TreeView from '../components/TreeView.svelte'

  import { assets } from '../stores/assets.js'
  import { selectionManager } from '../stores/selectionManager.js'

  $: treeItems = [$assets]
</script>

<div class="h-full w-full">
  <zea-tabs orientation="horizontal">
    <div slot="tab-bar">Assembly</div>
    <div class="tab-content">
      <TreeView items={treeItems} selectionManager={$selectionManager} />
    </div>

    <div slot="tab-bar">Search</div>
    <div class="tab-content">
      <SearchTool />
    </div>
  </zea-tabs>
</div>
