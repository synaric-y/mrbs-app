<script setup>
import {wxLoginApi} from '@/api/login.js'
import {ref} from 'vue'
import { gotoPage } from "@/utils/router"

wx.login({
			  success (res) {
			    if (res.code) {
			      //发起网络请求
				  wxLoginApi(res.code)
				  .then(res=>{
					  console.log(res);
					  uni.redirectTo({
					  	url:'/pages/index/index'
					  })
				  })
				  .catch(e=>{
					  console.log(e);
				  })
			      
			    } else {
			      console.log('登录失败！' + res.errMsg)
			    }
			  }
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