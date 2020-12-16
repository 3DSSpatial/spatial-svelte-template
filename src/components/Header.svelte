<script>
  import { auth, setupCollab, APP_DATA } from '../helpers'

  let userChipSet
  let userChip

  auth.getUserData().then((userData) => {
    if (!userData) return

    userChip.userData = userData
    const { session } = setupCollab(userData, $APP_DATA)
    userChipSet.session = session
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

  <div class="panel-container mx-1 user-set-container">
    <zea-user-chip-set bind:this={userChipSet} showImages />
  </div>

  <div class="divider" />
  <div class="user-container pl-2">
    <zea-user-chip bind:this={userChip} />
  </div>
</div>
