<script setup>
import {ref} from 'vue'
import { getStorage, saveStorage } from "@/utils/storage";
import { useI18n } from "vue-i18n";
const { locale } = useI18n();

// vant 语言切换
import { Locale } from 'vant';

import enUS from 'vant/es/locale/lang/en-US'; // 引入英文语言包
import zhCN from 'vant/es/locale/lang/zh-CN'; // 引入中文语言包

import SvgIcon from '@/components/SvgIcon.vue'


// 语言选择
const columns = [
  { text: '简体中文', value: 'zh' },
  { text: 'English', value: 'en' },
];
const showLanguagePicker = ref(false)
const initValue = ref([locale.value || getStorage("lang")])


const onConfirm = ({ selectedValues }) => {
  locale.value = selectedValues[0];
  saveStorage("lang", selectedValues[0]);

  if(locale.value === 'en') Locale.use('en-US', enUS);
  else Locale.use('zh-CN', zhCN);

  showLanguagePicker.value = false
};
</script>

<template>
<!--  <van-icon name="setting-o" @click="showLanguagePicker=true"/>-->
  <SvgIcon name="lang" width="1.3rem" height="1.3rem" @click="showLanguagePicker=true"/>
  <van-popup v-model:show="showLanguagePicker" round position="bottom" :style="{ height: '50%' }" teleport="body">
    <van-picker
        :columns="columns"
        :value="initValue"
        @cancel="showLanguagePicker = false"
        @confirm="onConfirm"
    />
  </van-popup>
</template>

<style scoped lang="scss">

</style>