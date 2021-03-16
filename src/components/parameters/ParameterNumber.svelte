<script>
  export let parameter

  const UI_MAX = 200
  const UI_MIN = 0
  let value = 0

  let min = parameter.getRange()[0]
  let max = parameter.getRange()[1]
  $: step = parameter.getStep() || 1

  const round = (n, decimals = 6) =>
    Number(Math.round(Number(`${n}e${decimals}`)) + `e-${decimals}`)

  const setValue = () => {
    value = ((parameter.getValue() - min) / (max - min)) * UI_MAX
  }

  const handleChange = (event) => {
    value = round(event.target.valueAsNumber)

    value = min + (value / UI_MAX) * (max - min)

    parameter.setValue(value)
  }

  parameter.on('valueChanged', (event) => {
    setValue()
  })

  parameter.on('rangeChanged', (event) => {
    min = parameter.getMin()
    max = parameter.getMax()
  })
</script>

<input
  max={UI_MAX}
  min={UI_MIN}
  on:input={handleChange}
  {step}
  type="range"
  {value}
/>

<div>
  {value}
</div>
