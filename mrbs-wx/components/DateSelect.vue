<script setup>
	import {
		onMounted,
		ref,
		toRef,
		watch,
		computed
	} from "vue";
	import dayjs from "dayjs";
	import _ from 'lodash'
	import {
		getDateListOfNLength
	} from '@/utils/dateTool.js'

	// 常量，今天到14天以后
	const minDate = ref(dayjs().format('YYYY-MM-DD'))
	const maxDate = ref(dayjs().add(14, 'd').format('YYYY-MM-DD'))

	// 双向绑定的属性
	const props = defineProps(['currentTime', 'currentDate'])
	const emits = defineEmits(["update:currentDate", "manualSelectDate"]); // 双向绑定

	// 显示日历
	const showDateSelect = computed(() => {
		return getDateListOfNLength(15, props.currentTime)
	})

	const dateList = ref([])


	// 日历选择
	const onConfirmDate = (value) => {
		// showDateSelect.value = false;

		const date = dayjs(value.year + '-' + value.month + '-' + value.date, 'YYYY-MM-DD').toDate()
		changeDate(date)
		scrollDate(date) // 滚到选择的日期
	};
	
	const changeDate = (val)=>{
		emits('update:currentDate', val)
		emits("manualSelectDate")
	}

	defineExpose({
		changeDate: ({idx}) => {
		
			console.log(idx);
			const val = dateList.value[idx].date
		
			emits('update:currentDate', val)
			emits("manualSelectDate")
		}
	})

	onMounted(() => {
		dateList.value = getDateListOfNLength(15, props.currentTime) //初始化列表
		// scrollDate(props.currentDate)
	})


	const scrollDate = (beg) => {

		//  const day1 = dayjs(beg).startOf('day')
		//  const day2 = dayjs(minDate.value).startOf('day')

		//  const diff = day1.diff(day2, 'day')

		//  let temp = (diff / 15 * -1)  * (refContent.value.clientWidth)


		//  contentPositionLeft.value = _.clamp(temp,(-refContainer.value.clientWidth),0)
	}

	const isDateSelected = (val) => {
		const dayObj1 = dayjs(val)
		const dayObj2 = dayjs(props.currentDate)
		return dayObj1.isSame(dayObj2, 'd')
	}
</script>



<template>
	<div class="date-wrapper">
		<div class="date-container" id="my-container">
			<div class="date-content" id="my-content" @touchstart="date.touchstart"
				@touchmove="date.touchmove" @touchend="date.touchend" @transitionend="date.transitionend">
				<div :class="{'date':true,'date-selected':isDateSelected(item.date)}" v-for="(item,i) in dateList"
					:key="i">
					<div class="text">{{item.text}}</div>
					<div class="text">{{item.date.getDate()}}</div>
					<div class="decorate"></div>
				</div>

			</div>
		</div>

		<div class="icon-wrapper" @click="$refs.calendar.open();">
			<image src="../assets/imgs/calendar.png" class="icon" />
		</div>

	</div>
	<uni-calendar ref="calendar" :insert="false" :start-date="minDate" :end-date="maxDate" @confirm="onConfirmDate" />

</template>

