<script setup>

import {wrappedWxOauth2Url} from "@/api/login.js";
import {ref} from 'vue'
import { gotoPage } from "@/utils/router"
import {
	useRoute
} from 'vue-router';

const route = useRoute() // 获取参数

const room_id = ref(route.query.room_id) // 平板端传入房间id
const area_id = ref(route.query.area_id) // 平板端传入区域id

const msg=ref('')


wrappedWxOauth2Url(room_id,area_id)
    .then(res=>{
      window.location.replace(res)
      // window.location.href = res
    })
    .catch(err=>{
      console.log(err)
      msg.value = err
    })

</script>

<template>
  <div class="page">
    <div class="welcome">{{$t('login.hello')}}</div>
    <div class="welcome">{{$t('login.welcome')}}</div>
    <div class="msg">{{msg}}</div>
  </div>
</template>

<style scoped lang="scss">
.page{

  padding: 6rem 0 0 2rem;

  .welcome{
    font-size: 1.75rem;
    color: #6d37bf;
    line-height: 1.75;
    font-weight: 700;
  }
  
  .msg{
	  word-wrap: break-word;
	  word-break: break-all;
  }
}

</style>