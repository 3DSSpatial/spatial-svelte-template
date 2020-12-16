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

    {
      // SessionSync interations
      tauntBtn.addEventListener('click', (event) => {
        const { renderer } = $APP_DATA
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
          const target = viewXfo.tr.add(
            viewXfo.ori.getZaxis().scale(-focalDistance)
          )

          const viewport = renderer.getViewport()
          const cameraManipulator = viewport.getManipulator()
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
</script>

<style>
  .logo {
    width: 5em;
  }

  .divider {
    border-right: 2px solid var(--color-grey-1);
    height: calc(100% - 2px);
    flex-grow: 1;
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
  }
</style>

<div class="flex items-center w-full h-full px-2">
  <div class="logo flex items-center h-full mr-4">
    <img src="/images/logo-zea.svg" alt="logo" />
  </div>

  <div class="h-full w-full mx-1 user-set-container">
    <zea-user-chip-set bind:this={userChipSet} showImages />
  </div>
  <div class="">
    <zea-button bind:this={tauntBtn}>Taunt</zea-button>
  </div>
  <div class="divider" />
  <div class="user-container pl-2">
    <zea-user-chip bind:this={userChip} />
  </div>
</div>
