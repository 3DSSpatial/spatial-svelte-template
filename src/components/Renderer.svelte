<script>
  import { onMount } from 'svelte'
  import { APP_DATA } from '../helpers'
  import Sidebar from '../components/Sidebar.svelte'
  import FPSCounter from './FPSCounter.svelte'

  let canvas
  let treeViewItems
  let appData
  let renderer

  onMount(() => {
    const { GLRenderer, Scene } = window.zeaEngine

    renderer = new GLRenderer(canvas)
    const scene = new Scene()
    scene.setupGrid(10, 10)
    renderer.setScene(scene)

    treeViewItems = [scene.getRoot()]
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
    <Sidebar rootItems={treeViewItems} {appData} />
  </div>
  <div slot="B" class="panel-container">
    <canvas id="renderer" bind:this={canvas} />
    <FPSCounter />
  </div>
</zea-layout>
