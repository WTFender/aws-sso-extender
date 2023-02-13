import { createApp } from 'vue';
import App from '../view/devtools.vue';
import extension from '../extension';

chrome.devtools.panels.create(extension.config.name, '', 'devtools.html');
createApp(App).mount('#app');
