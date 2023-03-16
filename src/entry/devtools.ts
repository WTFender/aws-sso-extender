/* eslint-disable import/order */
/* eslint-disable import/first */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const browser = require('webextension-polyfill');

import extension from '../extension';
import { createApp } from 'vue';
// eslint-disable-next-line import/no-extraneous-dependencies
import JsonViewer from 'vue-json-viewer';
import App from '../view/devtools.vue';

const app = createApp(App);
app.config.globalProperties.$browser = browser;
app.config.globalProperties.$ext = extension;
app.component('JsonViewer', JsonViewer);
app.mount('#app');

browser.devtools.panels.create(extension.config.name, '', 'devtools.html');
