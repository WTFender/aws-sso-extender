import browser from 'webextension-polyfill'
import extension from '../extension'
import Devtools from '../views/devtools.vue'
import { createApp } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const app = createApp(Devtools)
app.config.globalProperties.$browser = browser
app.config.globalProperties.$ext = extension
app.mount('#app')

// eslint-disable-next-line @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-argument
browser.devtools.panels.create(extension.config.name, '', 'src/devtools.html')
