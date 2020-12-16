<script>
  import { onMount } from 'svelte'
  import { APP_DATA } from '../helpers'
  import Sidebar from '../components/Sidebar.svelte'

  let canvas
  let rootItems
  let appData

  onMount(() => {
    const { GLRenderer, Scene } = window.zeaEngine

    const renderer = new GLRenderer(canvas)
    const scene = new Scene()
    scene.setupGrid(10, 10)
    renderer.setScene(scene)

    rootItems = [scene.getRoot()]
    APP_DATA.set({ renderer, scene })
  })
</script>

<style>
  #renderer {
    height: 100%;
    width: 100%;
  }
</style>

<zea-layout add-cells="AB" borders cell-a-size="250" show-resize-handles="A">
  <div slot="A" class="panel-container">
    <Sidebar {rootItems} {appData} />
  </div>
  <div slot="B" class="panel-container">
    <canvas id="renderer" bind:this={canvas} />
  </div>
</zea-layout>
