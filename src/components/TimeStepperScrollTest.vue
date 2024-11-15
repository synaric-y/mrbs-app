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
import _ from 'lodash'
import {Decimal} from "decimal.js";
import {
  formatTimeByHM,
  generateTsSequence,
  nearestScaleTs,
  nextScaleTs,
  SEC_PER_HOUR,
  SEC_PER_MINUTE, tsDiff
} from "@/utils/timestampTool.js";
import dayjs from "dayjs";
import {isBetween} from "@/utils/mathUtil.js";

const fringe = 20 // 左右两边的安全区

// 两手柄css闪烁类
const leftHandleBlink = ref('')
const rightHandleBlink = ref('')



const props = defineProps(['lb','ub','meetings','leftHandle','rightHandle','currentDate','disabled','isFirst','scale','currentTime'])
const emits = defineEmits(["update:leftHandle","update:rightHandle","update:disabled"]);

// 转换成ref变量
const scaleFloat = ref(props.scale / 60) // 30分钟-》0.5 15分钟-》0.25
const timeTable = ref(props.meetings); // 保持响应式连接

const span = ref(props.ub-props.lb)
const hrArray = ref([])
const zoomIn = document.documentElement.clientWidth>1024?200:600 //大屏幕放大倍率小一点
const zoomConstant = -((zoomIn-100)/zoomIn)


/*
 * 时间戳相关
 */
const getNearestPercentScale = (per) => {
  const currentValue = Number(new Decimal(per).times(span.value).plus(props.lb))
  console.log(currentValue)
  return nearestScaleTs(currentValue, props.lb, props.ub, props.scale * 60)
}


/*
 * 手柄逻辑函数
 */
// 检查左值是否非法
const isLeftHandleValid = (left) => {
  if (left < props.lb) return false // 检查是否越界

  for (let i = 0; i < timeTable.value.length; i++) {
    if (left >= timeTable.value[i].start_time && left < timeTable.value[i].end_time) return false
  }

  return true
}

// 检查右值是否非法
const isRightHandleValid = (right) => {
  if (right > props.ub) return false // 检查是否越界

  for (let i = 0; i < timeTable.value.length; i++) {
    if (right > timeTable.value[i].start_time && right <= timeTable.value[i].end_time) return false
  }

  return true
}

// 检查是否包含某已有的时间
const isBothValid = (left, right) => {
  for (let i = 0; i < timeTable.value.length; i++) {
    if (left <= timeTable.value[i].start_time && right >= timeTable.value[i].end_time) return false
  }

  return true
}

// 检查两手柄关系
const isCorrectOrder = (left, right) => {
  return right>left
}

const fullCheckLeft = (left) => {
  if (!isLeftHandleValid(left)) return false // 开始时间非法
  if (!isBothValid(left, props.rightHandle)) return false // 产生非法的范围
  if (!isCorrectOrder(left, props.rightHandle)) return false // 错误顺序
  return true
}

const fullCheckRight = (right) => {
  if (!isRightHandleValid(right)) return false // 结束时间非法
  if (!isBothValid(props.leftHandle, right)) return false // 产生非法的范围
  if (!isCorrectOrder(props.leftHandle, right)) return false // 错误顺序
  return true
}

// 综合测试，两手柄都是新的
const fullCheck = (left, right) => {
  return isLeftHandleValid(left) &&
      isRightHandleValid(right) &&
      isBothValid(left, right) &&
      isCorrectOrder(left, right)
}


/*==================格式化==================*/
const getEntryStatus = (entry) => {
  if(_.inRange(props.currentTime, entry.start_time, entry.end_time)) return 1 // 进行中
  if(props.currentTime > entry.end_time) return 2 // 已结束
  return 0 // 待开始
}

const getEntryText = (status) => {
  const mapping = {
    0: i18n.global.t('meeting.status.toStart'),
    1: i18n.global.t('meeting.status.inProgress'),
    2: i18n.global.t('meeting.status.finished'),
    3: ''
  }
  return mapping[status]
}

