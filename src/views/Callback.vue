<script setup>

import {wxLoginApi} from "@/api/index.js";
import { useRouter } from 'vue-router'
import {ref} from 'vue'
import {getQueryVariable} from "@/utils/tool.js";
import {i18n} from "@/i18n/index.js";

const router = useRouter()

const msg = ref('')

wxLoginApi(getQueryVariable('code'))
    .then(res=>{
      console.log(res)
      msg.value = res
      if(res && (res.code === 0 || res.code === 1 || res.code === 200)){
        msg.value = i18n.global.t('login.success')
        router.replace({ path: '/room' })
      }else{
        msg.value = i18n.global.t('login.fail')
      }
    })
    .catch(err=>{
      console.log(err)
      msg.value = err

      // if(err.message.indexOf('already login')!==-1){ // 已登录
      //   router.replace({ path: '/room' })
      // }

      // router.replace({ path: '/room' })
    })

</script>

<template>
<div>{{msg}}</div>
</template>

<style scoped lang="scss">

</style>