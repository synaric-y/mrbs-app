<script setup>
import {
  SEC_PER_HOUR,
  generateTsSequence,
  tsDiff,
  nextScaleTs,
  nearestScaleTs,
  SEC_PER_MINUTE,
  formatTimeByHM,
} from "@/utils/timestampTool.js";

import {
  isBetween,
  clamp
} from "@/utils/mathUtil";

import {
  computed,
  onMounted,
  ref,
  watch
} from "vue";

import {
  Decimal
} from 'decimal.js';

import _ from 'lodash'; // lodash

import {i18n} from '@/i18n/index';


const props = defineProps(['lb', 'ub', 'areaLb', 'areaUb', 'meetings', 'leftHandle', 'rightHandle', 'currentTime',
  'disabled', 'isFirst',
  'scale',
  'avaliableHours'
])
const emits = defineEmits(["update:leftHandle", "update:rightHandle", "update:disabled"]);

// 转换成ref变量
const scaleFloat = ref(props.scale / 60) // 30分钟-》0.5 15分钟-》0.25
const timeTable = ref([]); // 内部时间表
const span = ref(props.ub - props.lb)
const hrArray = ref([])
const zoomIn = 400 // 放大倍率
const zoomConstant = (zoomIn / 100 - 1) / (zoomIn / 100) // 超出屏幕之外的比例

// ref DOM元素
const refContent = ref(null) // 滚动区域
const refContainer = ref(null) // 外部容器（一屏宽度）
const refTimeline = ref(null) // 时间轴dom对象

// 元素坐标值（需要动态查询）
const contentWidth = ref(100) // 滚动区域总宽度（一般不变）
const contentPositionLeft = ref(0) // 滚动区域距离屏幕左侧的位置
const containerPositionLeft = ref(0) // 容器距离屏幕左侧的位置（一般不变）
const containerPositionRight = ref(0) // 容器距离屏幕右侧的位置（一般不变）
const pxPer15Min = ref(0) // 每15分钟的宽度（px，一般不变）

// 界限值（两ref需要动态查询）
const fringe = 50 // 左右两边的安全区，单位px
const minX = ref(fringe) // 最小的left（负数，-(2/3个content的宽度+20)+containerPositionLeft，2/3和倍率有关）
const maxX = ref(fringe) // 最大的left（正数，20+containerPositionLeft）

// 两手柄css闪烁类
const leftHandleBlink = ref('')
const rightHandleBlink = ref('')

// 惯性滚动常量
const durationMap = {
  'noBounce': 2.5,
  'weekBounce': 0.8,
  'strongBounce': 0.4,
};
const maxOverflowX = ref(0); // 回弹的最大限度
const bounceRate = 10; // 回弹阻力
const bounceThreshold = 300; // 强弱回弹的分割值
const bezierMap = {
  'noBounce': 'cubic-bezier(.17, .89, .45, 1)',
  'weekBounce': 'cubic-bezier(.25, .46, .45, .94)',
  'strongBounce': 'cubic-bezier(.25, .46, .45, .94)',
};
const deceleration = 0.003; // 惯性滚动的加速度常量
const momentumTimeThreshold = 200; // 触发惯性滚动的最大时长，ms
const momentumXThreshold = 50; // 触发惯性滚动的最小位移距离，px

// 动画
const animationDisable = ref(false) // 禁用动画
const animationCurve = ref('none') // 曲线类型
const animationDuration = ref(1) // 动画时间，s

onMounted(() => {

  console.log(props.currentTime);
  console.log(props.ub);


  // 查询容器
  uni.createSelectorQuery().select('#my-container').boundingClientRect(rect => {
    containerPositionLeft.value = rect.left
    containerPositionRight.value = rect.right
    console.log(rect);
  }).exec()

  // 查询内部滚动区域
  uni.createSelectorQuery().select('#my-content').boundingClientRect(rect => {
    contentWidth.value = rect.width
    contentPositionLeft.value = rect.left
    minX.value = -(zoomConstant * contentWidth.value + fringe) + containerPositionLeft.value
    maxX.value = fringe + containerPositionLeft.value
    maxOverflowX.value = (contentWidth.value / (6 * zoomIn / 100))
    pxPer15Min.value = Number(new Decimal(contentWidth.value).times(SEC_PER_MINUTE*props.scale).dividedBy(span.value))

    console.log(- handlePositionFloat(nextScaleTs(props.currentTime, props.scale * 60)) * contentWidth.value);

    contentPositionLeft.value = clamp((- handlePositionFloat(nextScaleTs(props.currentTime, props.scale * 60)) * contentWidth.value)+(contentWidth.value/(zoomIn/100))/2+fringe,minX.value,maxX.value)

    console.log(rect);
  }).exec()


  console.log(props.meetings)

  // 初始化刻度
  hrArray.value = generateTsSequence(props.lb, props.ub, props.scale * 60)

  console.log(hrArray.value);


  formatMeetings()

  console.log(timeTable.value);

  // 初始化手柄
  getInitialHandle()
})