const formatMeetings = () => {
  const tempList = []

  console.log(dayjs().unix())


  // 如果是今天，将先前的几个小时清掉
  if(dayjs().isSame(dayjs(props.currentDate),'day')){ // 当前日期是今天
    tempList.push({
      start_time: props.lb,
      end_time: Math.min(nextScaleTs(dayjs().unix(),props.scale*SEC_PER_MINUTE), props.ub),
      status: 3, // 已过去的时间
      text: ''
    })
  }

  _.forEach(props.meetings,entry=>{

    // 去除不在范围内的会议
    if (entry.start_time > props.ub) return
    if (entry.end_time < props.lb) return

    const status = getEntryStatus(entry)

    tempList.push({
      id: entry.entry_id,
      start_time: Math.max(entry.start_time, props.lb), // 截断越界的部分
      end_time: Math.min(props.ub, entry.end_time),
      status: status, // 待开始，进行中，已结束
      text: getEntryText(status)
    })

  })


  timeTable.value = tempList

  // 排序，按每个会议起始时间（防止乱序导致手柄初始化问题）
  timeTable.value = _.sortBy(timeTable.value,['start_time'])
  console.log(timeTable.value)

}

/*================初始化手柄==================*/
const getInitialHandle = () => {

  let left = props.lb
  let right = left + props.scale * 60

  console.log(left, right);


  // 不能简单套用fullCheck，因为手柄未初始化
  if (isRightHandleValid(right) && isBothValid(left, right) && isCorrectOrder(left, right)) {
    emits('update:leftHandle', left)
    emits('update:rightHandle', right)
    return
  }

  console.log(timeTable.value)

  for (let i = 0; i < timeTable.value.length; i++) {
    left = timeTable.value[i].end_time // 尝试从各个时间段的右边开始
    right = left + props.scale * 60

    // 不能简单套用fullCheck，因为手柄未初始化
    if (isRightHandleValid(right) && isBothValid(left, right) && isCorrectOrder(left, right)) {
      emits('update:leftHandle', left)
      emits('update:rightHandle', right)
      return
    }
  }

  // 还是找不到，就报错
  showToast(i18n.global.t('room.notify.full'));
  emits("update:disabled", true)
}


// ref DOM元素
const refContainer = ref(null)
const refContent = ref(null)
const refTimeline = ref(null) // 时间轴dom对象

/*
 * 样式计算函数
 */
// 根据真实值计算左侧定位百分比
const handlePosition = (val) => {
  return Number(new Decimal(val).minus(props.lb).dividedBy(span.value).times(100)) + '%'
}

// 根据真实值计算宽度
const handleWidth = (leftVal, rightVal) => {
  return Number(new Decimal(rightVal).minus(leftVal).dividedBy(span.value).times(100)) + '%'
}





/*
 * 容器滚动函数
 */


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

var isScrolling = ref(false) // 是否正用手指滚动
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

const scrollContentMouseStart = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  isScrolling.value = true

  // 动态计算一下边界
  minX = (zoomConstant*refContent.value.clientWidth)-fringe
  maxX = fringe

  startX = (event.changedTouches?.[0].clientX) ?? event.clientX
  startPosition = contentPositionLeft.value

  document.addEventListener('mousemove', scrollContentMouseMove, true);
  document.addEventListener('mouseup', scrollContentMouseEnd, true);
}

const scrollContentMouseMove = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!isScrolling.value) return

  const deltaX = ((event.changedTouches?.[0].clientX) ?? event.clientX) - startX

  // 浮点数坐标会影响渲染速度
  let finalX = Math.round(startPosition + deltaX);

  // 超出边界时设为边界
  if (finalX > maxX ) {
    finalX = maxX
  }

  if (finalX < minX) {
    finalX = minX
  }

  // 改坐标
  contentPositionLeft.value = finalX

  document.addEventListener('mousemove', scrollContentMouseMove);
  document.addEventListener('mouseup', scrollContentMouseEnd);
}

const scrollContentMouseEnd = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!isScrolling.value) return
  isScrolling.value = false // 不再用手指滚动了
}

const scrollContentStart = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  isScrolling.value = true

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

  if(!isScrolling.value) return

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

  document.removeEventListener('mousemove', scrollContentMove, true);
  document.removeEventListener('mouseup', scrollContentEnd, true);

  if(!isScrolling.value) return
  isScrolling.value = false // 不再用手指滚动了


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

  isScrolling.value = true

  // 动态计算一下边界
  minX = (zoomConstant*refContent.value.clientWidth)-fringe
  maxX = fringe

  stop()

  startTime = event.timeStamp;
  startX = (event.changedTouches?.[0].clientX) ?? event.clientX
  momentumStartX = startPosition = contentPositionLeft.value

  barTapDragging = true
  // document.addEventListener('mousemove', barTapMove, true);
  // document.addEventListener('mouseup', barTapEnd, true);
}

