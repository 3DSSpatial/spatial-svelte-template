<script>
  import { redirect } from '@roxi/routify'
  import { onMount } from 'svelte'

  const { CameraManipulator } = window.zeaEngine
  const { ToolManager } = window.zeaUx

  import { auth } from '../helpers/auth'

  import { APP_DATA } from '../stores/appData'
  import { ui } from '../stores/ui.js'

  let userChipSet
  let userChip
  let vrToggleMenuItem
  let vrSpectatorMenuItem
  let toggleSelectModeMenuItem

  let renderer
  let toolManager
  let cameraManipulator
  let undoRedoManager
  let userData
  let session
  let sessionSync

  document.addEventListener('keydown', (event) => {
    if (!event.target.contains(renderer.getGLCanvas())) return
    switch (event.key.toLowerCase()) {
      case 'f':
        if (renderer) renderer.frameAll()
        break
      case 's':
        if (toolManager) {
          toggleSelectMode()
          toggleSelectModeMenuItem.checked = selectionEnabled
        }
        break
      case 'z':
        if (event.ctrlKey && undoRedoManager) undoRedoManager.undo()
        break
      case 'y':
        if (event.ctrlKey && undoRedoManager) undoRedoManager.redo()
        break
    }
  })

  onMount(() => {
    if (session) {
      session.leaveRoom()
    }

    vrToggleMenuItem.textContent = 'VR Device Not Detected'
    vrToggleMenuItem.disabled = true

    APP_DATA.subscribe((appData) => {
      if (!appData || renderer) return

      renderer = appData.renderer
      toolManager = appData.toolManager
      cameraManipulator = appData.cameraManipulator
      undoRedoManager = appData.undoRedoManager
      {
        const { renderer } = $APP_DATA
        renderer
          .getXRViewport()
          .then((xrViewport) => {
            xrViewport.spectatorMode = false // disable by default.
            if (vrToggleMenuItem) vrToggleMenuItem.textContent = 'Launch VR'
            xrViewport.on('presentingChanged', (event) => {
              const { state } = event
              if (state) {
                vrToggleMenuItem.textContent = 'Exit VR'
              } else {
                vrToggleMenuItem.textContent = 'Launch VR'
              }
            })
          })
          .catch((reason) => {
            console.warn('Unable to setup XR:' + reason)
          })
      }
    })

    APP_DATA.subscribe((appData) => {
      if (!appData || session || !appData.session || !appData.sessionSync) {
        return
      }
      session = appData.session
      userData = appData.userData
      sessionSync = appData.sessionSync

      userChip.userData = userData
      userChipSet.session = session

      {
        // SessionSync interactions.
        window.addEventListener('zeaUserClicked', (event) => {
          const userData = sessionSync.userDatas[event.detail.id]
          if (userData) {
            const avatar = userData.avatar
            const viewXfo = avatar.viewXfo
            const focalDistance = avatar.focalDistance || 1.0
            const target = viewXfo.tr.add(
              viewXfo.ori.getZaxis().scale(-focalDistance)
            )

            if (cameraManipulator)
              cameraManipulator.orientPointOfView(
                viewport.getCamera(),
                viewXfo.tr,
                target,
                1.0,
                1000
              )
          }
        })
      }
    })
  })

  // ////////////////////////////////////
  // UX

  const handleFrameAll = () => {
    const { renderer } = $APP_DATA
    renderer.frameAll()
  }

  const handleUndo = () => {
    const { undoRedoManager } = $APP_DATA
    undoRedoManager.undo()
  }

  const handleRedo = () => {
    const { undoRedoManager } = $APP_DATA
    undoRedoManager.redo()
  }

  let selectionEnabled = false
  const toggleSelectMode = () => {
    if (!selectionEnabled) {
      toolManager.pushTool('SelectionTool')
      selectionEnabled = true
    } else {
      toolManager.popTool()
      selectionEnabled = false
    }
  }

  let wasdEnabled = false
  const toggleWASDWalkMode = () => {
    wasdEnabled = !wasdEnabled
    cameraManipulator.enabledWASDWalkMode = wasdEnabled
  }

  // ////////////////////////////////////
  // Collab

  const handleDA = () => {
    auth.getUserData().then((userData) => {
      if (!userData) {
        return
      }
      const { renderer, sessionSync } = $APP_DATA
      {
        // SessionSync interactions.
        const camera = renderer.getViewport().getCamera()
        const xfo = camera.getParameter('GlobalXfo').getValue()
        const target = camera.getTargetPosition()
        sessionSync.directAttention(xfo.tr, target, 1, 1000)
      }
    })
  }

  // ////////////////////////////////////
  // VR

  const handleLaunchVR = () => {
    const { renderer } = $APP_DATA

    renderer
      .getXRViewport()
      .then((xrViewport) => {
        xrViewport.togglePresenting()
      })
      .catch((reason) => {
        console.warn('Unable to setup XR:' + reason)
      })
  }

  const handleToggleVRSpatatorMode = () => {
    const { renderer } = $APP_DATA
    renderer.getXRViewport().then((xrViewport) => {
      xrViewport.spectatorMode = !xrViewport.spectatorMode
    })
  }

  const handleSignOut = async () => {
    if (session) {
      session.leaveRoom()
    }

    await auth.signOut()
    $redirect('/login')
  }

  const handleClickMenuToggle = () => {
    $ui.shouldShowDrawer = !$ui.shouldShowDrawer
  }
