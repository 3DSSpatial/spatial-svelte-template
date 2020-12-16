<script>
  import { redirect } from '@roxi/routify'
  import { onMount } from 'svelte'

  import Header from '../components/Header.svelte'
  import Renderer from '../components/Renderer.svelte'
  import { auth } from '../helpers'

  let userData
  let session

  onMount(async () => {
    const isAuthenticated = await auth.isAuthenticated()
    if (!isAuthenticated) {
      $redirect('/login')
    }
  })
</script>

<zea-layout orientation="vertical" cell-a-size="50" add-cells="AB" borders>
  <div slot="A" class="panel-container">
    <Header />
  </div>
  <div slot="B" class="panel-container">
    <Renderer />
  </div>
</zea-layout>
