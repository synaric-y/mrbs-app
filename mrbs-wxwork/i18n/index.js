import { createI18n } from "vue-i18n";
import {getStorage} from "@/utils/storage.js";

// 语言包
import zhLocale from './lang/zh/base.json'
import enLocale from "./lang/en/base.json";
import koLocale from './lang/ko/base.json'

const messages = {
	"zh": zhLocale,
	"en": enLocale,
	"ko": koLocale,
}

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
const isZh = initialLanguage.indexOf('zh')!==-1

const finalLocale = isZh?'zh':language.substring(0,2)

console.log(finalLocale,uni.getLocale())

const i18n = createI18n({
    legacy: false,
    locale: finalLocale,
    globalInjection: true,
    messages,
});
export {i18n};