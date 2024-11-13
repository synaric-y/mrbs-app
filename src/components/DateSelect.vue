<script setup>
import {onMounted, ref, toRef, watch} from "vue";
import { i18n } from '@/i18n/index';
import {twoDayDiff,dayTag} from '@/utils/timeTool.js'
import SvgIcon from "@/components/SvgIcon.vue";

// 常量，今天到14天以后
const minDate = ref(new Date())
const maxDate = ref(new Date())
maxDate.value.setDate(minDate.value.getDate() + 14)

// 双向绑定的属性
const props = defineProps(['currentDate'])
const emits = defineEmits(["update:currentDate","manualSelectDate"]); // 双向绑定

// 显示日历
const showDateSelect = ref(false)

const dateList = ref([])

const initDateList = ()=>{
  dateList.value = [] // 清空旧列表

  // 计算之后的14天
  for(let i=0;i<=14;i++){
    let temp = new Date(minDate.value);
    temp.setDate(minDate.value.getDate()+i);

    dateList.value.push({
      text: dayTag(temp),
      date: temp,
    })
  }
}

// const leftPosition = ref()
// const containerRef = ref(null)
// const contentRef = ref(null)
// const containerWidth = ref(1)

//
//
// let startX = ref(0)
// let startY = ref(0)
// let startPosition = ref(0)
// let isMove = false
// const scrollContentStart = (event)=>{
//   event.stopPropagation();
//   event.preventDefault();
//   startX = event.changedTouches[0].clientX
//   startY = event.changedTouches[0].clientY
//   startPosition = contentRef.value.offsetLeft
//   containerWidth.value = containerRef.value.clientWidth
//   isMove = false
//
// }
//
// const scrollContentMove = (event)=>{
//   event.stopPropagation();
//   event.preventDefault();
//
//   const moveX = event.targetTouches[0].clientX;
//   const moveY = event.targetTouches[0].clientY;
//
//
//   if(Math.abs(moveX - startX) > Math.abs(moveY - startY)){ //滚动了
//     isMove = true
//     let diff = moveX-startX
//     let temp = startPosition + diff
//
//     if(temp<-containerWidth.value||temp>0) return
//
//     leftPosition.value = temp
//   }
//
//
// }
//


// const scrollContentEnd = (event)=>{
//   event.stopPropagation();
//   event.preventDefault();
//
//   if(!isMove){
//     changeDate(dateList.value[nearestDateIdx(startX)].date)
//   }
// }


// 日历选择
const onConfirmDate = (value) => {
  showDateSelect.value = false;
  scrollDate(value) // 滚到选择的日期
  changeDate(value)
};

const changeDate = (val)=>{
  emits('update:currentDate',val)
  emits("manualSelectDate")
}

onMounted(()=>{
  initDateList() //初始化列表
  scrollDate(props.currentDate)
})


// ref DOM元素
const refContent = ref(null)
const refContainer = ref(null)


/**
 * 时间条容器左右滚动事件（惯性滚动版本）
 * 下层
 * 不冒泡
 * 阻止默认事件
 * */
const contentPositionLeft = ref(0) // X 轴的偏移距离, px
const animationCurve = ref('none') // 曲线类型
const animationDuration = ref(1) // 动画时间，s

var minX = 0 // 最小的left（负数，1/2个content的宽度）
var maxX = 0 // 最大的left（正数，20）

var isScrolling = false // 是否正用手指滚动
var startTime = 0; // 触发惯性滚动的起始时间
var startX = 0; // X 轴起始坐标
var startY = 0; // Y 轴起始坐标
var momentumStartX = 0; // 用于瞬时速度计算的滚动条位置
var deceleration = 0.003; // 惯性滚动的加速度常量
var momentumTimeThreshold = 300; // 触发惯性滚动的最大时长，ms
var momentumXThreshold = 15; // 触发惯性滚动的最小位移距离，px
var startPosition = 0 // 起始的滚动条位置
var isMove = false // 是否左右移动了

const durationMap = {
  'noBounce': 2.5,
  'weekBounce': 0.8,
  'strongBounce': 0.4,
};
const bounceRate = 10; // 回弹阻力
const bounceThreshold = 300; // 强弱回弹的分割值
const bezierMap = {
  'noBounce': 'cubic-bezier(.17, .89, .45, 1)',
  'weekBounce': 'cubic-bezier(.25, .46, .45, .94)',
  'strongBounce': 'cubic-bezier(.25, .46, .45, .94)',
};

const scrollDate = (beg)=>{
  let temp = (twoDayDiff(beg,minDate.value) / 15 * -1)  * (refContent.value.clientWidth)

  if(temp<-refContainer.value.clientWidth) temp = - refContainer.value.clientWidth
  if(temp>0) temp = 0

  contentPositionLeft.value = temp
}

const stop = ()=>{
  // 获取当前 translate 的位置
  const matrix = window.getComputedStyle(refContent.value).getPropertyValue('left');
  const idx = matrix.indexOf('px')
  contentPositionLeft.value = Math.round(+matrix.substring(0, idx))
}

const scrollContentStart = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  isScrolling = true
  isMove = false

  // 动态计算一下边界
  minX = (-1/2*refContent.value.clientWidth)
  maxX = 0

  stop()

  startTime = event.timeStamp;
  startX = event.changedTouches[0].clientX;
  startY = event.changedTouches[0].clientY;
  momentumStartX = startPosition = contentPositionLeft.value
}

