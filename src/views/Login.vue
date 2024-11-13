<script setup>

import {wxOauth2Url} from "@/api/index.js";
import {ref} from 'vue'

const msg=ref('')
console.log('login')
wxOauth2Url()
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
    <div class="welcome">{{$t('hello')}}</div>
    <div class="welcome">{{$t('welcome')}}</div>
    <div>{{msg}}</div>
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
}

</style>