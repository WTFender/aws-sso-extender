import { createApp } from 'vue';
import extension from '../extension';
import Devtools from '../views/devtools.vue';

const app = createApp(Devtools);
app.config.globalProperties.$ext = extension;
app.mount('#app');

extension.config.browser.devtools.panels.create(extension.config.name, '', 'src/devtools.html');
