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
    const { GLRenderer, Scene, resourceLoader, SystemDesc, EnvMap } = window.zeaEngine
    const { SelectionManager, UndoRedoManager} = window.zeaUx

    const renderer = new GLRenderer(canvas)
    const scene = new Scene()

    // Assigning an Environment Map enables PBR lighting for niceer shiny surfaces.
    if (!SystemDesc.isMobileDevice) {
      const envMap = new EnvMap('envMap')
      envMap
        .getParameter('FilePath')
        .setValue(`/assets/HDR_029_Sky_Cloudy_Ref.vlenv`)
      envMap.getParameter('HeadLightMode').setValue(true)
      scene.getSettings().getParameter('EnvMap').setValue(envMap)
    }

    scene.setupGrid(10, 10)
    renderer.setScene(scene)

    treeViewItems = [scene.getRoot()]

    const undoRedoManager = UndoRedoManager.getInstance()
    const appData = { renderer, scene, undoRedoManager }
    const selectionManager = new SelectionManager(appData)

    appData.selectionManager = selectionManager
    APP_DATA.set(appData)

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
  <div slot="A" class="h-full w-full">
    <Sidebar rootItems={treeViewItems} {appData} />
  </div>
  <div slot="B" class="h-full w-full">
    <canvas id="renderer" bind:this={canvas} />
    <div class="relative">
      <zea-progress-bar bind:this={progressBar} />
    </div>
    <div bind:this={fpsContainer} />
  </div>
</zea-layout>
