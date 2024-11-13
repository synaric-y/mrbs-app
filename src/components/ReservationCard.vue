<script setup>

import {ref} from 'vue'
import {dayTag, timestampDiff, timestampHourFormat, ymdFormat} from "@/utils/timeTool.js";
import {i18n} from "@/i18n/index.js";

const props = defineProps(['begTime','endTime','desc','type','isRepeat'])


const typeClasses = ['to-start','in-progress','finished','canceled']
const tagMapping = ['day.yesterday','day.today','day.tomorrow']


const date = ref(ymdFormat(new Date(props.begTime*1000)))  // 只显示，用横线没事

// const dayText = ref(i18n.global.t(dayTag(new Date(props.begTime*1000))))

const timespan=ref(timestampDiff(parseInt(props.begTime),parseInt(props.endTime)))

const hm1 = ref(timestampHourFormat(props.begTime))
const hm2 = ref(timestampHourFormat(props.endTime))



</script>

<template>
  <div class="card-content">
    <div :class="['decor',typeClasses[type]]"></div>
    <div class="content">
      <div class="title">
<!--        <span class="text">{{dayText}}</span>-->
        <span class="text">{{date}}</span>
        <span class="text">{{hm1}}-{{hm2}},</span>
        <span class="text">{{timespan}}</span>

      </div>
      <div class="desc">{{desc || $t('meeting.noDesc')}}</div>
    </div>
    <template v-if="isRepeat">
      <div :class="['triangle',type===2?'triangle-finished':'']">

      </div>
      <div class="icon-container">
        <van-icon name="underway" color="#fff" size="12px" />
      </div>
    </template>


  </div>
</template>

<style scoped lang="scss">
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
    flex-direction: column;
    justify-content: center;
    gap: 0.6rem;
    height: 100%;
    font-weight: 700;
    color: var(--color-regular-text);


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
}
</style>