import browser from 'webextension-polyfill';
import { createApp } from 'vue';
import VueSortable from 'vue3-sortablejs';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import ColorPicker from 'primevue/colorpicker';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber'
import Listbox from 'primevue/listbox';
import PrimeVue from 'primevue/config';
import Panel from 'primevue/panel';
import ScrollPanel from 'primevue/scrollpanel';
import SelectButton from 'primevue/selectbutton';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';
import ToggleButton from 'primevue/togglebutton';
import Toolbar from 'primevue/toolbar';
import Tooltip from 'primevue/tooltip';
import JsonEditorVue from 'json-editor-vue3';
import extension from '../extension';
import SetupSteps from '../components/SetupSteps.vue';
import ProfileTable from '../components/ProfileTable.vue';
import Options from '../views/options.vue';
import LoginLinks from '../components/LoginLinks.vue';
import AddAwsAccounts from '../components/AddAwsAccounts.vue';
import IamRoles from '../components/IamRoles.vue';
import 'primevue/resources/themes/lara-light-indigo/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

const app = createApp(Options);
app.use(PrimeVue);
app.use(VueSortable);
app.use(JsonEditorVue);
app.config.globalProperties.$browser = browser;
app.config.globalProperties.$ext = extension;
app.component('ColorPicker', ColorPicker);
app.component('DataTable', DataTable);
app.component('InputText', InputText);
app.component('InputNumber', InputNumber);
app.component('PAccordion', Accordion);
app.component('PAccordionTab', AccordionTab);
app.component('PBadge', Badge);
app.component('PCheckbox', Checkbox);
app.component('PColumn', Column);
app.component('PDialog', Dialog);
app.component('PDivider', Divider);
app.component('PListbox', Listbox);
app.component('PPanel', Panel);
app.component('PrimeButton', Button);
app.component('PScrollPanel', ScrollPanel);
app.component('PSelectButton', SelectButton);
app.component('PToolbar', Toolbar);
app.component('TabPanel', TabPanel);
app.component('TabView', TabView);
app.component('ToggleButton', ToggleButton);
app.directive('tooltip', Tooltip);
// Custom components
app.component('AddAwsAccounts', AddAwsAccounts);
app.component('IamRoles', IamRoles);
app.component('LoginLinks', LoginLinks);
app.component('ProfileTable', ProfileTable);
app.component('SetupSteps', SetupSteps);
app.mount('#app');
