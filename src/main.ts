// Vue main file

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

import '../f-to-you-in-the-blue/theme.css';						// theme
import 'primevue/resources/primevue.min.css';					// core css
import 'primeicons/primeicons.css';								// icons
import '../f-to-you-in-the-blue/icons.css';						// my icons
import '@/assets/common-styles.css'								// :)

import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ToggleButton from 'primevue/togglebutton';
import Checkbox from 'primevue/checkbox';
import TriStateCheckbox from 'primevue/tristatecheckbox';
import InputSwitch from 'primevue/inputswitch';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';

const app = createApp(App);

app.component('p-input-text', InputText);
app.component('p-button', Button);
app.component('p-toggle-button', ToggleButton);
app.component('p-checkbox', Checkbox);
app.component('p-tri-state-checkbox', TriStateCheckbox);
app.component('p-input-switch', InputSwitch);
app.component('p-confirm-dialog', ConfirmDialog);
app.component('p-toast', Toast);

app.use(PrimeVue);
app.use(ConfirmationService);
app.use(ToastService);
app.use(createPinia());
app.use(router);
app.mount('#app');