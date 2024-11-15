<script setup>
import {
  begEndTime,
  generateTimeSequence,
  getNearestNextTime,
  twoDayDiff
} from "@/utils/timeTool.js";
import {onMounted, ref, watch} from "vue";
import {showToast} from 'vant';
import 'vant/es/toast/style'
import SvgIcon from "@/components/SvgIcon.vue";
import { i18n } from '@/i18n/index';
import _ from "lodash";


const fringe = 12 // 左右两边的安全区

const props = defineProps(['lb','ub','meetings','currentDate','scale','full'])
const emits = defineEmits(['update:full','clicked']) // 双向绑定
// 转换成ref变量
const scaleFloat = ref(props.scale / 60) // 30分钟-》0.5 15分钟-》0.25
const timeTable = ref([]);
const span = ref(props.ub-props.lb)
const hrArray = ref([])

onMounted(()=>{


  // 初始化刻度
  hrArray.value = generateTimeSequence(props.lb,props.ub)

  // console.log(timeTable.value)

  // 处理每个会议的开始结束时间，转为24小时制
  // for(let i =0; i<props.meetings.length; i++){
  //   const temp = begEndTime(timeTable.value[i].duration)
  //   timeTable.value[i].leftHr = temp[0]
  //   timeTable.value[i].rightHr = temp[1]
  // }
  timeTable.value = []
  _.forEach(props.meetings, (meeting)=>{
    const temp = begEndTime(meeting.duration)
    timeTable.value.push({
      leftHr: temp[0],
      rightHr: temp[1],
      status: meeting.status
    })
  })

  // 如果是今天，将先前的几个小时清掉
  invalidatePast()

  // 初始化滚动到当前时间
  if(twoDayDiff(props.currentDate,new Date())===0){
    autoScrollToHr(new Date().getHours())
  }

  const full = isFull()
  emits('update:full',full)
})


/*================先前时间失效==================*/
const invalidatePast = ()=>{
  if(twoDayDiff(props.currentDate,new Date())===0){ // 当前日期是今天
    const endHr = getNearestNextTime(new Date(),props.scale)
    timeTable.value.unshift({
      leftHr: props.lb,
      rightHr: endHr,
      status: 2
    })
  }
}


/**
 * 时间条自动滚动到...
 * */
const autoScrollToHr = (hr)=>{


  // 在可约时间外进入页面，页面滚到头
  if(hr<props.lb){
    hr=props.lb
  }

  if(hr>props.ub){
    hr=props.ub
  }

  let left2 = (hr-props.lb)/span.value*refContent.value.clientWidth  // 已过去的时间（px单位）
  let left1 = refContainer.value.clientWidth/2  // 窗口的一半


  let temp = -(left2 - left1)

  if(temp>fringe) temp=fringe // 禁止正数的left，但留有余地
  if(temp<(-1/2*refContent.value.clientWidth)-fringe) temp=(-1/2*refContent.value.clientWidth)-fringe // 禁止太左移了

  if(hr===props.lb+scaleFloat.value){//一天刚开始
    temp = 0
  }

  contentPositionLeft.value = temp

}

/*============判断是否约满===================*/
const isRightHandleValid = (right)=>{
  if(right > props.ub) return false // 检查是否越界

  for(let i =0; i<timeTable.value.length; i++){
    if (right > timeTable.value[i].leftHr && right <= timeTable.value[i].rightHr) return false
  }

  return true
}

const isFull = ()=>{

  let leftHr = props.lb
  let rightHr = leftHr + 0.5

  if(isRightHandleValid(rightHr)) return false

  for(let i =0; i<timeTable.value.length; i++){
    leftHr = timeTable.value[i].rightHr // 尝试从各个时间段的右边开始
    rightHr = leftHr + scaleFloat

    if(isRightHandleValid(rightHr)) return false
  }

  return true
}



/*==============样式计算函数============*/

// 根据真实值计算左侧定位百分比
const handlePosition = (val) => {
  return ((val - props.lb) / span.value * 100) + '%'
}

