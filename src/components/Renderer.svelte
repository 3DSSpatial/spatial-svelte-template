<script>
  import { onMount } from 'svelte'
  import { auth, APP_DATA, setupCollab } from '../helpers'
  import '../helpers/fps-display'
  import Sidebar from '../components/Sidebar.svelte'

  let canvas
  let fpsContainer

  let treeViewItems
  let appData
  let progressBar

  onMount(() => {
    const {
      GLRenderer,
      Scene,
      resourceLoader,
      SystemDesc,
      EnvMap,
    } = window.zeaEngine
    const { SelectionManager, UndoRedoManager } = window.zeaUx

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
    const appData = { renderer, scene }

    treeViewItems = [scene.getRoot()]

    /** UNDO START */
    const undoRedoManager = UndoRedoManager.getInstance()
    appData.undoRedoManager = undoRedoManager
    /** UNDO END */

    /** SELECTION START */
    const selectionManager = new SelectionManager(appData)
    appData.selectionManager = selectionManager
    /** SELECTION END */

    /** PROGRESSBAR START */
    if (progressBar) {
      progressBar.percent = 0
      resourceLoader.on('progressIncremented', (event) => {
        const { percent } = event
        if (progressBar) progressBar.percent = percent
      })
    }
    /** PROGRESSBAR END */

    /** FPS DISPLAY START */
    {
      const fpsDisplay = document.createElement('fps-display')
      fpsDisplay.renderer = renderer
      fpsContainer.appendChild(fpsDisplay)
    }
    /** FPS DISPLAY END */

    /** COLLAB START */
    auth.getUserData().then((userData) => {
      const { session, sessionSync } = setupCollab(userData, $APP_DATA)
      appData.userData = userData
      appData.session = session
      appData.sessionSync = sessionSync
    })
    /** COLLAB END */

    APP_DATA.set(appData)
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