</script>

<div class="Header flex items-center px-2 text-gray-200">
  <span
    class="material-icons cursor-default mr-2"
    on:click={handleClickMenuToggle}
  >
    menu
  </span>
  <div class="logo flex items-center h-full mr-4">
    <img src="/images/logo-zea.svg" alt="logo" />
  </div>
  <div class="flex-grow">
    <zea-menu type="dropdown" show-anchor="true">
      <zea-menu-item>
        View
        <zea-menu-subitems>
          <zea-menu-item class="menu-item" hotkey="f" onclick={handleFrameAll}>
            Frame All
          </zea-menu-item>
        </zea-menu-subitems>
      </zea-menu-item>
      <zea-menu-item>
        Edit
        <zea-menu-subitems>
          <zea-menu-item class="menu-item" hotkey="ctrl+Z" onclick={handleUndo}>
            <zea-icon icon="arrow-undo" size="16" />
            Undo
          </zea-menu-item>
          <zea-menu-item class="menu-item" hotkey="ctrl+Y" onclick={handleRedo}>
            <zea-icon icon="arrow-redo" size="16" />
            Redo
          </zea-menu-item>
          <zea-menu-item
            class="menu-item"
            switch="true"
            hotkey="s"
            bind:this={toggleSelectModeMenuItem}
            onclick={toggleSelectMode}
          >
            <zea-icon size="16" />
            Toggle Selection
          </zea-menu-item>
          <zea-menu-item
            class="menu-item"
            switch="true"
            onclick={toggleWASDWalkMode}
          >
            <zea-icon size="16" />
            WASD Walk Mode
          </zea-menu-item>
        </zea-menu-subitems>
      </zea-menu-item>
      <zea-menu-item>
        Collab
        <zea-menu-subitems>
          <zea-menu-item class="menu-item" hotkey="ctrl+N" onclick={handleDA}>
            Direct Attention
          </zea-menu-item>
        </zea-menu-subitems>
      </zea-menu-item>
      <zea-menu-item>
        VR
        <zea-menu-subitems>
          <zea-menu-item
            class="menu-item"
            bind:this={vrToggleMenuItem}
            switch="true"
            onclick={handleLaunchVR}
          >
            <zea-icon icon="recording-outline" size="16" />
            Launch VR
          </zea-menu-item>
          <zea-menu-item
            switch="true"
            onclick={handleToggleVRSpatatorMode}
            bind:this={vrSpectatorMenuItem}
          >
            Spectator Mode
          </zea-menu-item>
        </zea-menu-subitems>
      </zea-menu-item>
    </zea-menu>
  </div>
  <div class="panel-container mx-2 user-set-container">
    <zea-user-chip-set bind:this={userChipSet} showImages />
  </div>
  <div class="mr-2">
    <zea-button on:click={handleSignOut}>Sign out</zea-button>
  </div>
  <div class="divider ml-2" />
  <div class="user-container pl-2">
    <zea-user-chip bind:this={userChip} profile-card-align="right" />
  </div>
</div>

<style>
  .logo {
    width: 5em;
  }

  .divider {
    border-right: 2px solid var(--color-grey-1);
    height: calc(100% - 2px);
  }

  .user-container {
    height: 100%;
    width: 50px;
    display: flex;
    align-items: center;
  }

  .user-set-container {
    display: flex;
    align-items: center;
    width: 250px;
  }

  .menu-item {
    display: flex;
    align-items: center;
  }
</style>