const currentTheme = computed(() => {
  return 'default'
})

function isInteger(obj) {
  return typeof obj === 'number' && obj % 1 === 0
}


/*==================格式化==================*/
const getEntryStatus = (entry) => {
  if(_.inRange(props.currentTime, entry.start_time, entry.end_time)) return 1 // 进行中
  if(props.currentTime > entry.end_time) return 2 // 已结束
  return 0 // 待开始
}

const getEntryText = (status) => {
  const mapping = {
    0: i18n.global.t('message.fast_meeting.to_start'),
    1: i18n.global.t('message.fast_meeting.in_progress'),
    2: i18n.global.t('message.fast_meeting.finished'),
    3: ''
  }
  return mapping[status]
}

const formatMeetings = () => {
  const tempList = []

  // 如果是今天，将先前的几个小时清掉
  const endTs = nextScaleTs(props.currentTime, props.scale * 60)

  tempList.push({
    start_time: props.lb,
    end_time: Math.max(endTs, props.areaLb),
    status: 3, // 已过去的时间
    text: ''
  })

  for (let entry of props.meetings) {

    // 去除不在范围内的会议
    if (entry.start_time > props.ub) continue
    if (entry.end_time < props.lb) continue

    const status = getEntryStatus(entry)

    tempList.push({
      id: entry.id,
      start_time: Math.max(entry.start_time, props.lb), // 截断越界的部分
      end_time: Math.min(props.ub, entry.end_time),
      status: status, // 待开始，进行中，已结束
      text: getEntryText(status)
    })
  }

  timeTable.value = tempList
  console.log(timeTable.value);
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
  // showToast(i18n.global.t('room.notify.full'));
  emits("update:disabled", true)
}



/*==============样式计算函数============*/

// 根据真实值计算左侧定位百分比
const handlePosition = (val) => {
  return Number(new Decimal(val).minus(props.lb).dividedBy(span.value).times(100)) + '%'
}

// 根据真实值计算左侧定位百分比（浮点数）
const handlePositionFloat = (val) => {
  return Number(new Decimal(val).minus(props.lb).dividedBy(span.value))
}

// 根据真实值计算宽度
const handleWidth = (leftVal, rightVal) => {
  return Number(new Decimal(rightVal).minus(leftVal).dividedBy(span.value).times(100)) + '%'
}


// 0.37 -> 最近的时间戳
const getNearestPercentScale = (per) => {
  const currentValue = Number(new Decimal(per).times(span.value).plus(props.lb))
  console.log(currentValue)
  return nearestScaleTs(currentValue, props.lb, props.ub, props.scale * 60)
}

/*==============手柄逻辑函数============*/
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
  return right>left && (right-left)<=(props.avaliableHours*SEC_PER_HOUR)// 严格小于，且差值不超过1
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


/*============================拖动事件：左值===========================*/
const positionLeft = ref(handlePosition(props.leftHandle))

// 监听左值变化，改变绝对定位
watch(() => props.leftHandle, (newValue, oldValue) => {
  positionLeft.value = handlePosition(newValue)


  const handleLeft = handlePositionFloat(newValue)*contentWidth.value + contentPositionLeft.value

  console.log(containerPositionLeft.value, handleLeft);

  if(handleLeft<containerPositionLeft.value) // 拖到最左边了
  {
    console.log('拖到最左边了');

    setTimeout(()=>{
      contentPositionLeft.value = clamp(contentPositionLeft.value + pxPer15Min.value ,minX.value,maxX.value)
      console.log(contentPositionLeft.value, handleLeft);
    },100)



  }

}, {
  immediate: true
})

/*================================拖动事件：右值================================*/
const positionRight = ref(handlePosition(props.rightHandle))

