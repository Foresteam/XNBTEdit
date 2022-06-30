import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import '../f-to-you-in-the-blue/theme.css';	//theme
import 'primevue/resources/primevue.min.css';					//core css
import ToastService from 'primevue/toastservice';				//toast
import 'primeicons/primeicons.css';								//icons
import '../f-to-you-in-the-blue/icons.css';						//icons
import '@/assets/common-styles.css'

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ToggleButton from 'primevue/togglebutton';
import Checkbox from 'primevue/checkbox';
import TriStateCheckbox from 'primevue/tristatecheckbox';

const app = createApp(App)

app.component('p-input-text', InputText);
app.component('p-button', Button);
app.component('p-toggle-button', ToggleButton);
app.component('p-checkbox', Checkbox);
app.component('p-tri-state-checkbox', TriStateCheckbox);

app.use(ToastService);
app.use(store);
app.use(router);
app.mount('#app');