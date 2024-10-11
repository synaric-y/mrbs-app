<script setup>
import {
  begEndTime,
  generateTimeSequence,
  getNearestNextTime,
  hourFormat,
  hrDiff,
  twoDayDiff,
  getNearestScale
} from "@/utils/timeTool.js";
import {onMounted, ref, watch} from "vue";
import {showToast} from 'vant';
import 'vant/es/toast/style'
import SvgIcon from "@/components/SvgIcon.vue";
import { i18n } from '@/i18n/index';

const fringe = 20 // 左右两边的安全区

const props = defineProps(['lb','ub','meetings','leftHandle','rightHandle','currentDate','disabled','isFirst','scale'])
const emits = defineEmits(["update:leftHandle","update:rightHandle","update:disabled"]);

// 转换成ref变量
const scaleFloat = ref(props.scale / 60) // 30分钟-》0.5 15分钟-》0.25
const timeTable = ref(props.meetings); // 保持响应式连接
const refTimeline = ref(null) // 时间轴dom对象
const span = ref(props.ub-props.lb)
const hrArray = ref([])
const zoomIn = 500
const zoomConstant = - (zoomIn/100-1)/(zoomIn/100)

onMounted(()=>{

  console.log(props.meetings)

  // 初始化刻度
  hrArray.value = generateTimeSequence(props.lb,props.ub)

  // 处理每个会议的开始结束时间，转为24小时制
  for(let i =0; i<timeTable.value.length; i++){
    const temp = begEndTime(timeTable.value[i].duration)
    timeTable.value[i].leftHr = temp[0]
    timeTable.value[i].rightHr = temp[1]
  }

  // 如果是今天，将先前的几个小时清掉
  invalidatePast()

  // 初始化手柄
  getInitialHandle()

  // 初始化滚动(编辑状态)
  // autoScrollToHr(props.rightHandle)
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

/*================初始化手柄==================*/
const getInitialHandle = ()=>{


  if(props.isFirst){ //说明已有初始值
    autoScrollToHr(props.rightHandle)
    return;
  }


  let leftHr = props.lb
  let rightHr = leftHr + scaleFloat.value

  // console.log(leftHr,rightHr)

  // 不能简单套用fullCheck，因为手柄未初始化
  if(isRightHandleValid(rightHr)&&isBothValid(leftHr,rightHr)&&isCorrectOrder(leftHr,rightHr)){

    autoScrollToHr(rightHr)

    emits('update:leftHandle', leftHr)
    emits('update:rightHandle', rightHr)
    return
  }


  for(let i =0; i<timeTable.value.length; i++){
    leftHr = timeTable.value[i].rightHr // 尝试从各个时间段的右边开始
    rightHr = leftHr + scaleFloat.value
    // 不能简单套用fullCheck，因为手柄未初始化
    if(isRightHandleValid(rightHr)&&isBothValid(leftHr,rightHr)&&isCorrectOrder(leftHr,rightHr)){

      autoScrollToHr(rightHr)

      emits('update:leftHandle', leftHr)
      emits('update:rightHandle', rightHr)
      return
    }
  }

  // 还是找不到，就报错
  showToast(i18n.global.t('room.notify.full'));
  emits("update:disabled",true)
}


/**
 * 时间条自动滚动到...
 * */
const autoScrollToHr = (hr)=>{

  if(hr<props.lb||hr>props.ub) return // 在可约时间外进入页面，页面不滚

  let left2 = (hr-props.lb)/span.value*refContent.value.clientWidth  // 已过去的时间（px单位）
  let left1 = refContainer.value.clientWidth/2  // 窗口的一半

  let temp = -(left2 - left1)

  if(temp>fringe) temp=fringe // 禁止正数的left，但留有余地
  if(temp<(zoomConstant*refContent.value.clientWidth)-fringe) temp=(zoomConstant*refContent.value.clientWidth)-fringe // 禁止太左移了

  if(hr===props.lb+scaleFloat.value){//一天刚开始
    temp = 20
  }

  contentPositionLeft.value = temp

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

// 根据当前坐标计算左侧定位百分比
const handlePositionPercent = (val) => {
  return ((val - refTimeline.value.offsetLeft) / refTimeline.value.clientWidth * 100) + '%'
}

// 根据当前坐标计算左侧定位百分比（浮点数版本）
const handlePositionPercentFloat = (val) => {
  return (val - refTimeline.value.offsetLeft) / refTimeline.value.clientWidth
}

// 计算离当前百分比对应的真实值最近的一个刻度（按实际刻度处理）
const getNearestPercentScale = (per) => {
  const currentValue = per * span.value + props.lb
  console.log(currentValue)
  return getNearestScale(currentValue,props.lb,props.ub,props.scale)
}

/*==============手柄逻辑函数============*/
// 检查左值是否非法
const isLeftHandleValid = (left)=>{
  for(let i =0; i<timeTable.value.length; i++){
    if (left >= timeTable.value[i].leftHr && left < timeTable.value[i].rightHr) return false
  }

  if(left < props.lb) return false // 检查是否越界

  return true
}

// 检查右值是否非法
const isRightHandleValid = (right)=>{
  for(let i =0; i<timeTable.value.length; i++){
    if (right > timeTable.value[i].leftHr && right <= timeTable.value[i].rightHr) return false
  }

  if(right > props.ub) return false // 检查是否越界

  return true
}

// 检查是否包含某已有的时间
const isBothValid = (left,right)=>{
  for(let i =0; i<timeTable.value.length; i++){
    if (left <= timeTable.value[i].leftHr && right >= timeTable.value[i].rightHr) return false
  }

  return true
}

// 检查两手柄关系
const isCorrectOrder = (left,right)=>{
  return left<right // 严格小于
}

const fullCheckLeft = (leftHr)=>{
  if(!isLeftHandleValid(leftHr)) return false // 开始时间非法
  if(!isBothValid(leftHr,props.rightHandle)) return false // 产生非法的范围
  if(!isCorrectOrder(leftHr,props.rightHandle)) return false // 错误顺序
  return true
}

const fullCheckRight = (rightHr) => {
  if(!isRightHandleValid(rightHr)) return false // 结束时间非法
  if(!isBothValid(props.leftHandle,rightHr)) return false // 产生非法的范围
  if(!isCorrectOrder(props.leftHandle,rightHr)) return false // 错误顺序
  return true
}

// 综合测试，两手柄都是新的
const fullCheck = (leftHr,rightHr)=>{
  return isLeftHandleValid(leftHr)
      && isRightHandleValid(rightHr)
      && isBothValid(leftHr,rightHr)
      && isCorrectOrder(leftHr,rightHr)
}

/*============================点击事件：左值初始化===========================*/

/*============================拖动事件：左值===========================*/
const positionLeft = ref(handlePosition(props.leftHandle))

// 监听左值变化，改变绝对定位
watch(() => props.leftHandle, (newValue, oldValue) => {
  positionLeft.value = handlePosition(newValue)
}, { immediate: true })

/*================================拖动事件：右值================================*/
const positionRight = ref(handlePosition(props.rightHandle))

// 监听右值变化，改变绝对定位
watch(() => props.rightHandle, (newValue, oldValue) => {
  positionRight.value = handlePosition(newValue)
}, { immediate: true })


/*=================步进器右值变化==================*/
const addHalf = (e)=>{
  const rightHr = props.rightHandle + scaleFloat.value
  if(!fullCheckRight(rightHr)) return

  emits('update:rightHandle', rightHr)
}

const minusHalf = (e)=>{
  const rightHr = props.rightHandle - scaleFloat.value
  if(!fullCheckRight(rightHr)) return

  emits('update:rightHandle', rightHr)
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

var minX = 0 // 最小的left（负数，2/3个content的宽度+20）
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
  minX = (zoomConstant*refContent.value.clientWidth)-fringe
  maxX = fringe

  stop()

  startTime = event.timeStamp;
  startX = (event.changedTouches?.[0].clientX) ?? event.clientX
  momentumStartX = startPosition = contentPositionLeft.value
}

const scrollContentMove = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!isScrolling) return

  const deltaX = ((event.changedTouches?.[0].clientX) ?? event.clientX) - startX

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
  }else if (finalX < (zoomConstant*refContent.value.clientWidth)-fringe) {
    finalX = (zoomConstant*refContent.value.clientWidth)-fringe
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


  const minX = (zoomConstant*refContent.value.clientWidth)-fringe
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

  var endX = (event.changedTouches?.[0].clientX) ?? event.clientX
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




/**
 * 时间条容器左右滚动事件
 * 下层
 * 不冒泡
 * 阻止默认事件
 * */
// const startX = ref(0)
// const startPosition = ref(0)
// const scrollContentStart = (event)=>{
//   event.stopPropagation();
//   event.preventDefault();
//   startX.value = event.changedTouches[0].clientX
//   startPosition.value = contentPositionLeft.value
// }
//
// const scrollContentMove = (event)=>{
//   event.stopPropagation();
//   event.preventDefault();
//
//   let currentX = event.changedTouches[0].clientX
//   let diff = currentX-startX.value
//   let temp = startPosition.value + diff
//   if(temp>fringe) temp = fringe // 禁止正数的left，但留有余地
//   if(temp<(-2/3*refContent.value.clientWidth)-fringe) temp = (-2/3*refContent.value.clientWidth)-fringe // 禁止太左移了
//
//   contentPositionLeft.value = temp
// }
//
// const scrollContentEnd = (event)=>{
//   event.stopPropagation();
//   event.preventDefault();
// }
//
//
// let scrollContentDragging = false
// function scrollContentMouseDown(event) {
//
//   event.stopPropagation();
//   event.preventDefault();
//
//   scrollContentDragging = true
//   startX.value = event.clientX
//   startPosition.value = contentPositionLeft.value
//
//
//   // 在document对象上添加的监听，可以获得超过元素本身的坐标
//   document.addEventListener('mousemove', scrollContentMouseMove, true);
//   document.addEventListener('mouseup', scrollContentMouseUp, true);
// }
//
// function scrollContentMouseMove(event) {
//   event.preventDefault();
//   event.stopPropagation();
//
//   if(!scrollContentDragging) return
//
//   let currentX = event.clientX
//   let diff = currentX-startX.value
//   let temp = startPosition.value + diff
//   if(temp>fringe) temp = fringe // 禁止正数的left，但留有余地
//   if(temp<(-2/3*refContent.value.clientWidth)-fringe) temp = (-2/3*refContent.value.clientWidth)-fringe // 禁止太左移了
//
//   contentPositionLeft.value = temp
//
// }
//
// function scrollContentMouseUp(event) {
//   event.preventDefault();
//   event.stopPropagation();
//   scrollContentDragging = false
//   // 清除事件
//   document.removeEventListener('mousemove', scrollContentMouseMove, true);
//   document.removeEventListener('mouseup', scrollContentMouseUp, true);
//
// }

/**
 * 点选新时间事件
 * 中层
 * 不冒泡
 * 阻止左滑刷新
 * */
var startY = 0
var isMove = false
let barTapDragging = false
const barTapStart = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  startX = (event.changedTouches?.[0].clientX) ?? event.clientX
  startY = (event.changedTouches?.[0].clientY) ?? event.clientY
  startPosition = contentPositionLeft.value
  isMove = false // 初始是没滚动的

  isScrolling = true

  // 动态计算一下边界
  minX = (zoomConstant*refContent.value.clientWidth)-fringe
  maxX = fringe

  stop()

  startTime = event.timeStamp;
  startX = (event.changedTouches?.[0].clientX) ?? event.clientX
  momentumStartX = startPosition = contentPositionLeft.value

  barTapDragging = true
  document.addEventListener('mousemove', barTapMove, true);
  document.addEventListener('mouseup', barTapEnd, true);
}

const barTapMove = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!barTapDragging) return

  const moveX = (event.changedTouches?.[0].clientX) ?? event.clientX
  const moveY = (event.changedTouches?.[0].clientY) ?? event.clientY


  if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) { // 滚动了
    isMove = true

    if(!isScrolling) return

    const deltaX = ((event.changedTouches?.[0].clientX) ?? event.clientX) - startX

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

}

