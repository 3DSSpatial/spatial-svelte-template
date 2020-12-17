<script>
  import { auth, setupCollab, APP_DATA } from '../helpers'

  let userChipSet
  let userChip
  let tauntBtn

  auth.getUserData().then((userData) => {
    if (!userData) return

    userChip.userData = userData
    const { session, sessionSync } = setupCollab(userData, $APP_DATA)
    userChipSet.session = session
    const { renderer } = $APP_DATA

    { 
      // SessionSync interations
      tauntBtn.addEventListener('click', (event) => {
        const camera = renderer.getViewport().getCamera()
        const xfo = camera.getParameter('GlobalXfo').getValue()
        const target = camera.getTargetPosition()
        sessionSync.directAttention(xfo.tr, target, 1, 1000)
      })

      window.addEventListener('zeaUserClicked', (event) => {
        const userData = sessionSync.userDatas[event.detail.id]
        if (userData) {
          const avatar = userData.avatar
          const viewXfo = avatar.viewXfo
          const focalDistance = avatar.focalDistance || 1.0
          const target = viewXfo.tr.add(viewXfo.ori.getZaxis().scale(-focalDistance))

          const viewport = renderer.getViewport()
          const cameraManipulator = viewport.getManipulator()
          cameraManipulator.orientPointOfView(viewport.getCamera(), viewXfo.tr, target, 1.0, 1000)
        }
      })
    }
  })

  function handleUndo() {
    const { undoRedoManager } = $APP_DATA
    undoRedoManager.undo()
  }

  function handleRedo() {
    const { undoRedoManager } = $APP_DATA
    undoRedoManager.redo()
  }

  function handleVR() {
    const { renderer } = $APP_DATA
    
    renderer
    .getXRViewport()
    .then(xrViewport => {
      xrViewport.startPresenting().then(() => {
        xrViewport.on('presentingChanged', () => {
          console.log('VR Activated')
        });
      });
    })
    .catch(reason => {
      console.warn("Unable to setup XR:" + reason);
    });
  }
</script>

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
</style>

<div class="flex items-center w-full h-full px-2">
  <div class="logo flex items-center h-full mr-4">
    <img src="/images/logo-zea.svg" alt="logo" />
  </div>
  <div class="flex-grow">
    <zea-menu type="dropdown" show-anchor="true">
      <zea-menu-item>
        Edit
        <zea-menu-subitems>
          <zea-menu-item class="MenuItem" hotkey="ctrl+Z" onclick={handleUndo}>
            <zea-icon name="arrow-undo"></zea-icon>
            Undo
          </zea-menu-item>
          <zea-menu-item class="MenuItem" hotkey="ctrl+Y" onclick={handleRedo}>
            <zea-icon name="arrow-redo"></zea-icon>
            Redo
          </zea-menu-item>
        </zea-menu-subitems>
      </zea-menu-item>
      <zea-menu-item>
        Viewports
        <zea-menu-subitems>
          <zea-menu-item class="MenuItem" hotkey="ctrl+N" onclick={handleVR}>
            <zea-icon name="square"></zea-icon>
            Launch VR
          </zea-menu-item>
        </zea-menu-subitems>
      </zea-menu-item>
    </zea-menu>
  </div>
  <div class="panel-container mx-2 user-set-container">
    <zea-user-chip-set bind:this={userChipSet} showImages />
  </div>
  <div>
    <zea-button bind:this={tauntBtn}>Look</zea-button>
  </div>
  <div class="divider ml-2" />
  <div class="user-container pl-2">
    <zea-user-chip bind:this={userChip} />
  </div>
</div>
