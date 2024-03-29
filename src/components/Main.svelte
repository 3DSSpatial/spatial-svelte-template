<script>
  import { onMount } from 'svelte'

  import '../helpers/fps-display'

  import Menu from '../components/ContextMenu/Menu.svelte'
  import MenuOption from '../components/ContextMenu/MenuOption.svelte'
  import Dialog from '../components/Dialog.svelte'
  import ParameterOwnerWidget from './parameters/ParameterOwnerWidget.svelte'
  import Toolbar from '../components/Toolbar/Toolbar.svelte'

  import Drawer from '../components/Drawer.svelte'
  import ProgressBar from '../components/ProgressBar.svelte'
  import Sidebar from '../components/Sidebar.svelte'
  import DropZone from '../components/DropZone.svelte'

  import { auth } from '../helpers/auth'

  import { APP_DATA } from '../stores/appData'
  import { assets } from '../stores/assets.js'
  import { ui } from '../stores/ui.js'
  import { selectionManager } from '../stores/selectionManager.js'
  import { scene } from '../stores/scene.js'

  import { createClient } from '../ChannelMessenger.js'
  import buildTree from '../helpers/buildTree'
  import { RENDER_MODES, changeRenderMode } from '../helpers/renderModes'

  import {
    Color,
    Vec3,
    TreeItem,
    GLRenderer,
    Scene,
    resourceLoader,
    SystemDesc,
    EnvMap,
    InstanceItem,
    CameraManipulator,
    CADAsset,
    CADBody,
    CADPart,
  } from '@zeainc/zea-engine'
  import { SelectionManager, UndoRedoManager, ToolManager, SelectionTool } from '@zeainc/zea-ux'
  import { Session, SessionSync } from '@zeainc/zea-collab'

  import { GLTFAsset } from '@zeainc/gltf-loader'

  let canvas
  let fpsContainer
  const urlParams = new URLSearchParams(window.location.search)
  const embeddedMode = urlParams.has('embedded')
  const collabEnabled = urlParams.has('roomId')
  let progress
  let files = ''
  let fileLoaded = false
  const appData = {}
  let renderer

  const filterItemSelection = (item) => {
    // Propagate selections up from the edges and surfaces up to
    // the part body or the instanced body
    // Note: in some use cases, like a parts catalog, we want to
    // propagate selection up to the part level.
    // while in a PLM scenario, we want to pick bodies.
    while (
      item &&
      !(item instanceof CADBody) &&
      !(item instanceof InstanceItem && item.getSrcTree() instanceof CADBody)
    ) {
      item = item.getOwner()
    }
    return item
  }

  /** LOAD ASSETS METHODS START */
  const loadZCADAsset = (url, filename) => {
    const asset = new CADAsset()
    // TODO (engine-v3.10.0): frame all can occur in the initial load once the camera framing
    // is updated.
    asset.getGeometryLibrary().once('loaded', () => {
      renderer.frameAll()
    })
    asset.load(url).then(() => {})
    $assets.addChild(asset)
    return asset
  }

  const loadGLTFAsset = (url, filename) => {
    const asset = new GLTFAsset()
    asset.load(url, filename).then(() => {
      renderer.frameAll()
    })
    $assets.addChild(asset)
    return asset
  }

  const loadAsset = (url, filename) => {
    let res
    if (filename.endsWith('zcad')) {
      res = loadZCADAsset(url, filename)
    } else if (filename.endsWith('gltf') || filename.endsWith('glb')) {
      res = loadGLTFAsset(url, filename)
    }

    if (res) fileLoaded = true
    return res
  }
  /** LOAD ASSETS METHODS END */

  onMount(async () => {
    renderer = new GLRenderer(canvas, {
      debugGeomIds: urlParams.has('debugGeomIds'),
    })

    $scene = new Scene()

    // Assigning an Environment Map enables PBR lighting for niceer shiny surfaces.
    if (!SystemDesc.isMobileDevice && SystemDesc.gpuDesc.supportsWebGL2) {
      const envMap = new EnvMap('envMap')
      envMap.load('data/StudioG.zenv')
      envMap.headlightModeParam.value = true
      $scene.envMapParam.value = envMap
    }

    renderer.outlineThickness = 1
    renderer.outlineColor = new Color(0.2, 0.2, 0.2, 1)

    $scene.setupGrid(10, 10)
    // renderer.getViewport().backgroundColorParam.value = new Color(0.85, 0.85, 0.85, 1)
    renderer.setScene($scene)

    // console.log(renderer.getViewport().getCamera().globalXfoParam.value.toString())
    // console.log(renderer.getViewport().getCamera().getTargetPosition().toString())
    renderer.getViewport().getCamera().setPositionAndTarget(new Vec3(5, 5, 1.75), new Vec3(0, 0, 1))

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
    cameraManipulator.setDefaultManipulationMode(CameraManipulator.MANIPULATION_MODES.tumbler)
    appData.cameraManipulator = cameraManipulator
    const toolManager = new ToolManager(appData)
    $selectionManager = new SelectionManager(appData, {
      enableXfoHandles: true,
    })

    // Users can enable the handles usinga menu or hotkey.
    $selectionManager.showHandles(false)

    appData.selectionManager = $selectionManager

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
    const subtreeColor = selectionColor //.lerp(new Color(1, 1, 1, 0), 0.5)
    $selectionManager.selectionGroup.getParameter('HighlightColor').setValue(selectionColor)
    $selectionManager.selectionGroup.getParameter('SubtreeHighlightColor').setValue(subtreeColor)

    // Color the selection rect.
    const selectionRectColor = new Color(0, 0, 0, 1)
    selectionTool.rectItem.getParameter('Material').getValue().getParameter('BaseColor').setValue(selectionRectColor)

    /** SELECTION END */

    /** UX START */
    //long touch support
    var longTouchTimer = 0
    const camera = renderer.getViewport().getCamera()
    const startLongTouchTimer = (event, item) => {
      longTouchTimer = setTimeout(function () {
        //long touch for any click but we can specifify
        openMenu(event, item)
        longTouchTimer = 0
        camera.getParameter('GlobalXfo').off('valueChanged', endLogTouchTimer)
      }, 1000)
      camera.getParameter('GlobalXfo').on('valueChanged', endLogTouchTimer)
    }
    const endLogTouchTimer = () => {
      clearTimeout(longTouchTimer)
      longTouchTimer = 0
      camera.getParameter('GlobalXfo').off('valueChanged', endLogTouchTimer)
    }

    renderer.getViewport().on('pointerDown', (event) => {
      if (isMenuVisible) closeMenu()
      if (event.pointerType == 'touch' && event.intersectionData) {
        const item = filterItemSelection(event.intersectionData.geomItem)
        startLongTouchTimer(event, item)
      }
    })

    renderer.getViewport().on('pointerUp', (event) => {
      // Clear any pending long touch.
      if (longTouchTimer) {
        endLogTouchTimer(longTouchTimer)
      }
      if (event.pointerType == 'touch' && event.intersectionData && isMenuVisible) {
        // The menu was opened by the long touch. Prevent any other actions from occuring.
        event.stopPropagation()
      }

      // Detect a right click
      if (event.button == 0 && event.intersectionData) {
        // if the selection tool is active then do nothing, as it will
        // handle single click selection.s
        const toolStack = toolManager.toolStack
        if (toolStack[toolStack.length - 1] == selectionTool) return

        // To provide a simple selection when the SelectionTool is not activated,
        // we toggle selection on the item that is selcted.
        const item = filterItemSelection(event.intersectionData.geomItem)
        if (item) {
          if (!event.shiftKey) {
            $selectionManager.toggleItemSelection(item, !event.ctrlKey)
          } else {
            const items = new Set()
            items.add(item)
            $selectionManager.deselectItems(items)
          }
        }
      } else if (event.button == 2 && event.intersectionData) {
        const item = filterItemSelection(event.intersectionData.geomItem)
        openMenu(event, item)
        // stop propagation to prevent the camera manipulator from handling the event.
        event.stopPropagation()
      }
    })

    renderer.getViewport().on('pointerDoublePressed', (event) => {
      console.log(event)
    })
    /** UX END */

    /** PROGRESSBAR START */
    resourceLoader.on('progressIncremented', (event) => {
      progress = event.percent
    })
    /** PROGRESSBAR END */

    /** FPS DISPLAY START */
    const fpsDisplay = document.createElement('fps-display')
    fpsDisplay.renderer = renderer
    fpsContainer.appendChild(fpsDisplay)
    /** FPS DISPLAY END */

    /** LOAD ASSETS START */
    let assetUrl
    if (!embeddedMode) {
      if (urlParams.has('zcad')) {
        assetUrl = urlParams.get('zcad')
        loadAsset(assetUrl, assetUrl)
        fileLoaded = true
      }
      if (urlParams.has('gltf')) {
        assetUrl = urlParams.get('gltf')
        loadAsset(assetUrl, assetUrl)
        fileLoaded = true
      }
    }
    /** LOAD ASSETS END */

    /** COLLAB START*/
    if (!embeddedMode) {
      const userData = await auth.getUserData()
      appData.userData = userData

      if (collabEnabled && userData) {
        const SOCKET_URL = 'https://websocket-staging.zea.live'
        // const roomId = assetUrl
        const roomId = urlParams.get('roomId')
        const session = new Session(userData, SOCKET_URL)
        if (roomId) session.joinRoom(roomId)

        const sessionSync = new SessionSync(session, appData, userData, {
          /* Avatars scale based on the distance to the target */
          scaleAvatarWithFocalDistance: true,
          /* The overal size multiplier of the avatar. */
          avatarScale: 2.0,
        })

        appData.session = session
        appData.sessionSync = sessionSync

        appData.session.sub('loadAsset', (data, user) => {
          loadAsset(data.url, data.filename)
        })

        APP_DATA.update(() => appData)
      }
    }
    /** COLLAB END */

    /** EMBED MESSAGING START*/
    if (embeddedMode) {
      const client = createClient()

      let rootAsset

      client.on('setBackgroundColor', (data) => {
        const color = new Color(data.color)
        $scene.getSettings().getParameter('BackgroundColor').setValue(color)
      })

      client.on('setHighlightColor', (data) => {
        const color = new Color(data.color)
        // Note: the alpha value determines  the fill of the highlight.
        color.a = 0.1
        $selectionManager.selectionGroup.getParameter('HighlightColor').setValue(color)
        $selectionManager.selectionGroup.getParameter('SubtreeHighlightColor').setValue(color)
      })

      client.on('setRenderMode', (data) => {
        changeRenderMode(RENDER_MODES[data.mode])
      })

      client.on('setCameraManipulationMode', (data) => {
        const mode = data.mode.toLowerCase()
        cameraManipulator.setDefaultManipulationMode(CameraManipulator.MANIPULATION_MODES[mode])
      })

      client.on('loadCADFile', (data) => {
        console.log('loadCADFile', data)
        if (!data.addToCurrentScene) {
          $assets.removeAllChildren()
        }

        const asset = loadZCADAsset(data.url, data.resources)
        if (!data.convertZtoY) {
          // Rotate the model so 'up' is the correct direction
          const xfo = asset.getParameter('LocalXfo').getValue()
          xfo.ori.setFromAxisAndAngle(new Vec3(1, 0, 0), Math.PI * 0.5)

          // const box = asset.getParameter('BoundingBox').getValue()
          // xfo.tr.z = -box.p0.z
          asset.getParameter('LocalXfo').setValue(xfo)
        }
        asset.once('loaded', () => {
          console.log('loadCADFile', data._id)
          if (data._id) {
            const tree = buildTree(asset)
            client.send(data._id, { modelStructure: tree })
          }
        })
        rootAsset = asset
      })

      client.on('getModelStructure', (data) => {
        if (data._id) {
          const tree = buildTree($assets)
          client.send(data._id, { modelStructure: tree })
        }
      })

      let recievingSelectionnChange = false
      client.on('selectItems', (data) => {
        recievingSelectionnChange = true
        const items = []
        data.paths.forEach((path) => {
          const treeItem = rootAsset.resolvePath(path)
          if (treeItem) items.push(treeItem)
        })
        $selectionManager.selectItems(items, false)
        recievingSelectionnChange = false
      })
      client.on('deselectItems', (data) => {
        recievingSelectionnChange = true
        console.log('deselectItems', data.paths)
        const items = []
        data.paths.forEach((path) => {
          const treeItem = rootAsset.resolvePath(path)
          if (treeItem) items.push(treeItem)
        })
        $selectionManager.deselectItems(items)
        recievingSelectionnChange = false
      })

      client.on('unloadCADFile', (data) => {
        console.log('unloadCADFile', data)

        $assets.removeChildByName(data.name)

        if (data._id) {
          client.send(data._id, { done: true })
        }
      })

      const findCADPart = (item) => {
        // Propagate selections up from the edges and surfaces up to the CADPart
        while (item && !(item instanceof CADPart)) {
          item = item.getOwner()
        }
        return item
      }

      $selectionManager.on('selectionChanged', (event) => {
        if (recievingSelectionnChange) return
        const { selection, prevSelection } = event
        const selectionPaths = []
        selection.forEach((item) => {
          if (!prevSelection.has(item)) {
            const part = findCADPart(item)
            if (part) {
              // remove the 'root', 'AssetName' part of the path.
              const path = part.getPath().slice(2)
              selectionPaths.push(path)
            }
          }
        })
        const deselectionPaths = []
        prevSelection.forEach((item) => {
          if (!selection.has(item)) {
            const part = findCADPart(item)
            if (part) {
              // remove the 'root', 'AssetName' part of the path.
              const path = part.getPath().slice(2)
              deselectionPaths.push(path)
            }
          }
        })
        console.log(selectionPaths, deselectionPaths)
        client.send('selectionChanged', {
          selection: selectionPaths,
          deselection: deselectionPaths,
        })
      })
    }
    /** EMBED MESSAGING END */

    /** DYNAMIC SELECTION UI START */
    $selectionManager.on('leadSelectionChanged', (event) => {
      parameterOwner = event.treeItem
      $ui.shouldShowParameterOwnerWidget = parameterOwner
    })
    /** DYNAMIC SELECTION UI END */

    APP_DATA.set(appData)
  })

  let isMenuVisible = false
  let pos = { x: 0, y: 0 }
  let contextItem
  const openMenu = (event, item) => {
    contextItem = item
    pos = event.touches
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : { x: event.clientX, y: event.clientY }
    isMenuVisible = true
  }
  const closeMenu = () => {
    console.log('closeMenu:')
    isMenuVisible = false
  }
  let isDialogOpen = false
  const closeDialog = () => {
    isDialogOpen = false
  }

  /** LOAD ASSETS FROM FILE START */

  const handleCadFile = () => {
    const reader = new FileReader()

    reader.addEventListener(
      'load',
      function () {
        const url = reader.result
        const filename = files.name
        loadAsset(url, filename)

        // If a collabroative session is running, pass the data
        // to the other session users to load.
        const { session } = appData
        if (session) session.pub('loadAsset', { url, filename })
      },
      false
    )

    reader.readAsDataURL(files)
  }

  const handleDrop = () => {
    console.log('test')
  }

  /** LOAD ASSETS FROM FILE END */
  $: parameterOwner = null
</script>

<main class="Main flex flex-col flex-1">
  <div class="flex-1 relative">
    <canvas bind:this={canvas} class="absolute h-full w-full" />
    <div bind:this={fpsContainer} />
    <Drawer>
      <Sidebar />
    </Drawer>
    {#if $ui.shouldShowParameterOwnerWidget}
      <ParameterOwnerWidget {parameterOwner} />
    {/if}
    <div class="absolute bottom-10 w-full flex justify-center">
      <Toolbar />
    </div>
    {#if !fileLoaded}
      <DropZone bind:files on:changeFile={handleCadFile} {fileLoaded} />
    {/if}
  </div>
</main>

{#if progress < 100}
  <div class="fixed bottom-0 w-full">
    <ProgressBar {progress} />
  </div>
{/if}

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
          isDialogOpen = true
          closeMenu()
        }
      }}
    />
  </Menu>
{/if}