const barTapEnd = (event)=>{

  event.stopPropagation();
  event.preventDefault();
  barTapDragging = false

  document.removeEventListener('mousemove', barTapMove, true);
  document.removeEventListener('mouseup', barTapEnd, true);

  if(!isMove){ // 不滚动就是点选

    const fl = (startX-startPosition)/refContent.value.clientWidth-0.01; // 由于style的问题，这个数值偏大了0.01
    console.log(fl)

    const tempLeftHandle = getNearestPercentScale(fl)
    const tempRightHandle = tempLeftHandle + scaleFloat.value

    console.log(tempLeftHandle)

    if(!fullCheck(tempLeftHandle,tempRightHandle)) return

    // 改值
    emits('update:leftHandle', tempLeftHandle)
    emits('update:rightHandle', tempRightHandle)

  }else{ // 滚动的逻辑

    if(!isScrolling) return
    isScrolling = false // 不再用手指滚动了


    if (isNeedReset()) return;

    var endX = (event.changedTouches?.[0].clientX) ?? event.clientX
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
}

/**
 * 选区整体左右平移事件
 * 上层
 * 不冒泡
 * 阻止左滑刷新
 * */
const selectionStartX = ref(0)
const selectionStartLeftHr = ref(0)
const selectionStartRightHr = ref(0)
let selectionTranslationDragging = false
const selectionTranslationStart = (event)=>{

  event.stopPropagation();
  event.preventDefault();
  selectionTranslationDragging = true

  selectionStartX.value = event.changedTouches?.[0].clientX ?? event.clientX
  selectionStartLeftHr.value = props.leftHandle
  selectionStartRightHr.value = props.rightHandle

  // 在document对象上添加的监听，可以获得超过元素本身的坐标
  document.addEventListener('mousemove', selectionTranslationMove, true);
  document.addEventListener('mouseup', selectionTranslationEnd, true);

}

const selectionTranslationMove = (event)=>{

  event.stopPropagation();
  event.preventDefault();

  if(!selectionTranslationDragging) return

  const slice = refContent.value.clientWidth / span.value * scaleFloat.value // 半点
  const currentX = event.changedTouches?.[0].clientX ?? event.clientX
  const diff = currentX-selectionStartX.value


  const sliceCnt = Math.trunc(diff / slice) // 平移的半小时个数
  const tempLeftHandle = selectionStartLeftHr.value + sliceCnt * scaleFloat.value // 临时变量，新的左右值
  const tempRightHandle = selectionStartRightHr.value + sliceCnt * scaleFloat.value

  if(!fullCheck(tempLeftHandle,tempRightHandle)) return // 两手柄条件错误则返回

  // 改值
  emits('update:leftHandle', tempLeftHandle)
  emits('update:rightHandle', tempRightHandle)
}

const selectionTranslationEnd = (event)=>{

  event.stopPropagation();
  event.preventDefault();

  selectionTranslationDragging = false
  // 清除事件
  document.removeEventListener('mousemove', selectionTranslationMove, true);
  document.removeEventListener('mouseup', selectionTranslationEnd, true);
}


const handleStartX = ref(0)
const handleStartHr = ref(0)
let handleDragging = false

const handleStartLeft = (event)=>{
  event.stopPropagation();
  event.preventDefault();
  handleDragging = true


  handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
  handleStartHr.value = props.leftHandle

}

const handleMouseStartLeft = (event)=>{
  event.stopPropagation();
  event.preventDefault();
  handleDragging = true

  handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
  handleStartHr.value = props.leftHandle

  document.addEventListener('mousemove',handleMoveLeft, true);
  document.addEventListener('mouseup', handleEndLeft, true);
}

const handleStartRight = (event)=>{
  event.stopPropagation();
  event.preventDefault();
  handleDragging = true

  handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
  handleStartHr.value = props.rightHandle

}

const handleMouseStartRight = (event)=>{
  event.stopPropagation();
  event.preventDefault();
  handleDragging = true

  handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
  handleStartHr.value = props.rightHandle

  document.addEventListener('mousemove',handleMoveRight, true);
  document.addEventListener('mouseup', handleEndRight, true);
}

const handleMoveLeft = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!handleDragging) return

  const slice = refContent.value.clientWidth / span.value * scaleFloat.value // 半点
  const currentX = (event.changedTouches?.[0].clientX) ?? event.clientX
  const diff = currentX-handleStartX.value
  const sliceCnt = Math.trunc(diff / slice) // 平移的半小时个数

  const tempHandle = handleStartHr.value + sliceCnt*scaleFloat.value // 临时变量


  if(!fullCheckLeft(tempHandle)) return // 条件错误则返回
  emits('update:leftHandle', tempHandle)
}

