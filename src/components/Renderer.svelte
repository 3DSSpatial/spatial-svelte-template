<script>
  import { onMount } from 'svelte'

  import '../helpers/fps-display'
  import Sidebar from '../components/Sidebar.svelte'
  import Menu from '../components/ContextMenu/Menu.svelte'
  import MenuOption from '../components/ContextMenu/MenuOption.svelte'
  import Dialog from '../components/Dialog.svelte'
  import SearchTool from '../components/SearchTool.svelte'

  import { auth } from '../helpers/auth'

  import { APP_DATA } from '../stores/appData'
  import { assets } from '../stores/assets.js'
  import { selectionManager } from '../stores/selectionManager.js'
  import { scene } from '../stores/scene.js'

  import { ChannelMessenger } from '../ChannelMessenger.js'
  import buildTree from '../helpers/buildTree'

  const {
    Color,
    Vec3,
    Xfo,
    TreeItem,
    GLRenderer,
    Scene,
    resourceLoader,
    SystemDesc,
    EnvMap,
  } = window.zeaEngine
  const { GLCADPass, CADAsset } = window.zeaCad
  const {
    SelectionManager,
    UndoRedoManager,
    ToolManager,
    SelectionTool,
  } = window.zeaUx

  const { Session, SessionSync } = window.zeaCollab

  let canvas
  let fpsContainer
  let progressBar

  const filterItemSelection = (item) => {
    // Propagate selections deep in the tree up to the part body.
    while (
      item.getName().startsWith('Mesh') ||
      item.getName().startsWith('Edge') ||
      item.getName().startsWith('TreeItem')
    )
      item = item.getOwner()
    return item
  }

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search)

    const renderer = new GLRenderer(canvas, {
      debugGeomIds: urlParams.has('debugGeomIds'),
      xrCompatible: false,
    })

    $scene = new Scene()

    // Assigning an Environment Map enables PBR lighting for niceer shiny surfaces.
    if (!SystemDesc.isMobileDevice) {
      const envMap = new EnvMap('envMap')
      envMap
        .getParameter('FilePath')
        .setValue(`/assets/HDR_029_Sky_Cloudy_Ref.vlenv`)
      envMap.getParameter('HeadLightMode').setValue(true)
      $scene.getSettings().getParameter('EnvMap').setValue(envMap)
    }

    $scene.setupGrid(10, 10)
    $scene
      .getSettings()
      .getParameter('BackgroundColor')
      .setValue(new Color(0.35, 0.35, 0.35, 1))
    renderer.setScene($scene)

    const appData = {}

    appData.renderer = renderer
    appData.scene = $scene

    $assets = new TreeItem('Assets')
    appData.assets = $assets

    $scene.getRoot().addChild($assets)

    /** UNDO START */
    const undoRedoManager = UndoRedoManager.getInstance()
    appData.undoRedoManager = undoRedoManager
    /** UNDO END */

    /** SELECTION START */
    const cameraManipulator = renderer.getViewport().getManipulator()
    appData.cameraManipulator = cameraManipulator
    const toolManager = new ToolManager(appData)
    $selectionManager = new SelectionManager(appData, {
      enableXfoHandles: false,
    })

    appData.selectionManager = $selectionManager

    $selectionManager.showHandles(true)

    const selectionTool = new SelectionTool(appData)
    selectionTool.setSelectionFilter(filterItemSelection)
    toolManager.registerTool('SelectionTool', selectionTool)
    toolManager.registerTool('CameraManipulator', cameraManipulator)

    renderer.getViewport().setManipulator(toolManager)
    toolManager.pushTool('CameraManipulator')
    appData.toolManager = toolManager

    // Note: the alpha value determines  the fill of the highlight.
    const selectionColor = new Color('#F9CE03')

    selectionColor.a = 0.1
    const subtreeColor = selectionColor.lerp(new Color(1, 1, 1, 0), 0.5)
    $selectionManager.selectionGroup
      .getParameter('HighlightColor')
      .setValue(selectionColor)
    $selectionManager.selectionGroup
      .getParameter('SubtreeHighlightColor')
      .setValue(subtreeColor)

    // Color the selection rect.
    const selectionRectColor = selectionColor.clone()
    selectionRectColor.a = 1
    selectionTool.rectItem
      .getParameter('Material')
      .getValue()
      .getParameter('BaseColor')
      .setValue(selectionRectColor)

    /** SELECTION END */

    /** UX START */
    renderer.getViewport().on('pointerUp', (event) => {
      // Detect a right click
      if (event.button == 0 && event.intersectionData) {
        const item = filterItemSelection(event.intersectionData.geomItem)
        $selectionManager.toggleItemSelection(item)
      } else if (event.button == 2 && event.intersectionData) {
        const item = filterItemSelection(event.intersectionData.geomItem)
        openMenu(event, item)
        // stop propagation to prevent the camera manipulator from handling the event.
        event.stopPropagation()
      }
    })

    let highlightedItem
    renderer.getViewport().on('pointerOverGeom', (event) => {
      highlightedItem = filterItemSelection(event.intersectionData.geomItem)
      highlightedItem.addHighlight(
        'pointerOverGeom',
        new Color(0.8, 0.8, 0.8, 0.1),
        true
      )
    })
    renderer.getViewport().on('pointerLeaveGeom', (event) => {
      highlightedItem.removeHighlight('pointerOverGeom', true)
      highlightedItem = null
    })
    renderer.getViewport().on('pointerDoublePressed', (event) => {
      console.log(event)
    })
    /** UX END */

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

    /** CAD START */
    renderer.addPass(new GLCADPass())

    const loadAsset = (url) => {
      const asset = new CADAsset()
      asset.on('error', (event) => {
        console.warn('Error:', event)
      })
      asset.on('loaded', () => {
        const materials = asset.getMaterialLibrary().getMaterials()
        materials.forEach((material) => {
          const baseColor = material.getParameter('BaseColor')
          if (baseColor) baseColor.setValue(baseColor.getValue().toGamma())
        })
        renderer.frameAll()
      })
      asset.getGeometryLibrary().on('loaded', () => {
        renderer.frameAll()
      })
      $assets.addChild(asset)
      asset.getParameter('FilePath').setValue(url)
      return asset
    }

    const url = urlParams.has('zcad')
      ? urlParams.get('zcad')
      : '/assets/gear_box_final_asm-visu.zcad'

    loadAsset(url)
    /** CAD END */

    /** COLLAB START*/
    const SOCKET_URL = 'https://websocket-staging.zea.live'
    const ROOM_ID = url
    auth.getUserData().then((userData) => {
      if (!userData) return
      const session = new Session(userData, SOCKET_URL)
      session.joinRoom(ROOM_ID)
      const sessionSync = new SessionSync(session, appData, userData, {})

      appData.userData = userData
      appData.session = session
      appData.sessionSync = sessionSync

      APP_DATA.update(() => appData)
    })
    /** COLLAB END */

    /** EMBED MESSAGING START*/
    const client = new ChannelMessenger()

    client.on('setBackgroundColor', (data) => {
      const color = new Color(data.color)
      $scene.getSettings().getParameter('BackgroundColor').setValue(color)

      if (data._id) {
        client.send(data._id, { done: true })
      }
    })

    client.on('loadCADFile', (data) => {
      if (!data.keep) {
        $assets.removeAllChildren()
      }

      const asset = loadAsset(data.zcad)
      asset.once('loaded', () => {
        if (data._id) {
          const tree = buildTree(asset)
          client.send(data._id, { modelStructure: tree })
        }
      })
    })

    client.on('getModelStructure', (data) => {
      if (data._id) {
        const tree = buildTree($assets)
        client.send(data._id, { modelStructure: tree })
      }
    })

    client.on('unloadCADFile', (data) => {
      console.log('unloadCADFile', data)

      $assets.removeChildByName(data.name)

      if (data._id) {
        client.send(data._id, { done: true })
      }
    })

    $selectionManager.on('selectionChanged', (event) => {
      const { selection } = event
      const selectionPaths = []
      selection.forEach((item) => selectionPaths.push(item.getPath().slice(2)))
      client.send('selectionChanged', { selection: selectionPaths })
    })
    /** EMBED MESSAGING END */

    APP_DATA.set(appData)
  })

  let isMenuVisible = false
  let pos = { x: 0, y: 0 }
  let contextItem
  const openMenu = (event, item) => {
    contextItem = item
    pos = { x: event.clientX, y: event.clientY }
    isMenuVisible = true
  }
  const closeMenu = () => {
    isMenuVisible = false
  }
  let isDialogOpen = false
  const closeDialog = () => {
    isDialogOpen = false
  }
