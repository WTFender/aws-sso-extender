import browser from 'webextension-polyfill';
import { createApp } from 'vue';
import extension from '../extension';
import Devtools from '../views/devtools.vue';

const app = createApp(Devtools);
app.config.globalProperties.$browser = browser;
app.config.globalProperties.$ext = extension;
app.mount('#app');

browser.devtools.panels.create(extension.config.name, '', 'src/devtools.html');
