<script>
  import { onMount, afterUpdate } from 'svelte'
  export let parameterOwner
  let items = []

  import { componentRegistry } from '../../helpers/componentRegistry.js'
  import RangedNumberParameterWidget from './RangedNumberParameterWidget.svelte'
  import StringParameterWidget from './StringParameterWidget.svelte'
  import BooleanParameterWidget from './BooleanParameterWidget.svelte'

  const {
    BooleanParameter,
    NumberParameter,
    StringParameter,
  } = window.zeaEngine

  componentRegistry.registerComponent((parameter) => {
    return parameter instanceof NumberParameter && parameter.getRange()
  }, RangedNumberParameterWidget)

  componentRegistry.registerComponent((parameter) => {
    return parameter instanceof StringParameter
  }, StringParameterWidget)

  componentRegistry.registerComponent((parameter) => {
    return parameter instanceof BooleanParameter
  }, BooleanParameterWidget)

  let index = 0
  $: parameterOwner.getParameters().forEach((parameter) => {
    console.log('parameter:', parameter.getName())
    const component = componentRegistry.selectComponent(parameter)
    if (component) {
      items.push({
        index,
        component,
        parameter,
      })
      index++
    }
  })

  afterUpdate(async () => {
    items = []
  })
</script>

<div
  class="ParameterOwnerWidget grid grid-cols-2 absolute w-120 top-0 right-0 overflow-hidden pointer-events-none space-y-2 m-2"
>
  {#each items as item (item.index)}
    {item.parameter.getName()}
    <div class="pointer-events-auto">
      <svelte:component this={item.component} parameter={item.parameter} />
    </div>
  {/each}
</div>