const scrollContentMove = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!isScrolling) return

  const deltaX = event.changedTouches[0].clientX - startX
  const deltaY = event.changedTouches[0].clientY - startY

  if(Math.abs(deltaX) > Math.abs(deltaY)) isMove = true


  // 浮点数坐标会影响渲染速度
  let finalX = Math.round(startPosition + deltaX);

  // 超出边界时增加阻力，只增加三分之一的位移
  if (finalX > maxX || finalX < minX) {
    finalX = Math.round(startPosition + deltaX/3);
  }

  // 改坐标
  contentPositionLeft.value = finalX

  // 慢滚动重置初始时间和位置
  if (event.timeStamp - startTime > momentumTimeThreshold) {
    startTime = event.timestamp;
    momentumStartX = finalX;
  }

}

// 超出边界时需要重置位置
const isNeedReset=()=>{

  let finalX = contentPositionLeft.value

  if (finalX > 0) {
    finalX = 0
  }else if (finalX < (-1/2*refContent.value.clientWidth)) {
    finalX = (-1/2*refContent.value.clientWidth)
  }

  if(finalX !== contentPositionLeft.value){ // 最终计算的超出了边界
    contentPositionLeft.value = finalX
    animationDuration.value = 0.5
    animationCurve.value = 'cubic-bezier(.165, .84, .44, 1)'
    return true;
  }

  return false;
}

// 计算滑动/回弹函数
const momentum = (current, start, duration)=>{

  let type = 'noBounce';

  const maxOverflowX = refContent.value.clientWidth / 6; // 回弹的最大限度

  let overflowX;

  const distance = current - start;
  const speed = Math.abs(distance) / duration;

  let destination = current + 2 * speed / deceleration * (distance < 0 ? -1 : 1);


  const minX = (-1/2*refContent.value.clientWidth)
  const maxX = 0

  if (destination < minX) {
    overflowX = minX - destination;
    type = overflowX > bounceThreshold ? 'strongBounce' : 'weekBounce';
    destination = Math.max(minX - maxOverflowX, minX - overflowX / bounceRate);
  } else if (destination > maxX) {
    overflowX = destination - maxX;
    type = overflowX > bounceThreshold ? 'strongBounce' : 'weekBounce';
    destination = Math.min(maxX + maxOverflowX, maxX + overflowX / bounceRate);
  }

  return {
    destination,
    duration: durationMap[type],
    bezier: bezierMap[type],
  };
}

const nearestDateIdx = (x)=>{
  let temp = Math.round((x - startPosition) / refContent.value.clientWidth * 15) - 1
  if(temp<0) temp = 0
  if(temp>14) temp = 14
  console.log(temp)
  return temp
}

const scrollContentEnd = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!isScrolling) return
  isScrolling = false // 不再用手指滚动了

  if(!isMove){
    changeDate(dateList.value[nearestDateIdx(startX)].date)
  }


  if (isNeedReset()) return;

  var endX = event.changedTouches[0].clientX;
  var duration = event.timeStamp - startTime; // 瞬时时间
  var s1 = endX - startX; // 瞬时位移
  var absDeltaX = Math.abs(s1)

  // 启动惯性滑动
  if (duration < momentumTimeThreshold && absDeltaX > momentumXThreshold) {
    const pack = momentum(contentPositionLeft.value, momentumStartX, duration);
    contentPositionLeft.value = Math.round(pack.destination);
    animationDuration.value = pack.duration;
    animationCurve.value = pack.bezier;
  }
}

const onTransitionEnd = ()=>{
  isNeedReset();
}


</script>

<template>
  <div class="date-wrapper">
    <div class="date-container" ref="refContainer">
      <div class="date-content"
           ref="refContent"
           :style="{left:contentPositionLeft+'px',transition:'left '+animationCurve+' '+animationDuration+'s'}"
           @touchstart="scrollContentStart"
           @touchmove="scrollContentMove"
           @touchend="scrollContentEnd"
           @transitionend="onTransitionEnd"
      >
        <div
            :class="{date:true,'date-selected':twoDayDiff(currentDate,item.date)===0}"
            v-for="(item,i) in dateList"
            :key="i"
            @touchstart="scrollContentStart"
            @touchmove="scrollContentMove"
            @touchend="scrollContentEnd"
            @transitionend="onTransitionEnd"
        >
          <div class="text">{{$t(item.text)}}</div>
          <div class="text">{{item.date.getDate()}}</div>
          <div class="decorate"></div>
        </div>

      </div>
    </div>

    <div class="icon">
      <SvgIcon name="calendar" width="1.5rem" height="1.5rem" @click="showDateSelect=true"/>
    </div>
  </div>
  <van-calendar class="van-safe-area-bottom"
                style="color:var(--van-text-color)"
                v-model:show="showDateSelect"
                :min-date="minDate"
                :max-date="maxDate"
                :default-date="currentDate"
                @confirm="onConfirmDate"
                color="#591bb7"/>

</template>

<style scoped lang="scss">

.date-wrapper{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .date-container{
    position: relative;
    width: 100%;
    overflow: hidden;
    height: 3.5rem;

    .date-content{
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      width: 200%;
      font-size: 0.75rem;

      .date{
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        gap: 0.4rem;
        color: var(--color-regular-text);
        transition: background-color linear 0.35s;



        .decorate{
          background-color: transparent;
          height: 0.2rem;
          width: 90%;

          //border-radius: 0.15rem;
          transition: background-color linear 0.35s;
        }
      }

      .date-selected{
        color: var(--color-selected);

        .decorate{
          background-color: var(--color-selected);
        }
      }
  }


  }

  .icon{
    width: 3rem;
    height: 100%;
    font-size: 1rem;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}
</style>