const handleMoveRight = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!handleDragging) return

  const slice = refContent.value.clientWidth / span.value * scaleFloat.value // 半点
  const currentX = (event.changedTouches?.[0].clientX) ?? event.clientX
  const diff = currentX-handleStartX.value
  const sliceCnt = Math.trunc(diff / slice) // 平移的半小时个数

  const tempHandle = handleStartHr.value + sliceCnt*scaleFloat.value // 临时变量

  if(!fullCheckRight(tempHandle)) return // 条件错误则返回
  emits('update:rightHandle', tempHandle)
}

const handleEndLeft = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  handleDragging = false
  // 清除事件
  document.removeEventListener('mousemove', handleMoveLeft, true);
  document.removeEventListener('mouseup', handleEndLeft, true);
}

const handleEndRight = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  handleDragging = false
  // 清除事件
  document.removeEventListener('mousemove', handleMoveRight, true);
  document.removeEventListener('mouseup', handleEndRight, true);
}

</script>

<template>
  <div>
    <div class="timeline">

      <div class="timeline-bar-container" ref="refContainer">

        <div class="timeline-content"
             ref="refContent"
             :style="{width:zoomIn+'%', left:contentPositionLeft+'px',transition:'left '+animationCurve+' '+animationDuration+'s'}"
             @touchstart="scrollContentStart"
             @touchmove="scrollContentMove"
             @touchend="scrollContentEnd"
             @transitionend="onTransitionEnd"
             @mousedown="scrollContentStart"
             @mousemove="scrollContentMove"
             @mouseup="scrollContentEnd"
        >
          <div class="tags">
            <div class="tag tag-left" :style="'left:'+((leftHandle-lb)/span)*100+'%;'" v-if="!disabled">
              <div class="tag-text no-select">{{hourFormat(leftHandle)}}</div>
              <div class="triangle"></div>
            </div>
            <div class="tag tag-right" :style="'left:'+((rightHandle-lb)/span)*100+'%;'" v-if="!disabled">
              <div class="tag-text no-select">{{hourFormat(rightHandle)}}</div>
              <div class="triangle"></div>
            </div>
          </div>
          <div
              class="timeline-bar"
              ref="refTimeline"
              @touchstart="barTapStart"
              @touchmove="barTapMove"
              @touchend="barTapEnd"
              @mousedown="barTapStart"
          >
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
            <div class="period selecting-period"
                 :style="{
                    left:handlePosition(leftHandle),
                    width:handleWidth(leftHandle,rightHandle)
                  }"
                 v-if="!disabled"
                 @touchstart="selectionTranslationStart"
                 @touchmove="selectionTranslationMove"
                 @touchend="selectionTranslationEnd"
                 @mousedown="selectionTranslationStart"
            />
            <div
                 class="handle handle-left"
                 :style="{left:positionLeft}"
                 v-if="!disabled"
                 @touchstart="handleStartLeft"
                 @touchmove="handleMoveLeft"
                 @touchend="handleEndLeft"
                 @mousedown="handleMouseStartLeft"
            />
            <div class="handle handle-right"
                 :style="{left:positionRight}"
                 v-if="!disabled"
                 @touchstart="handleStartRight"
                 @touchmove="handleMoveRight"
                 @touchend="handleEndRight"
                 @mousedown="handleMouseStartRight"
            />
          </div>
          <div class="timeline-scale">
            <div
                 class="number no-select"
                 v-for="(item,i) in hrArray"
                 :key="item">
              {{item}}
            </div>
          </div>
        </div>
      </div>


    </div>
    <div class="time-stepper">
      <SvgIcon name="minus" width="1.6rem" height="1.6rem" @click="minusHalf" v-if="!disabled"/>

      <div class="title" v-if="!disabled">
        {{hourFormat(leftHandle)}}-{{hourFormat(rightHandle)}},&nbsp;{{hrDiff(leftHandle,rightHandle)}}
      </div>
      <div class="title" v-else>
        {{$t('time.notAvailable')}}
      </div>

      <SvgIcon name="plus" width="1.6rem" height="1.6rem" @click="addHalf" v-if="!disabled"/>

    </div>
  </div>
