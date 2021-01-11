<script>
  import { onMount } from 'svelte'
  import { auth, APP_DATA } from '../helpers'
  import '../helpers/fps-display'
  import Sidebar from '../components/Sidebar.svelte'

  const {
    Color,
    GLRenderer,
    Scene,
    resourceLoader,
    SystemDesc,
    EnvMap,
  } = window.zeaEngine
  const {
    SelectionManager,
    UndoRedoManager,
    ToolManager,
    SelectionTool,
  } = window.zeaUx

  const { Session, SessionSync } = window.zeaCollab

  let canvas
  let fpsContainer

  let treeViewItems
  let appData
  let progressBar

  onMount(() => {
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

    const appData = {}

    appData.renderer = renderer
    appData.scene = scene

    treeViewItems = [scene.getRoot()]

    /** UNDO START */
    const undoRedoManager = UndoRedoManager.getInstance()
    appData.undoRedoManager = undoRedoManager
    /** UNDO END */

    /** SELECTION START */
    const cameraManipulator = renderer.getViewport().getManipulator()
    const toolManager = new ToolManager(appData)
    const selectionManager = new SelectionManager(appData)
    selectionManager.showHandles()
    appData.selectionManager = selectionManager
    const selectionTool = new SelectionTool(appData)
    toolManager.registerTool('SelectionTool', selectionTool)
    toolManager.registerTool('CameraManipulator', cameraManipulator)

    renderer.getViewport().setManipulator(toolManager)
    toolManager.pushTool('CameraManipulator')
    // toolManager.pushTool('SelectionTool')
    appData.toolManager = toolManager

    // // Note: the alpha value determines  the fill of the highlight.
    // const selectionColor = new Color('#00436D')
    // selectionColor.a = 0.1
    // const subtreeColor = selectionColor.lerp(new Color(1, 1, 1, 0), 0.5)
    // selectionManager.selectionGroup
    //   .getParameter('HighlightColor')
    //   .setValue(selectionColor)
    // selectionManager.selectionGroup
    //   .getParameter('SubtreeHighlightColor')
    //   .setValue(subtreeColor)

    /** SELECTION END */

    /** PROGRESSBAR START */
    if (progressBar) {
      progressBar.percent = 0
      progressBar.style.visibility = 'hidden'
      let visible = false
      let visibleTimeoutId = 0
      resourceLoader.on('progressIncremented', (event) => {
        if (progressBar) {
          if (!visible) {
            // Display the progress bar if hidden
            progressBar.style.visibility = 'visible'
            visible = true
          } else if (visibleTimeoutId > 0) {
            // Prevent the progress bar from hiding if a timer is running.
            clearTimeout(visibleTimeoutId)
          }
          const { percent } = event
          progressBar.percent = percent
          if (percent >= 100) {
            // Hide the progress bar after one second.
            visibleTimeoutId = setTimeout(() => {
              progressBar.style.visibility = 'hidden'
              visibleTimeoutId = 0
              visible = false
            }, 1000)
          }
        }
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

    /** COLLAB START*/
    const SOCKET_URL = 'https://websocket-staging.zea.live'
    const ROOM_ID = 'zea-template-collab'
    auth.getUserData().then((userData) => {
      if (!userData) return
      const session = new Session(userData, SOCKET_URL)
      session.joinRoom(ROOM_ID)
      const sessionSync = new SessionSync(session, appData, userData, {})
      appData.userData = userData
      appData.session = session
      appData.sessionSync = sessionSync
      APP_DATA.set(appData)
    })
    /** COLLAB END */

    /** CAD START */
    const { GLCADPass, CADAsset } = window.zeaCad

    const url = '/assets/Fidget-Spinner-2.zcad'
    renderer.addPass(new GLCADPass())

    const asset = new CADAsset()
    asset.on('loaded', () => {
      const materials = asset.getMaterialLibrary().getMaterials()
      materials.forEach((material) => {
        if (material.getShaderName() == 'SimpleSurfaceShader') {
          material.setShaderName('StandardSurfaceShader')
        }
      })
      renderer.frameAll()
    })
    asset.getGeometryLibrary().on('loaded', () => {
      renderer.frameAll()
    })
    scene.getRoot().addChild(asset)
    asset.getParameter('FilePath').setValue(url)
    /** CAD END */

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
