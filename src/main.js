import { createApp } from 'vue'
import App from './App.vue'
import router from './routes'
import { Icon } from 'vant'; // vant图标全局注册
import {i18n} from './i18n'; // i18n的配置文件路径
import './assets/base.css' // 全局样式

// svg图标注册
import 'virtual:svg-icons-register'

createApp(App).use(router).use(Icon).use(i18n).mount('#app')

