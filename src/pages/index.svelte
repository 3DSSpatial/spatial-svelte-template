<script>
  import { redirect } from '@roxi/routify'
  import { onMount } from 'svelte'

  import Header from '../components/Header.svelte'
  import Renderer from '../components/Renderer.svelte'

  import { auth } from '../helpers/auth'

  let shouldShowLayout

  onMount(async () => {
    const isAuthenticated = await auth.isAuthenticated()

    if (isAuthenticated) {
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
    <Renderer />
  </div>
{/if}
