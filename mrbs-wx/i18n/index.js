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



const initialLanguage =  uni.getStorageSync('lang') || 'zh'


const i18n = createI18n({
    legacy: false,
    locale: initialLanguage,
    globalInjection: true,
    messages,
});
export {i18n};