const barTapMove = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!barTapDragging) return

  const moveX = (event.changedTouches?.[0].clientX) ?? event.clientX
  const moveY = (event.changedTouches?.[0].clientY) ?? event.clientY


  if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) { // 滚动了
    isMove = true

    if(!isScrolling.value) return

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

  // document.removeEventListener('mousemove', barTapMove, true);
  // document.removeEventListener('mouseup', barTapEnd, true);

  if(!isMove){ // 不滚动就是点选

    const fl = (startX-startPosition)/refContent.value.clientWidth-0.01; // 由于style的问题，这个数值偏大了0.01
    console.log(fl)

    const tempLeftHandle = getNearestPercentScale(fl)
    const tempRightHandle = tempLeftHandle + (SEC_PER_HOUR * (props.scale / 60))

    console.log(tempLeftHandle)

    if(!fullCheck(tempLeftHandle,tempRightHandle)) return

    // 改值
    emits('update:leftHandle', tempLeftHandle)
    emits('update:rightHandle', tempRightHandle)



  }else{ // 滚动的逻辑

    if(!isScrolling.value) return
    isScrolling.value = false // 不再用手指滚动了


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

const barTapMouseStart = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  startX = (event.changedTouches?.[0].clientX) ?? event.clientX
  startY = (event.changedTouches?.[0].clientY) ?? event.clientY
  startPosition = contentPositionLeft.value
  isMove = false // 初始是没滚动的

  isScrolling.value = true

  // 动态计算一下边界
  minX = (zoomConstant*refContent.value.clientWidth)-fringe
  maxX = fringe

  startX = (event.changedTouches?.[0].clientX) ?? event.clientX

  barTapDragging = true
  document.addEventListener('mousemove', barTapMouseMove, true);
  document.addEventListener('mouseup', barTapMouseEnd, true);
}

const barTapMouseMove = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  if(!barTapDragging) return

  isMove = true

  if(!isScrolling.value) return

  const deltaX = ((event.changedTouches?.[0].clientX) ?? event.clientX) - startX

  // 浮点数坐标会影响渲染速度
  let finalX = Math.round(startPosition + deltaX);

  // 超出边界时增加阻力，只增加三分之一的位移
  if(finalX > maxX){
    finalX = maxX
  }
  if(finalX < minX){
    finalX = minX
  }

  // 改坐标
  contentPositionLeft.value = finalX

  // 慢滚动重置初始时间和位置
  if (event.timeStamp - startTime > momentumTimeThreshold) {
    startTime = event.timestamp;
    momentumStartX = finalX;
  }

}