</template>

<style scoped lang="scss">


.no-select {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.timeline{
  width: 100%;
  display: flex;
  flex-direction: column;




  .timeline-bar-container{
    width: 100%;
    height: 7rem;
    overflow: hidden;
    position: relative;

    .timeline-content{
      width: 500%;
      position: relative;


      .tags{
        position: relative;
        width: 100%;
        padding-bottom: 0.3rem;
        height: 1.3rem;

        .tag{
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translateX(-50%);

          .tag-text{
            background-color: var(--color-primary);
            border-radius: 0.25rem;
            color: #fff;
            font-size: 0.65rem;
            padding: 0 0.3rem;
            height: 1rem;
            line-height: 1rem;
          }

          .triangle {
            width: 0;
            height: 0;
            border-left: 0.25rem solid transparent;
            border-right: 0.25rem solid transparent;
            border-top: 0.4rem solid var(--color-primary);
          }
        }
      }

      .timeline-bar{
        position: relative;
        background-color: var(--color-default);
        height: 2.5rem;
        border-radius: 0.3rem;
        width: 100%;

        .period{
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 0.3rem;
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

        .selecting-period{
          background-color: var(--color-primary);
          border-radius: 0;
        }

        .handle{
          box-sizing: border-box;
          border-radius: 0.3rem;
          border: 0.1rem solid var(--color-primary);
          background-color: #fff;
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 1rem;
          transform: translateX(-50%);

          .handle-top{
            position: absolute;
            border-radius: 0.15rem;
            border: 0.05rem solid var(--color-primary);
            top: 50%;
            left: 0.05rem;
            height: 2.7rem;
            width: 100%;
            transform: translateY(-50%) translateX(-0.1rem);
            background-color: #fff;
          }
        }

      }



      .timeline-scale{
        height: 2.5rem;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;

        .number{
          line-height: 2;
          font-size: 0.75rem;
          //font-weight: 700;
          color: var(--color-secondary-text);
          transform: translateX(50%);
        }

        .number:first-of-type,.number:last-of-type{
          transform: none;
        }

      }
    }

  }



}

.time-stepper{
  display: flex;
  height: 3rem;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  border-bottom: 0.05rem solid #efefef;
  color: var(--color-regular-text);

  .title{
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-heading);
  }
}
</style>