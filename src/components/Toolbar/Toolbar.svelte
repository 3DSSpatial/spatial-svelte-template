<script>
  export let orientation = 'horizontal'

  import IconEye from '../icons/IconEye.svelte'
  import IconEyeOff from '../icons/IconEyeOff.svelte'
  import ToolbarButton from './ToolbarButton.svelte'

  import IconFrontView from '../icons/IconFrontView.svelte'
  import IconBackView from '../icons/IconBackView.svelte'
  import IconTopView from '../icons/IconTopView.svelte'
  import IconBottomView from '../icons/IconBottomView.svelte'
  import IconLeftView from '../icons/IconLeftView.svelte'
  import IconRightView from '../icons/IconRightView.svelte'
  import IconPerspView from '../icons/IconPerspView.svelte'

  import { APP_DATA } from '../../stores/appData'

  const { Vec3, Xfo, Mat3 } = window.zeaEngine

  const setCameraXfo = (camera, dir, up) => {
    const sw = dir.cross(up).normalize()
    const upNormalized = sw.cross(dir).normalize()
    const mat3 = new Mat3(sw, upNormalized, dir.negate())
    const xfo = new Xfo()
    xfo.ori.setFromMat3(mat3)
    const target = camera.getTargetPosition()
    const dist = camera.getFocalDistance()
    xfo.tr = target.subtract(dir.scale(dist))
    camera.getParameter('GlobalXfo').setValue(xfo)
  }

  const handleChangeViewFront = () => {
    const { renderer } = $APP_DATA
    const camera = renderer.getViewport().getCamera()
    setCameraXfo(camera, new Vec3(0, 1, 0), new Vec3(0, 0, 1))
    // camera.setIsOrthographic(1.0)
  }
  const handleChangeViewBack = () => {
    const { renderer } = $APP_DATA
    const camera = renderer.getViewport().getCamera()
    setCameraXfo(camera, new Vec3(0, -1, 0), new Vec3(0, 0, 1))
    // camera.setIsOrthographic(1.0)
  }
  const handleChangeViewTop = () => {
    const { renderer } = $APP_DATA
    const camera = renderer.getViewport().getCamera()
    setCameraXfo(camera, new Vec3(0, 0, -1), new Vec3(0, 1, 0))
    // camera.setIsOrthographic(1.0)
  }
  const handleChangeViewBottom = () => {
    const { renderer } = $APP_DATA
    const camera = renderer.getViewport().getCamera()
    setCameraXfo(camera, new Vec3(0, 0, 1), new Vec3(0, -1, 0))
    // camera.setIsOrthographic(1.0)
  }
  const handleChangeViewLeft = () => {
    const { renderer } = $APP_DATA
    const camera = renderer.getViewport().getCamera()
    setCameraXfo(camera, new Vec3(1, 0, 0), new Vec3(0, 0, 1))
    // camera.setIsOrthographic(1.0)
  }
  const handleChangeViewRight = () => {
    const { renderer } = $APP_DATA
    const camera = renderer.getViewport().getCamera()
    setCameraXfo(camera, new Vec3(-1, 0, 0), new Vec3(0, 0, 1))
    // camera.setIsOrthographic(1.0)
  }
  const handleChangeViewPerspective = () => {
    const { renderer } = $APP_DATA
    const camera = renderer.getViewport().getCamera()
    const dir = new Vec3(-1, 1, -1)
    dir.normalizeInPlace()
    setCameraXfo(camera, dir, new Vec3(0, 0, 1))
    camera.setIsOrthographic(0.0)
  }
</script>

<div class="Toolbar flex gap-1" class:flex-col={orientation === 'vertical'}>
  <ToolbarButton title="Front" on:click={handleChangeViewFront}>
    <IconFrontView />
  </ToolbarButton>
  <ToolbarButton title="Back" on:click={handleChangeViewBack}>
    <IconBackView />
  </ToolbarButton>
  <ToolbarButton title="Top" on:click={handleChangeViewTop}>
    <IconTopView />
  </ToolbarButton>
  <ToolbarButton title="Bottom" on:click={handleChangeViewBottom}>
    <IconBottomView />
  </ToolbarButton>
  <ToolbarButton title="Left" on:click={handleChangeViewLeft}>
    <IconLeftView />
  </ToolbarButton>
  <ToolbarButton title="Right" on:click={handleChangeViewRight}>
    <IconRightView />
  </ToolbarButton>
  <ToolbarButton title="Perspective" on:click={handleChangeViewPerspective}>
    <IconPerspView />
  </ToolbarButton>
</div>