const barTapMouseEnd = (event)=>{

  event.stopPropagation();
  event.preventDefault();
  barTapDragging = false


  if(!isMove){ // 不滚动就是点选

    const fl = (startX-startPosition)/refContent.value.clientWidth-0.01; // 由于style的问题，这个数值偏大了0.01
    console.log(fl)

    const tempLeftHandle = getNearestPercentScale(fl)
    const tempRightHandle = tempLeftHandle + (SEC_PER_HOUR * (props.scale / 60))

    console.log(tempLeftHandle)

    if(!fullCheck(tempLeftHandle,tempRightHandle)) return

    // 改值
    emits('update:leftHandle', tempLeftHandle)
    emits('update:rightHandle', tempRightHandle)



  }else{ // 滚动的逻辑

    if(!isScrolling.value) return
    isScrolling.value = false // 不再用手指滚动了


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
const selectionTranslationDragging = ref(false)
const selectionTranslationStart = (event) => {

  event.stopPropagation();
  event.preventDefault();

  console.log(290);
  selectionTranslationDragging.value = true

  selectionStartX.value = event.changedTouches?.[0].clientX ?? event.clientX
  selectionStartLeftHr.value = props.leftHandle
  selectionStartRightHr.value = props.rightHandle

  document.addEventListener('mousemove', selectionTranslationMove, true);
  document.addEventListener('mouseup', selectionTranslationEnd, true);

}

const selectionTranslationMove = (event) => {
  event.stopPropagation();
  event.preventDefault();

  const slice = Number(new Decimal(props.scale).times(60).dividedBy(span.value).times(refContent.value.clientWidth)) // 半点
  const currentX = event.changedTouches?.[0].clientX ?? event.clientX
  const diff = currentX - selectionStartX.value


  const sliceCnt = Math.trunc(diff / slice) // 平移的半小时个数
  const tempLeftHandle = selectionStartLeftHr.value + sliceCnt * props.scale * 60 // 临时变量，新的左右值
  const tempRightHandle = selectionStartRightHr.value + sliceCnt * props.scale * 60



  if (!fullCheck(tempLeftHandle, tempRightHandle)) { // 两手柄条件错误则返回
    if (diff < 0) { // 向左
      leftHandleBlink.value = 'handle-blink'
    } else { // 向右
      rightHandleBlink.value = 'handle-blink'
    }
    return
  }

  // 改值
  emits('update:leftHandle', tempLeftHandle)
  emits('update:rightHandle', tempRightHandle)

}

const selectionTranslationEnd = (event) => {
  event.stopPropagation();
  event.preventDefault();

  selectionTranslationDragging.value = false

  document.removeEventListener('mousemove', selectionTranslationMove, true);
  document.removeEventListener('mouseup', selectionTranslationEnd, true);

  leftHandleBlink.value = ''
  rightHandleBlink.value = ''
}


const handleStartX = ref(0)
const handleStartHr = ref(0)
const handleDragging = ref(false)

const handleStartLeft = (event)=>{
  event.stopPropagation();
  event.preventDefault();
  handleDragging.value = true


  handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
  handleStartHr.value = props.leftHandle

}

const handleMouseStartLeft = (event)=>{
  event.stopPropagation();
  event.preventDefault();
  handleDragging.value = true

  handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
  handleStartHr.value = props.leftHandle

  document.addEventListener('mousemove',handleMoveLeft, true);
  document.addEventListener('mouseup', handleEndLeft, true);
}

const handleStartRight = (event)=>{
  event.stopPropagation();
  event.preventDefault();
  handleDragging.value = true

  handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
  handleStartHr.value = props.rightHandle

}

const handleMouseStartRight = (event)=>{
  event.stopPropagation();
  event.preventDefault();
  handleDragging.value = true

  handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
  handleStartHr.value = props.rightHandle

  document.addEventListener('mousemove',handleMoveRight, true);
  document.addEventListener('mouseup', handleEndRight, true);
}

const handleMoveLeft = (event) => {
  event.stopPropagation();
  event.preventDefault();

  if (!handleDragging.value) return

  const slice = Number(new Decimal(props.scale).times(60).dividedBy(span.value).times(refContent.value.clientWidth)) // 半点
  const currentX = (event.changedTouches?.[0].clientX) ?? event.clientX
  const diff = currentX - handleStartX.value
  const sliceCnt = Math.trunc(diff / slice) // 平移的半小时个数

  const tempHandle = handleStartHr.value + sliceCnt * props.scale * 60 // 临时变量


  if (!fullCheckLeft(tempHandle)) { // 条件错误则返回并闪烁
    leftHandleBlink.value = 'handle-blink'
    return
  }
  emits('update:leftHandle', tempHandle)
}

const handleMoveRight = (event) => {
  event.stopPropagation();
  event.preventDefault();

  if (!handleDragging.value) return


  const slice = Number(new Decimal(props.scale).times(60).dividedBy(span.value).times(refContent.value.clientWidth)) // 半点
  const currentX = (event.changedTouches?.[0].clientX) ?? event.clientX
  const diff = currentX - handleStartX.value
  const sliceCnt = Math.trunc(diff / slice) // 平移的半小时个数

  const tempHandle = handleStartHr.value + sliceCnt * props.scale * 60 // 临时变量

  if (!fullCheckRight(tempHandle)) { // 条件错误则返回
    rightHandleBlink.value = 'handle-blink'
    return
  }
  emits('update:rightHandle', tempHandle)
}

const handleEndLeft = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  leftHandleBlink.value = '' // 停止拖动，不闪烁
  handleDragging.value = false
  // 清除事件
  document.removeEventListener('mousemove', handleMoveLeft, true);
  document.removeEventListener('mouseup', handleEndLeft, true);
}

const handleEndRight = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  rightHandleBlink.value = ''
  handleDragging.value = false
  // 清除事件
  document.removeEventListener('mousemove', handleMoveRight, true);
  document.removeEventListener('mouseup', handleEndRight, true);
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
const addHalf = (e) => {
  const rightHr = props.rightHandle + props.scale * 60
  if (!fullCheckRight(rightHr)){
    rightHandleBlink.value = ''
    setTimeout(() => {rightHandleBlink.value = 'handle-blink-temp'},100); // 0.1s后刷新动画
    return
  }


  emits('update:rightHandle', rightHr)
}

const minusHalf = (e) => {
  const rightHr = props.rightHandle - props.scale * 60
  if (!fullCheckRight(rightHr)){
    rightHandleBlink.value = ''
    setTimeout(() => {rightHandleBlink.value = 'handle-blink-temp'},100); // 0.1s后刷新动画

    return
  }

  emits('update:rightHandle', rightHr)
}

onMounted(()=>{

  console.log(props)

  // 初始化刻度
  hrArray.value = generateTsSequence(props.lb, props.ub, props.scale * 60)

  formatMeetings()

  getInitialHandle()

})

</script>

<template>
  <div>
    <div class="timeline">

      <div class="timeline-bar-container" ref="refContainer">

        <div class="timeline-content"
             ref="refContent"
             :style="{width:zoomIn+'%', left:contentPositionLeft+'px',transition:'left '+animationCurve+' '+animationDuration+'s',cursor:isScrolling?'grabbing':'grab'}"
             @touchstart="scrollContentStart"
             @touchmove="scrollContentMove"
             @touchend="scrollContentEnd"
             @transitionend="onTransitionEnd"
             @mousedown="scrollContentMouseStart"
        >
          <div class="tags">
            <div class="tag tag-left" :style="'left:'+((leftHandle-lb)/span)*100+'%;'" v-if="!disabled">
              <div class="tag-text no-select">{{formatTimeByHM(leftHandle)}}</div>
              <div class="triangle"></div>
            </div>
            <div class="tag tag-right" :style="'left:'+((rightHandle-lb)/span)*100+'%;'" v-if="!disabled">
              <div class="tag-text no-select">{{formatTimeByHM(rightHandle)}}</div>
              <div class="triangle"></div>
            </div>
          </div>
          <div
              class="timeline-bar"
              ref="refTimeline"
              @touchstart="barTapStart"
              @touchmove="barTapMove"
              @touchend="barTapEnd"
              @mousedown="barTapMouseStart"
          >
            <div :class="{
                    'period':true,
                    'to-start':item.status===0,
                    'in-progress':item.status===1,
                    'disabled':item.status===2,
                    'overdue':item.status===3
                  }"
                 v-for="(item,i) in timeTable"
                 :key="i"
                 :style="{
                    left:handlePosition(item.start_time),
                    width:handleWidth(item.start_time,item.end_time)
                 }"
            >{{item.text}}</div>
            <div class="period selecting-period"
                 v-if="!disabled"
                 :style="{
                    left:handlePosition(leftHandle),
                    width:handleWidth(leftHandle,rightHandle)
                  }"
                 @touchstart="selectionTranslationStart"
                 @touchmove="selectionTranslationMove"
                 @touchend="selectionTranslationEnd"
                 @mousedown="selectionTranslationStart"
            />
            <div
                 :class="'handle handle-left ' + leftHandleBlink"
                 v-if="!disabled"
                 :style="{left:positionLeft,cursor:'pointer'}"
                 @touchstart="handleStartLeft"
                 @touchmove="handleMoveLeft"
                 @touchend="handleEndLeft"
                 @mousedown="handleMouseStartLeft"
            />
            <div
                 :class="'handle handle-right ' + rightHandleBlink"
                 v-if="!disabled"
                 :style="{left:positionRight,cursor:'pointer'}"
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
              {{(item%SEC_PER_HOUR===0)?(new Date(item*1000).getHours()):'.'}}
            </div>
          </div>
        </div>
      </div>


    </div>
    <div class="time-stepper">
      <SvgIcon name="minus" width="1.6rem" height="1.6rem" @click="minusHalf" v-if="!disabled"/>

      <div class="title" v-if="!disabled">
        {{formatTimeByHM(leftHandle)}}-{{formatTimeByHM(rightHandle)}},&nbsp;{{tsDiff(leftHandle,rightHandle)}}
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
          text-align: center;
          color: #fff;
          font-size: 0.5rem;
          line-height: 2.5rem;
          cursor: default;
        }
        .to-start{
          background-color: var(--color-primary-light);
        }

        .disabled{
          background-color: var(--color-disabled);
          color: var(--color-regular-text)
        }
        
        .overdue{
          background-color: #eee;
        }

        .in-progress{
          background-color: var(--color-danger-light);
        }

        .selecting-period{
          background-color: var(--color-primary);
          border-radius: 0;
          z-index: 11;
          cursor:pointer;
        }

        .handle {
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
          z-index: 12;
        }

        .handle-blink {
          animation: blink 0.3s infinite ease-in-out;
        }

        .handle-blink-temp {
          animation: blink 0.3s 3 ease-in-out;
        }

        @keyframes blink {
          50% {
            background-color: var(--color-danger-light);
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
  border-bottom: 0.05rem solid var(--color-border);
  color: var(--color-regular-text);

  .title{
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-heading);
  }
}
</style>