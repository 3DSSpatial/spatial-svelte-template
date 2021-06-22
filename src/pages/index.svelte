<script>
  import { redirect } from '@roxi/routify'
  import { onMount } from 'svelte'

  import Header from '../components/Header.svelte'
  import Main from '../components/Main.svelte'

  import { auth } from '../helpers/auth'

  let shouldShowLayout
  const urlParams = new URLSearchParams(window.location.search)
  const collabEnabled = true

  onMount(async () => {
    const isAuthenticated = await auth.isAuthenticated()

    // If a collaborative session is requested, then we display the login page
    // so users can enter a roomid, unless a roomid is already given and the user is authenticated.
    if (isAuthenticated && (!collabEnabled || urlParams.get('roomId'))) {
      shouldShowLayout = true
    } else {
      const params = new URLSearchParams(location.search)
      $redirect('/login?' + params.toString())
    }
  })
</script>

{#if shouldShowLayout}
  <div class="flex flex-col h-full">
    <Header />
    <Main />
  </div>
{/if}
