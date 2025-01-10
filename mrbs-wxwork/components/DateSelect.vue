<script setup>
import {onMounted, ref, toRef, watch, computed} from "vue";
import dayjs from "dayjs";
import _ from 'lodash'
import {getDateListOfNLength} from '@/utils/dateTool.js'

// 常量，今天到14天以后
const minDate = ref(dayjs().format('YYYY-MM-DD'))
const maxDate = ref(dayjs().add(14,'d').format('YYYY-MM-DD'))

// 双向绑定的属性
const props = defineProps(['currentTime','currentDate'])
const emits = defineEmits(["update:currentDate","manualSelectDate"]); // 双向绑定

// 显示日历
const showDateSelect = computed(()=>{
	return getDateListOfNLength(15,props.currentTime)
})

const dateList = ref([])


// 日历选择
const onConfirmDate = (value) => {
  // showDateSelect.value = false;
  
  const date = dayjs(value.year+'-'+value.month+'-'+value.date,'YYYY-MM-DD').toDate()
  changeDate(date)
  scrollDate(date) // 滚到选择的日期
};

const changeDate = (val)=>{
  emits('update:currentDate',val)
  emits("manualSelectDate")
}

onMounted(()=>{
  dateList.value = getDateListOfNLength(15,props.currentTime) //初始化列表
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

var isScrolling = ref(false) // 是否正用手指滚动
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
	
  const day1 = dayjs(beg).startOf('day')
  const day2 = dayjs(minDate.value).startOf('day')
  
  const diff = day1.diff(day2, 'day')
	
  let temp = (diff / 15 * -1)  * (refContent.value.clientWidth)


  contentPositionLeft.value = _.clamp(temp,(-refContainer.value.clientWidth),0)
}

const stop = ()=>{
  // 获取当前 translate 的位置
  const matrix = window.getComputedStyle(refContent.value).getPropertyValue('left');
  const idx = matrix.indexOf('px')
  contentPositionLeft.value = Math.round(+matrix.substring(0, idx))
}

const scrollContentMouseStart = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  console.log(171)

  isScrolling.value = true
  isMove = false

  console.log(176)

  // 动态计算一下边界
  minX = (-1/2*refContent.value.clientWidth)
  maxX = 0

  console.log(182)

  startX = (event.changedTouches?.[0].clientX) ?? event.clientX
  startY = (event.changedTouches?.[0].clientY) ?? event.clientY
  startPosition = contentPositionLeft.value

  console.log(188)

  document.addEventListener('mousemove', scrollContentMouseMove,true);
  document.addEventListener('mouseup', scrollContentMouseEnd, true);

  console.log(193)
}

const scrollContentMouseMove = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  console.log(191)

  if(!isScrolling.value) return

  const deltaX = ((event.changedTouches?.[0].clientX) ?? event.clientX) - startX
  const deltaY = ((event.changedTouches?.[0].clientY) ?? event.clientY) - startY

  if(Math.abs(deltaX) > Math.abs(deltaY)) isMove = true


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

}

const scrollContentMouseEnd = (event)=>{
  event.stopPropagation();
  event.preventDefault();

  console.log(222)

  if(!isScrolling.value) return
  isScrolling.value = false // 不再用手指滚动了

  console.log(227)

  if(!isMove){
    changeDate(dateList.value[nearestDateIdx(startX)].date)
  }



  document.removeEventListener('mousemove', scrollContentMouseMove, true);
  document.removeEventListener('mouseup', scrollContentMouseEnd, true);

}

const scrollContentStart = (event)=>{

  console.log(236)

  event.stopPropagation();
  event.preventDefault();

  isScrolling.value = true
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

  if(!isScrolling.value) return

  console.log(268)

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
  console.log(362)
  if(!isScrolling.value) return
  isScrolling.value = false // 不再用手指滚动了

  console.log(366)

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

const isDateSelected = (val)=>{
	const dayObj1 = dayjs(val)
	const dayObj2 = dayjs(props.currentDate)
	return dayObj1.isSame(dayObj2,'d')
}

</script>

<template>
  <div class="date-wrapper">
    <div class="date-container" ref="refContainer">
      <div class="date-content"
           ref="refContent"
           :style="{left:contentPositionLeft+'px',transition:'left '+animationCurve+' '+animationDuration+'s',cursor:isScrolling?'grabbing':'grab'}"
           @touchstart="scrollContentStart"
           @touchmove="scrollContentMove"
           @touchend="scrollContentEnd"
           @mousedown="scrollContentMouseStart"
           @transitionend="onTransitionEnd"
      >
        <div
            :class="{'date':true,'date-selected':isDateSelected(item.date)}"
            v-for="(item,i) in dateList"
            :key="i"
        >
          <div class="text">{{item.text}}</div>
          <div class="text">{{item.date.getDate()}}</div>
          <div class="decorate"></div>
        </div>

      </div>
    </div>

    <div class="icon-wrapper"  @click="$refs.calendar.open();">
		<image src="../assets/imgs/calendar.png" class="icon" />
	</div>
		        
  </div>
				<uni-calendar
					ref="calendar"
					:insert="false"
					:start-date="minDate"
					:end-date="maxDate"
					@confirm="onConfirmDate"
					 />

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

  .icon-wrapper{
    width: 3rem;
    height: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    cursor: pointer;
	
	.icon{
		width: 1.5rem;
		height: 1.5rem;
	}
  }
}
</style>