<script setup>

import {ref} from 'vue'
import {dayTextTs,ymdFormatTs} from '@/utils/dateTool.js'
import {ts2hhmm,tsDiff2hms} from '@/utils/timeCoersionTool.js'
import {i18n} from "@/i18n/index.js";

const props = defineProps(['begTime','endTime','desc','type','isRepeat'])
defineEmits(['edit','cancel','force_end'])

const typeClasses = ['to-start','in-progress','finished','canceled']


</script>

<template>
  <div class="card-content" @click.stop="$emit('edit')">
    <div :class="['decor',typeClasses[type]]"></div>
    <div class="content">
      <div class="title">
       <span class="text">{{dayTextTs(begTime)}}</span>
        <span class="text">{{ymdFormatTs(begTime)}}</span>
        <span class="text">{{ts2hhmm(begTime)+' - '+ts2hhmm(endTime)}},</span>
        <span class="text">{{tsDiff2hms(begTime,endTime)}}</span>

      </div>
      <div class="desc">{{desc || $t('meeting.noDesc')}}</div>
    </div>
	<div class="opers" v-if="type!==2">
		<div class="oper oper-edit" @click.stop="$emit('edit')">{{$t('common.button.edit')}}</div>
		<div class="oper" @click.stop="$emit('cancel')">{{$t('common.button.cancel')}}</div>
		<div v-if="type===1" class="oper" @click.stop="$emit('force_end')">{{$t('common.button.force_end')}}</div>
	</div>
    <template v-if="isRepeat">
      <div :class="['triangle',type===2?'triangle-finished':'']">

      </div>
      <div class="icon-container">
        <uni-icons color="#ffffff" type="calendar" size="18"></uni-icons>
      </div>
    </template>
	

  </div>
</template>

<style scoped lang="scss">
/* 媒体查询: 宽屏，显示操作按钮 */
@media screen and (min-width: 1024px) {
	.opers{
		display: flex;
	}
}

/* 媒体查询: 窄屏，隐藏操作按钮 */
@media screen and (max-width: 1024px) {
	.opers{
		display: none!important;
	}
}
	
.card-content{
  background-color: var(--color-background-card);
  height: 5rem;
  border: 0.05rem solid var(--color-border);
  border-bottom: 0.2rem solid var(--color-border);
  display: flex;
  position: relative;

  .triangle{
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 2rem 2rem 0;
    border-color: transparent var(--color-primary-light) transparent transparent;
  }


  .triangle-finished{
    border-color: transparent var(--color-disabled) transparent transparent;
  }


  .icon-container{
    position: absolute;
    top: -2px;
    right: 2px;
  }

  .decor{
    background-color: var(--color-primary-light);
    width: 1rem;
    height: 100%;
    margin-right: 1rem;
  }

  .in-progress {
    background-color: var(--color-danger-light);
  }

  .to-start{
    background-color: var(--color-primary-light);
  }

  .finished{
    background-color: var(--color-disabled);
  }

  .canceled{
    background-color: var(--color-canceled);
  }

  .content{
    display: flex;
	flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 0.6rem;
    height: 100%;
    font-weight: 700;
    color: var(--color-regular-text);
	cursor: default;


    .title{

      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;

      .text{
        vertical-align: middle;
      }
    }

    .desc{
      font-size: 0.75rem;
    }
  }
  
  
  
  .opers{
	  flex-shrink: 0;
	  display: flex;
	  align-items: center;
	  gap: 1rem;
	  margin-right: 1rem;
	  font-size: 1.05rem;
	  
	  .oper{
		  cursor: pointer;
		  color: var(--color-danger);
	  }
	  
	  .oper-edit{
		  color: var(--color-primary);
	  }
	  
	  .oper:hover{
	  	text-decoration: underline;
	  }
  }
}

.card-content:hover{
	  background-color: #fcfcfc;
  }
</style>