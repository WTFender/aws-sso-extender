import { createApp } from 'vue';
import App from '../view/devtools.vue';

// eslint-disable-next-line no-undef
chrome.devtools.panels.create('ext-testproj', '', 'devtools.html');
createApp(App).mount('#app');