// 监听右值变化，改变绝对定位
watch(() => props.rightHandle, (newValue, oldValue) => {
  positionRight.value = handlePosition(newValue)

  const handleRight = handlePositionFloat(newValue)*contentWidth.value + contentPositionLeft.value
  console.log(handleRight,containerPositionRight.value);

  if(handleRight>containerPositionRight.value) // 拖到最右边了
  {
    console.log('拖到最右边了');

    setTimeout(()=>{
      contentPositionLeft.value = clamp(contentPositionLeft.value - pxPer15Min.value ,minX.value,maxX.value)
      console.log(contentPositionLeft.value, handleRight);
    },100)
  }

}, {
  immediate: true
})



var isScrolling = false // 是否正用手指滚动
var startTime = 0; // 触发惯性滚动的起始时间
var momentumStartX = 0; // 用于瞬时速度计算的滚动条位置

var startX = 0
var startY = 0
var startPosition = 0 // 起始的滚动区域位置
var isMove = false

// 立即停下动画
const stop = () => {
  // 获取当前位置并重设位置
  // uni.createSelectorQuery().select('#my-content').boundingClientRect(rect => {

  // 	contentPositionLeft.value = rect.left

  // }).exec()
  // animationDisable.value = true
  console.log(331);
}

// 超出边界时需要重置位置
const isNeedReset = () => {

  console.log('isNeedReset');

  let finalX = clamp(contentPositionLeft.value, minX.value, maxX.value)


  if (finalX !== contentPositionLeft.value) { // 最终计算的超出了边界
    contentPositionLeft.value = finalX
    animationDuration.value = 0.25
    animationCurve.value = 'cubic-bezier(.165, .84, .44, 1)'

    animationDisable.value = false
    console.log(344);
    return true;
  }

  // animationDisable.value = true
  // animationCurve.value = 'none'
  // console.log(349);
  return false;
}

// 计算滑动/回弹函数
const momentum = (current, start, duration) => {

  let type = 'noBounce';

  let overflowX;

  const distance = current - start; // 两位移差值（delta x）
  const speed = Math.abs(distance) / duration; // 瞬时速度的绝对值

  let destination = current + 2 * speed / deceleration * (distance < 0 ? -1 : 1); // 预计结束的位移值


  if (destination < minX.value) {
    overflowX = minX.value - destination;
    type = overflowX > bounceThreshold ? 'strongBounce' : 'weekBounce';
    destination = Math.max(minX.value - maxOverflowX.value, minX.value - overflowX / bounceRate);
  } else if (destination > maxX.value) {
    overflowX = destination - maxX.value;
    type = overflowX > bounceThreshold ? 'strongBounce' : 'weekBounce';
    destination = Math.min(maxX.value + maxOverflowX.value, maxX.value + overflowX / bounceRate);
    //console.log(overflowX, maxOverflowX.value, maxX.value + maxOverflowX.value, maxX.value + overflowX / bounceRate);
  }

  //console.log(type,destination,durationMap[type],bezierMap[type]);
  return {
    destination,
    duration: durationMap[type],
    bezier: bezierMap[type],
  };
}

const barTapStart = (event) => {
  event.stopPropagation();
  event.preventDefault();

  startX = (event.changedTouches?.[0].clientX) ?? event.clientX
  startY = (event.changedTouches?.[0].clientY) ?? event.clientY

  // 异步获取内部滚动元素（content）相对窗口左边缘的位置
  uni.createSelectorQuery().select('#my-content').boundingClientRect(rect => {

    // momentumStartX = startPosition = contentPositionLeft.value = rect.left
    startPosition = contentPositionLeft.value = rect.left

  }).exec()

  isMove = false // 初始是没滚动的

  // stop()

  // startTime = event.timeStamp; // 起始时间

}

const barTapMove = (event) => {

  const moveX = (event.changedTouches?.[0].clientX) ?? event.clientX
  const moveY = (event.changedTouches?.[0].clientY) ?? event.clientY


  if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) { // 滚动了
    isMove = true

    const deltaX = moveX - startX

    let tempLeft = Math.round(startPosition + deltaX) // 浮点数坐标会影响渲染速度
    // let tempLeft = startPosition + deltaX
    // console.log(startPosition);
    // console.log(tempLeft, minX.value, maxX.value);


    // 超出边界时增加阻力，只增加三分之一的位移，不直接返回
    // if (!isBetween(tempLeft, minX.value, maxX.value)) {
    // 	// console.log(416);
    // 	tempLeft = Math.round(startPosition + deltaX / 3);
    // }

    if (!isBetween(tempLeft, minX.value, maxX.value)) return // 超出边界返回

    contentPositionLeft.value = tempLeft

    // 慢滚动重设初始时间和位置
    // if (event.timeStamp - startTime > momentumTimeThreshold) {
    // 	startTime = event.timestamp;
    // 	momentumStartX = tempLeft;
    // }
  }


}

