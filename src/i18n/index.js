import { createI18n } from "vue-i18n";

// 语言包
import zh from "./lang/zh/base";
import en from "./lang/en/base";
import {getStorage} from "@/utils/storage.js";

// vant 语言切换
import { Locale } from 'vant';

import enUS from 'vant/es/locale/lang/en-US'; // 引入英文语言包
import zhCN from 'vant/es/locale/lang/zh-CN'; // 引入中文语言包

//创建messages对象，里面注册相应的语言包，这里面我注册了自己定义的语言包
const messages = {
    zh: {
        ...zh
    },
    en: {
        ...en
    },
};

// localStorage的语言
const getLanguage = () => {
    console.log(getStorage('lang'))
    return getStorage('lang')
};

// 浏览器的语言
const language = (
    (navigator.language ? navigator.language : navigator.userLanguage)
).toLowerCase();

const initialLanguage =  language || getLanguage() || 'zh'
const isZh = initialLanguage.indexOf('zh')!==-1  // 语言的唯一布尔值，true就是中文

// vant
if(isZh) Locale.use('zh', zhCN);
else Locale.use('en', enUS);

// 业务代码初始语言
const i18n = createI18n({
    legacy: false, // 使用composition API
    locale: isZh?'zh':'en', //初始的时候调用这个函数获取localstorage中存储的数据，或者默认赋值为”zh“
    globalInjection: true, // 表明使用全局t函数
    messages,
});
export {i18n};//将i18函数导出