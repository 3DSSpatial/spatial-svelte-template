<script>
  import { onMount } from 'svelte'
  import { APP_DATA } from '../helpers'
  import '../helpers/fps-display'
  import Sidebar from '../components/Sidebar.svelte'

  let canvas
  let fpsContainer

  let treeViewItems
  let appData
  let progressBar

  onMount(() => {
    const { GLRenderer, Scene, resourceLoader } = window.zeaEngine

    const renderer = new GLRenderer(canvas)
    const scene = new Scene()
    scene.setupGrid(10, 10)
    renderer.setScene(scene)

    treeViewItems = [scene.getRoot()]
    APP_DATA.set({ renderer, scene })

    /** PROGRESSBAR START */
    progressBar.percent = 0
    resourceLoader.on('progressIncremented', (event) => {
      const { percent } = event
      progressBar.percent = percent 
    })
    /** PROGRESSBAR END */

    {
      // FPS display configuration
      const fpsDisplay = document.createElement('fps-display')
      fpsDisplay.renderer = renderer
      fpsContainer.appendChild(fpsDisplay)
    }
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
    <div class="relative">
      <zea-progress-bar bind:this={progressBar} />
    </div>
    <div bind:this={fpsContainer}></div>
  </div>
</zea-layout>
