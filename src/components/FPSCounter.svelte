<script>
  import { afterUpdate } from 'svelte'
  import { APP_DATA } from '../helpers'

  let display

  afterUpdate(() => {
    const { renderer } = $APP_DATA
    if (!renderer) return

    let fps = 0
    let frameCounter = 0
    renderer.on('redrawOccurred', () => {
      frameCounter++
    })

    setInterval(() => {
      if (fps != frameCounter * 2) {
        fps = frameCounter * 2
        display = `Fps: ${fps}`
      }

      frameCounter = 0
    }, 500)
  })
</script>

<style>
  .fps-container {
    position: fixed;
    bottom: 40px;
    right: 20px;
    color: red;
  }
</style>

<div class="fps-container">{display || ''}</div>
