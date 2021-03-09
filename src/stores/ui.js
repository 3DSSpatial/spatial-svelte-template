import { writable } from 'svelte/store'

const ui = writable({ shouldShowDrawer: window.innerWidth >= 1024 })

export { ui }
