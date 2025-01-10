<script setup>

import {wxLoginApi} from "@/api/login.js";
import { useRouter } from 'vue-router'
import {ref} from 'vue'
import {i18n} from "@/i18n/index.js";
import { gotoPage,redirectTo } from "@/utils/router";

const router = useRouter()

const msg = ref('')
const url = ref(window.location.href)



const code = ref(false)
const area_id = ref(false)
const room_id = ref(false)


const getCode=()=>{
	const codeIdx = url.value.indexOf('code=')
	
	if(codeIdx!==-1){
	  const realCodeIdx = codeIdx+5
	  const realCode = url.value.substring(realCodeIdx)
	  code.value = realCode
	}
}


function isNumber(c){
	return (c>='0'&&c<='9')
}


const getRoomID=()=>{
	let roomIdx = url.value.indexOf('room_id=')
	roomIdx += 'room_id='.length
	
	let idStr = ''
	
	while(isNumber(url.value[roomIdx])){
		idStr += url.value[roomIdx]
		roomIdx += 1
	}
	
	const res = parseInt(idStr)
	console.log(res);
	
	return res
}

const getAreaID=()=>{
	let areaIdx = url.value.indexOf('area_id=')
	areaIdx += 'area_id='.length
	
	let idStr = ''
	
	while(isNumber(url.value[areaIdx])){
		idStr += url.value[areaIdx]
		areaIdx += 1
	}
	
	const res = parseInt(idStr)
	console.log(res);
	
	return res
}

getCode()
area_id.value = getAreaID()
room_id.value = getRoomID()

wxLoginApi(code.value)
    .then(res=>{
      console.log(res)
      msg.value = res
      if(res && (res.code === 0 || res.code === 1 || res.code === 200)){
		  
		
		if(!area_id.value || !room_id.value){ // 没有房间或区域信息
			redirectTo('../index/index')
		}else{ // 前往详情页
			redirectTo('../detail/detail',{
				room_id: room_id.value,
				time: new Date().getTime(), // 现在时间(ms)
				area_name: 'all', // 全部
				area_id: area_id.value
			})
		}
		  
        
      }
    })
    .catch(err=>{
      console.log(err)
      msg.value = err

      // router.replace({ path: '/room' })
    })

</script>

<template>
<!-- <p>{{msg}}</p>
<p>当前地址：{{url}}</p>
<p>当前code：{{code}}</p>
<p>当前area_id：{{area_id}}</p>
<p>当前room_id：{{room_id}}</p> -->

  <div class="page">
    <div class="welcome">{{$t('login.hello')}}</div>
    <div class="welcome">{{$t('login.welcome')}}</div>
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