</script>

<zea-layout add-cells="AB" borders cell-a-size="250" show-resize-handles="A">
  <div slot="A" class="h-full w-full">
    <zea-tabs slot="a" orientation="horizontal">
      <div slot="tab-bar">Assembly</div>
      <div class="tab-content">
        <Sidebar />
      </div>

      <div slot="tab-bar">Search</div>
      <div class="tab-content">
        <SearchTool />
      </div>
    </zea-tabs>
  </div>
  <div slot="B" class="h-full w-full">
    <canvas class="h-full w-full" bind:this={canvas} />
    <div class="relative">
      <zea-progress-bar bind:this={progressBar} />
    </div>
    <div bind:this={fpsContainer} />
  </div>
</zea-layout>

<Dialog isOpen={isDialogOpen} close={closeDialog} {contextItem} />

{#if isMenuVisible}
  <Menu {...pos} on:click={closeMenu} on:clickoutside={closeMenu}>
    <MenuOption
      text="Hide"
      on:click={() => {
        contextItem.getParameter('Visible').setValue(false)
      }}
    />
    <MenuOption
      text="Properties"
      on:click={() => {
        if (contextItem) {
          console.log('CurrentSelected Item :', contextItem.rivianAttributes)
          isDialogOpen = true
          closeMenu()
        }
      }}
    />
  </Menu>
{/if}