const barTapEnd = (event) => {


  if (isMove) {
    // if (isNeedReset()) return;

    // var endX = (event.changedTouches?.[0].clientX) ?? event.clientX
    // var duration = event.timeStamp - startTime; // 瞬时时间
    // var absDeltaX = Math.abs(endX - startX)

    // // 启动惯性滑动
    // if (duration < momentumTimeThreshold && absDeltaX > momentumXThreshold) {
    // 	const pack = momentum(contentPositionLeft.value, momentumStartX, duration);
    // 	contentPositionLeft.value = Math.round(pack.destination);
    // 	animationDuration.value = pack.duration;
    // 	animationCurve.value = pack.bezier;

    // 	animationDisable.value = false

    // 	console.log(457);
    // }
  } else { // 不滚动就是点选



    const fl = (startX - startPosition) / contentWidth.value;

    const tempLeftHandle = getNearestPercentScale(fl)
    const tempRightHandle = tempLeftHandle + (SEC_PER_HOUR * (props.scale / 60))

    console.log(tempLeftHandle)

    if (!fullCheck(tempLeftHandle, tempRightHandle)) return

    // 改值
    emits('update:leftHandle', tempLeftHandle)
    emits('update:rightHandle', tempRightHandle)

  }

}

const onTransitionEnd = () => {
  // isNeedReset();
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
const selectionTranslationStart = (event) => {

  console.log(290);

  selectionStartX.value = event.changedTouches?.[0].clientX ?? event.clientX
  selectionStartLeftHr.value = props.leftHandle
  selectionStartRightHr.value = props.rightHandle

}

const selectionTranslationMove = (event) => {


  const slice = Number(new Decimal(props.scale).times(60).dividedBy(span.value).times(contentWidth.value)) // 半点
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
  leftHandleBlink.value = ''
  rightHandleBlink.value = ''
}


const handleStartX = ref(0)
const handleStartHr = ref(0)
let handleDragging = false

const handleStartLeft = (event) => {
  event.stopPropagation();
  event.preventDefault();
  handleDragging = true


  handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
  handleStartHr.value = props.leftHandle

}

const handleStartRight = (event) => {
  event.stopPropagation();
  event.preventDefault();
  handleDragging = true

  handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
  handleStartHr.value = props.rightHandle

}


const handleMoveLeft = (event) => {
  event.stopPropagation();
  event.preventDefault();

  if (!handleDragging) return

  const slice = Number(new Decimal(props.scale).times(60).dividedBy(span.value).times(contentWidth.value)) // 半点
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

  if (!handleDragging) return


  const slice = Number(new Decimal(props.scale).times(60).dividedBy(span.value).times(contentWidth.value)) // 半点
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

const handleEndLeft = (event) => {
  leftHandleBlink.value = '' // 停止拖动，不闪烁
}

const handleEndRight = (event) => {
  rightHandleBlink.value = ''
}

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
</script>

<template>
  <div>
    <div class="timeline">

      <div class="timeline-bar-container" ref="refContainer" id="my-container">

        <div :class="'timeline-content timeline-content'+(currentTheme!=='dark'?'':'-dark')"
             ref="refContent"
             id="my-content"
             :style="{width:zoomIn+'%', left:(contentPositionLeft-containerPositionLeft)+'px',transition:animationDisable?'none':('left '+animationCurve+' '+animationDuration+'s')}"
             @touchstart="barTapStart"
             @touchmove="barTapMove"
             @touchend="barTapEnd"
             @transitionend="onTransitionEnd">
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
          <div class="timeline-bar" ref="refTimeline">
            <div :class="{
							'period':true,
							'invalid': item.status===3,
							'to-start':item.status===0,
							'in-progress':item.status===1,
							'disabled':item.status===2
						  }" v-for="(item,i) in timeTable" :key="i" :style="{
						   left:handlePosition(item.start_time),
						   width:handleWidth(item.start_time,item.end_time)
						 }">{{item.text}}</div>
            <div id="my-period" class="period selecting-period" :style="{
								left:handlePosition(leftHandle),
								width:handleWidth(leftHandle,rightHandle)
							}" v-if="!disabled" @touchstart.stop="selectionTranslationStart" @touchmove.stop="selectionTranslationMove"
                 @touchend.stop="selectionTranslationEnd" />
            <div id="my-handle-left" :class="'handle handle-left ' + leftHandleBlink" :style="{left:positionLeft}"
                 v-if="!disabled" @touchstart.stop="handleStartLeft" @touchmove.stop="handleMoveLeft"
                 @touchend.stop="handleEndLeft" />
            <div id="my-handle-right" :class="'handle handle-right ' + rightHandleBlink" :style="{left:positionRight}"
                 v-if="!disabled" @touchstart.stop="handleStartRight" @touchmove.stop="handleMoveRight"
                 @touchend.stop="handleEndRight" />
          </div>
          <div class="timeline-scale">
            <div class="number no-select" v-for="(item,i) in hrArray" :key="item">
              {{(item%SEC_PER_HOUR===0)?(new Date(item*1000).getHours()):'.'}}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="time-stepper">
      <uni-icons type="minus" size="30" @click="minusHalf" v-if="!disabled"></uni-icons>

      <div class="title" v-if="!disabled">
        {{formatTimeByHM(leftHandle)}}-{{formatTimeByHM(rightHandle)}},&nbsp;{{tsDiff(leftHandle,rightHandle)}}
      </div>
      <div class="title" v-else>
        {{$t('time.not_available')}}
      </div>


      <uni-icons type="plus" size="30" @click="addHalf" v-if="!disabled"></uni-icons>

    </div>
  </div>
