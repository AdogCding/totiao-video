import {createApp} from "vue";
import Toutiao from './component/Toutiao.vue'
import * as Antd  from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'


createApp(Toutiao)
    .use(Antd)
    .mount("#app")