<script module="date" lang="wxs">
	var startX = 0
	var lastLeft = 0;
	var minX = 0 // 最小的left（负数，2/3个content的宽度+20）
	var maxX = 0 // 最大的left（正数，20）
	var fringe = 20 // 左右两边的安全区
	var zoomIn = 200 //大屏幕放大倍率小一点
	var zoomConstant = -((zoomIn - 100) / zoomIn)
	var contentWidth = 0 // 内容区宽度
	var contentLeft = 0 // 内容离左边的距离
	var containerLeft = 0 // 容器离左边的距离
	var moved = false
	var startTime = 0 // 开始点击时间戳
	var momentumStartX = 0
	var startPosition = 0 // 开始点击content左偏移量

	var deceleration = 0.003; // 惯性滚动的加速度常量
	var momentumTimeThreshold = 300; // 触发惯性滚动的最大时长，ms
	var momentumXThreshold = 15; // 触发惯性滚动的最小位移距离，px
	var durationMap = {
		'noBounce': 2.5,
		'weakBounce': 0.8,
		'strongBounce': 0.4,
	};
	var bounceRate = 10; // 回弹阻力
	var bounceThreshold = 300; // 强弱回弹的分割值
	var bezierMap = {
		'noBounce': 'cubic-bezier(.17, .89, .45, 1)',
		'weakBounce': 'cubic-bezier(.25, .46, .45, .94)',
		'strongBounce': 'cubic-bezier(.25, .46, .45, .94)',
	};

	// 超出边界时需要重置位置
	function isNeedReset(event, ins) {
		
		console.log(contentLeft,maxX,minX);

		var finalX = contentLeft

		if (finalX > maxX) {
			finalX = maxX
		} else if (finalX < minX) {
			finalX = minX
		}

		if (finalX !== contentLeft) { // 最终计算的超出了边界
			contentLeft = finalX
			console.log(contentLeft);

			ins.selectComponent('#my-content').setStyle({
				left: contentLeft+'px',
				transition: 'left cubic-bezier(.165, .84, .44, 1) 0.25'+'s'
			})
			return true;
		}


		// 如果没超出边界，则清除动画
		// ins.selectComponent('#my-content').setStyle({
		// 	transition: 'left cubic-bezier(.165, .84, .44, 1) 0'+'s'
		// })

		return false;
	}


	// 计算滑动/回弹函数
	function momentum(current, start, duration) {

		var type = 'noBounce';

		var maxOverflowX = contentWidth / 6; // 回弹的最大限度

		var overflowX;

		var distance = current - start;
		var speed = Math.abs(distance) / duration;

		var destination = current + 2 * speed / deceleration * (distance < 0 ? -1 : 1);


		if (destination < minX) {
			overflowX = minX - destination;
			
			if(overflowX > bounceThreshold){
				type = 'strongBounce'
			}else{
				type = 'weakBounce'
			}
			
			destination = Math.max(minX - maxOverflowX, minX - overflowX / bounceRate);
		} else if (destination > maxX) {
			overflowX = destination - maxX;
			
			if(overflowX > bounceThreshold){
				type = 'strongBounce'
			}else{
				type = 'weakBounce'
			}
			
			destination = Math.min(maxX + maxOverflowX, maxX + overflowX / bounceRate);
		}
		
		var res = {
			destination: destination,
			duration: durationMap[type],
			bezier: bezierMap[type],
		}

		return res
	}

	function touchstart(event, ins) {
		console.log("touchstart")

		moved = false
		var touch = event.touches[0] || event.changedTouches[0]
		startX = touch.pageX

		var a = ins.selectComponent('#my-content').getBoundingClientRect()
		contentWidth = Math.round(a.width)

		var b = ins.selectComponent('#my-container').getBoundingClientRect()
		containerLeft = Math.round(b.left)

		console.log(containerLeft);

		minX = (zoomConstant * contentWidth) - fringe
		maxX = fringe



		// 获取当前 translate 的位置
		var c = ins.selectComponent('#my-content').getBoundingClientRect()
		var l = Math.round(c.left)
		contentLeft = l
		// ins.selectComponent('#my-content').setStyle({
		// 	left: l + 'px'
		// })

		startTime = event.timeStamp;
		momentumStartX = startPosition = a.left


		return false

	}

	function touchmove(event, ins) {
		console.log("touchmove")
		moved = true
		var touch = event.touches[0] || event.changedTouches[0]
		var pageX = touch.pageX


		// 浮点数坐标会影响渲染速度
		var deltaX = Math.round(pageX - startX)
		var finalX = Math.round(startPosition + deltaX);


		// 超出边界时增加阻力，只增加三分之一的位移
		if (finalX > maxX || finalX < minX) {
			finalX = Math.round(startPosition + deltaX / 3);
		}


		ins.selectComponent('#my-content').setStyle({
			left: finalX + 'px'
		})

		contentLeft = finalX

		// 慢滚动重置初始时间和位置
		if (event.timeStamp - startTime > momentumTimeThreshold) {
			startTime = event.timestamp;
			momentumStartX = finalX;
		}

		return false
	}


	function touchend(event, ins) {

		if (!moved) {
			var temp = Math.round((-contentLeft - containerLeft + startX) / contentWidth * 15)
			if (temp < 0) temp = 0
			if (temp > 14) temp = 14
		
		
			ins.callMethod('changeDate', {idx: temp})
		}
		

		if (isNeedReset(event, ins)) return;

		var touch = event.touches[0] || event.changedTouches[0]
		var endX = touch.pageX

		var duration = event.timeStamp - startTime; // 瞬时时间
		var s1 = endX - startX; // 瞬时位移
		var absDeltaX = Math.abs(s1)

		// 启动惯性滑动
		if (duration < momentumTimeThreshold && absDeltaX > momentumXThreshold) {
			var pack = momentum(contentLeft, momentumStartX, duration);
			contentLeft = Math.round(pack.destination);

			ins.selectComponent('#my-content').setStyle({
				left: contentLeft + 'px',
				transition: 'left ' + pack.bezier + ' ' + pack.duration+'s'
			})

		}

	}

	module.exports = {
		touchstart: touchstart,
		touchmove: touchmove,
		touchend: touchend,
		transitionend: isNeedReset
	}
</script>

<style scoped lang="scss">
	.date-wrapper {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		width: 100%;


		.date-container {
			position: relative;
			width: 100%;
			overflow: hidden;
			height: 3.5rem;

			.date-content {
				position: absolute;
				top: 0;
				left: 0;
				display: flex;
				width: 200%;
				font-size: 0.75rem;

				.date {
					flex: 1;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					align-items: center;
					gap: 0.4rem;
					color: var(--color-regular-text);
					transition: background-color linear 0.35s;



					.decorate {
						background-color: transparent;
						height: 0.2rem;
						width: 90%;

						//border-radius: 0.15rem;
						transition: background-color linear 0.35s;
					}
				}

				.date-selected {
					color: var(--color-selected);

					.decorate {
						background-color: var(--color-selected);
					}
				}
			}


		}

		.icon-wrapper {
			width: 3rem;
			height: 100%;
			display: flex;
			justify-content: flex-end;
			align-items: center;
			cursor: pointer;

			.icon {
				width: 1.5rem;
				height: 1.5rem;
			}
		}
	}
</style>