</template>

<style scoped lang="scss">
:root {
  --time-stepper-font-size: 16rpx;
}

.no-select {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}


.timeline {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;



  .timeline-bar-container {
    width: 100%;
    position: relative;

    .timeline-content {
      width: 100%;
      position: relative;

      &-dark {
        .tag-text {
          background-color: var(--dark-color-primary) !important;
        }

        .triangle {
          border-top: 0.4rem solid var(--dark-color-primary) !important;
        }

        .to-start {
          background-color: var(--dark-color-primary-light) !important;
        }

        .in-progress {
          background-color: var(--dark-color-danger-light) !important;
        }

        .selecting-period {
          background-color: var(--dark-color-primary) !important;
        }

        .handle {
          border: 3rpx solid var(--dark-color-primary) !important;
        }
      }



      .tags {
        position: relative;
        width: 100%;
        padding-bottom: 0.3rem;
        height: 1.3rem;

        .tag {
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translateX(-50%);

          .tag-text {
            background-color: var(--color-primary);
            border-radius: 4rpx;
            color: #fff;
            font-size: var(--time-stepper-font-size);
            padding: 0 5rpx;
            height: 20rpx;
            line-height: 20rpx;
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

      .timeline-bar {
        position: relative;
        background-color: var(--color-default);
        height: 60rpx;
        border-radius: 0.3rem;
        width: 100%;
        overflow: hidden;

        .period {
          position: absolute;
          z-index: 10;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 0.3rem;
          text-align: center;
          color: #fff;
          font-size: 10rpx;
          line-height: 60rpx;
        }

        .to-start {
          background-color: var(--color-primary-light);
        }

        .disabled {
          background-color: var(--color-disabled-1); /*稍微深一点*/

        }

        .invalid {
          background-color: var(--color-disabled);
          z-index: 9; /*下层*/
        }

        .in-progress {
          background-color: var(--color-danger-light);
        }

        .selecting-period {
          background-color: var(--color-primary);
          border-radius: 0;
          z-index: 11;
        }

        .handle {
          box-sizing: border-box;
          border-radius: 6rpx;
          border: 3rpx solid var(--color-primary);
          background-color: #fff;
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 22rpx;
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



      .timeline-scale {
        height: 30rpx;
        padding-top: 10rpx;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;

        .number {

          font-size: var(--time-stepper-font-size);
          //font-weight: 700;
          color: var(--color-secondary-text);
          transform: translateX(50%);
        }

        .number:first-of-type,
        .number:last-of-type {
          transform: none;
        }

      }
    }

  }

}

.time-stepper {
  height: 50rpx;
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  color: #333;

  .title {
    font-size: 14rpx;
    font-weight: 500;
  }
}
</style>