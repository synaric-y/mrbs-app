<script setup>

import {wxLoginApi} from "@/api/index.js";
import { useRouter } from 'vue-router'
import {ref} from 'vue'
import {getQueryVariable} from "@/utils/tool.js";
import {i18n} from "@/i18n/index.js";

const router = useRouter()

const msg = ref('')
const url = ref(window.location.href)
const code = ref(false)

const codeIdx = url.value.indexOf('code=')

if(codeIdx!==-1){
  const realCodeIdx = codeIdx+5
  const realCode = url.value.substring(realCodeIdx)
  code.value = realCode
}



wxLoginApi(code.value)
    .then(res=>{
      console.log(res)
      msg.value = res
      if(res && (res.code === 0 || res.code === 1 || res.code === 200)){
        router.replace({ path: '/room' })
      }
    })
    .catch(err=>{
      console.log(err)
      msg.value = err

      // router.replace({ path: '/room' })
    })

</script>

<template>
<!--<p>{{msg}}</p>-->
<!--<p>当前地址：{{url}}</p>-->
<!--<p>当前code：{{code}}</p>-->

  <div class="page">
    <div class="welcome">{{$t('hello')}}</div>
    <div class="welcome">{{$t('welcome')}}</div>
  </div>
</template>

<style scoped lang="scss">
p{
  padding: 1rem;
  word-break: break-all;
}

.page{

  padding: 6rem 0 0 2rem;

  .welcome{
    font-size: 1.75rem;
    color: #6d37bf;
    line-height: 1.75;
    font-weight: 700;
  }
}

</style>