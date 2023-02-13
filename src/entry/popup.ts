import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ProfileTable from '../components/ProfileTable.vue';
import App from '../view/popup.vue';
import 'primevue/resources/themes/lara-light-indigo/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

const app = createApp(App);
app.use(PrimeVue);
app.component('DataTable', DataTable);
// eslint-disable-next-line vue/multi-word-component-names
app.component('Column', Column);
app.component('InputText', InputText);
// eslint-disable-next-line vue/multi-word-component-names
app.component('PrimeButton', Button);
app.component('ProfileTable', ProfileTable);
app.mount('#app');