// 根据下标计算左侧定位百分比
const handlePositionIndex = (idx) => {
  return (idx / span.value * 100) + '%'
}

// 根据真实值计算宽度
const handleWidth = (leftVal,rightVal) => {
  return ((rightVal - leftVal) / span.value * 100) + '%'
}

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
var momentumStartX = 0; // 用于瞬时速度计算的滚动条位置
var deceleration = 0.003; // 惯性滚动的加速度常量
var momentumTimeThreshold = 300; // 触发惯性滚动的最大时长，ms
var momentumXThreshold = 15; // 触发惯性滚动的最小位移距离，px
var startPosition = 0 // 起始的滚动条位置

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

  // 动态计算一下边界
  minX = (-1/2*refContent.value.clientWidth)-fringe
  maxX = fringe

  stop()

  startTime = event.timeStamp;
  startX = event.changedTouches[0].clientX;
  momentumStartX = startPosition = contentPositionLeft.value
}

const scrollContentMove = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!isScrolling) return

  const deltaX = event.changedTouches[0].clientX - startX

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

  if (finalX > fringe) {
    finalX = fringe
  }else if (finalX < (-1/2*refContent.value.clientWidth)-fringe) {
    finalX = (-1/2*refContent.value.clientWidth)-fringe
  }

  if(finalX !== contentPositionLeft.value){ // 最终计算的超出了边界
    contentPositionLeft.value = finalX
    animationDuration.value = scaleFloat.value
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


  const minX = (-1/2*refContent.value.clientWidth)-fringe
  const maxX = fringe

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

const scrollContentEnd = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!isScrolling) return
  isScrolling = false // 不再用手指滚动了


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
  <div>
    <div class="timeline">

      <div class="timeline-bar-container" ref="refContainer">

        <div class="timeline-content"
             ref="refContent"
             :style="{left:contentPositionLeft+'px',transition:'left '+animationCurve+' '+animationDuration+'s'}"
             @touchstart="scrollContentStart"
             @touchmove="scrollContentMove"
             @touchend="scrollContentEnd"
             @transitionend="onTransitionEnd"
        >
          <div class="timeline-bar">
            <div :class="{
                    'period':true,
                    'to-start':item.status===0,
                    'in-progress':item.status===1,
                    'disabled':item.status===2
                  }"
                 v-for="(item,i) in timeTable"
                 :key="i"
                 :style="{
                   left:handlePosition(item.leftHr),
                   width:handleWidth(item.leftHr,item.rightHr)
                 }"
            />
          </div>
          <div class="timeline-scale">
            <div class="number" v-for="(item,i) in hrArray" :style="'left:'+handlePositionIndex(i)" :key="item">{{item}}</div>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<style scoped lang="scss">

.timeline{
  width: 100%;
  display: flex;
  flex-direction: column;

  .timeline-bar-container{
    width: 100%;
    height: 3.5rem;
    overflow: hidden;
    position: relative;

    .timeline-content{
      width: 200%;
      position: relative;

      .timeline-bar{
        position: relative;
        background-color: var(--color-default);
        height: 1rem;
        border-radius: 0.5rem;
        width: 100%;
        margin-top: 0.5rem;

        .period{
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 0.5rem;
          background-color: var(--color-disabled);
        }
        .to-start{
          background-color: var(--color-primary-light);
        }

        .disabled{
          background-color: var(--color-disabled);
        }

        .in-progress{
          background-color: var(--color-danger-light);
        }


      }



      .timeline-scale{
        height: 1.5rem;
        width: 100%;
        position: relative;
        //display: flex;
        //flex-direction: row;
        //justify-content: space-between;

        .number{
          position: absolute;
          top: 0;
          left: 0;
          line-height: 2;
          font-size: 0.7rem;
          color: #b0b0b0;
          transform: translateX(-50%);
        }

        .number:first-of-type,.number:last-of-type{
          transform: none;
        }

      }

      }
    }

  }

</style>