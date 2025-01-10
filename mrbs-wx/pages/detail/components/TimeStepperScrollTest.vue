<script setup>
	import {
		computed,
		onMounted,
		ref,
	} from "vue";
	import {
		fullCheck,
		isLeftHandleValid,
		isRightHandleValid
	} from "@/utils/arrayChecking";
	import ScrollContainer from "@/components/ScrollContainer.vue";

	import {
		i18n
	} from '@/i18n/index';
	import _ from 'lodash'
	import {
		Decimal
	} from "decimal.js";
	import {
		generateTsSequence,
		nearestScaleTs,
		ceilScaleTs
	} from "@/utils/timestampTool.js";
	import {
		tsDiff2hms,
		ts2hhmm
	} from '@/utils/timeCoersionTool.js'
	import {
		SEC_PER_HOUR,
		SEC_PER_MINUTE,
	} from '@/constants/time.js'
	import {
		findNextLargerTime,
		findPreviousSmallerTime
	} from "@/utils/arraySearching.js";
	import dayjs from "dayjs";
	import {
		showToast,
		showModal
	} from '@/utils/display.js'
	import {
		formatMeetings
	} from "@/utils/meeting";

	const fringe = 20 // 左右两边的安全区

	// 两手柄css闪烁类
	const leftHandleBlink = ref('')
	const rightHandleBlink = ref('')

	const contentWidth = ref(100) // 实际内容长度，双向绑定


	const props = defineProps(['lb', 'ub', 'meetings', 'leftHandle', 'rightHandle', 'currentDate', 'disabled', 'isFirst',
		'scale', 'currentTime'
	])
	const emits = defineEmits(["update:leftHandle", "update:rightHandle", "update:disabled"]);

	// 转换成ref变量
	const timeTable = ref(props.meetings); // 保持响应式连接

	const span = ref(props.ub - props.lb)
	const resolution = ref(props.scale * SEC_PER_MINUTE) // 最小间隔秒数
	const hrArray = ref([])
	
	console.log(props)


	/**
	 * left: 左值 ts
	 * right: 右值 ts
	 */
	function wrappedFullCheck(left, right) {
		return fullCheck(left, right, timeTable.value, props.lb, props.ub, resolution.value)
	}



	//===================================初始时间========================================
	
	const getInitialHandle = () => {

		let left = props.lb
		let right = left + resolution.value

		if (wrappedFullCheck(left, right)) {
			emits('update:leftHandle', left)
			emits('update:rightHandle', right)
			return
		}

		
		for(let entry of timeTable.value){
			left = ceilScaleTs(entry.end_time, resolution.value) // 尝试从各个时间段的右边开始
			right = left + resolution.value
			
			if (wrappedFullCheck(left, right)) {
				emits('update:leftHandle', left)
				emits('update:rightHandle', right)
				return
			}
		}


		// 还是找不到，就报错
		showToast(i18n.global.t('room.notify.full'));
		emits("update:disabled", true)
	}

	//===================================点新时间========================================

	const changeLeft = (fl) => {
		
		function getNearestPercentScale(per){
		  const currentTs = Number(new Decimal(per).times(span.value).plus(props.lb))
		  return nearestScaleTs(currentTs, props.lb, props.ub, resolution.value)
		}
		
		const tempLeftHandle = getNearestPercentScale(fl)
		const tempRightHandle = tempLeftHandle + resolution.value
		
		if(!wrappedFullCheck(tempLeftHandle,tempRightHandle)) return
		
		// 改值
		emits('update:leftHandle', tempLeftHandle)
		emits('update:rightHandle', tempRightHandle)
	}

	//===================================整体平移========================================
	
	const selectionStartX = ref(0) // 起始鼠标坐标 (x)
	const selectionStartLeftHr = ref(0) // 起始左值 (ts)
	const selectionStartRightHr = ref(0) // 起始右值 (ts)
	const selectionTranslationDragging = ref(false) // 是否正在拖动(boolean)
	
	const selectionTranslationStart = (event) => {

		event.stopPropagation();
		event.preventDefault();

		selectionTranslationDragging.value = true
		selectionStartX.value = event.changedTouches?.[0].clientX ?? event.clientX
		selectionStartLeftHr.value = props.leftHandle
		selectionStartRightHr.value = props.rightHandle

	}

	const selectionTranslationMove = (event) => {
		event.stopPropagation();
		event.preventDefault();
		
		const currentX = event.changedTouches?.[0].clientX ?? event.clientX
		const diff = currentX - selectionStartX.value

		const slice = Number(new Decimal(resolution.value).dividedBy(span.value).times(contentWidth.value)) // 半点
		const sliceCnt = Math.trunc(diff / slice) // 平移的半小时个数

		// console.log(diff,slice,resolution.value,span.value,contentWidth.value,sliceCnt)


		let tempLeftHandle = selectionStartLeftHr.value + sliceCnt * resolution.value // 临时变量，新的左右值
		const nearestSec = nearestScaleTs(tempLeftHandle, props.lb, props.ub, resolution.value) // 向后取整
		tempLeftHandle = nearestSec

		const tempRightHandle = selectionStartRightHr.value + sliceCnt * resolution.value


		if (!wrappedFullCheck(tempLeftHandle, tempRightHandle)) { // 两手柄条件错误则返回
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
		leftHandleBlink.value = ''
		rightHandleBlink.value = ''
		
	}

	//===================================手柄拖动========================================

	const handleStartX = ref(0) // 开始拖动时，鼠标的初始位置 (x)
	const handleStartHr = ref(0) // 左手柄初始时间戳 (ts)
	const handleDragging = ref(false) // 是否正在拖动 (boolean)
	
	// 计算停下地方的最近的整秒
	const stopSec = (stopX)=>{
		const finalSec = (Number)
			(new Decimal(stopX - handleStartX.value)
				.dividedBy(contentWidth.value)
				.times(span.value)
				.plus(handleStartHr.value).floor()) // 当前停下的地方的秒数
				
		const nearestSec = nearestScaleTs(finalSec, props.lb, props.ub, resolution.value)
		
		return nearestSec
	}
	
	// 处理左手柄拖动结果
	const leftHandleStop = (stopX)=>{
		
		let tempHandle = stopSec(stopX)
		
		const minVal = findPreviousSmallerTime(timeTable.value, props.leftHandle, props.lb, props.ub) // 可以接受的最小值
		const maxVal = props.rightHandle - resolution.value // 可以接受的最大值
		
		leftHandleBlink.value = '' // 只有在非法的时候闪烁
		
		if (tempHandle < minVal) {
			if (props.leftHandle <= minVal) { // 已经是最小值了
				leftHandleBlink.value = 'handle-blink'
				return
			} else { // 还能设为最小值
				tempHandle = minVal
			}
		}
		
		if (tempHandle > maxVal) {
			if (props.leftHandle >= maxVal) { // 已经是最大值了
				leftHandleBlink.value = 'handle-blink'
				return
			} else { // 还能设为最大值
				tempHandle = maxVal
			}
		}
		
		emits('update:leftHandle', tempHandle)
	}
	
	// 处理右手柄拖动结果
	const rightHandleStop = (stopX)=>{
		
		let tempHandle = stopSec(stopX)
		
		const minVal = props.leftHandle + resolution.value // 可以接受的最小值
		const maxVal = findNextLargerTime(timeTable.value, props.rightHandle, props.lb, props.ub) // 可以接受的最大值
		
		rightHandleBlink.value = '' // 只有在非法的时候闪烁
		
		if (tempHandle < minVal) {
			if (props.rightHandle <= minVal) { // 已经是最小值了
				rightHandleBlink.value = 'handle-blink'
				return
			} else { // 还能设为最小值
				tempHandle = minVal
			}
		}
		
		if (tempHandle > maxVal) {
			if (props.rightHandle >= maxVal) { // 已经是最大值了
				rightHandleBlink.value = 'handle-blink'
				return
			} else { // 还能设为最大值
				tempHandle = maxVal
			}
		}
		
		emits('update:rightHandle', tempHandle)
	}
	
	//===================================左手柄========================================

	const handleStartLeft = (event) => {
		event.stopPropagation();
		event.preventDefault();
		
		handleDragging.value = true
		handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
		handleStartHr.value = props.leftHandle
		
	}
	
	const handleMoveLeft = (event) => {
		event.stopPropagation();
		event.preventDefault();
	
		if (!handleDragging.value) return
	
		const currentX = (event.changedTouches?.[0].clientX) ?? event.clientX
		leftHandleStop(currentX)
	}
	
	const handleEndLeft = (event) => {
		event.stopPropagation();
		event.preventDefault();
	
		leftHandleBlink.value = '' // 停止拖动，不闪烁
		handleDragging.value = false
	}

	//===================================右手柄========================================

	const handleStartRight = (event) => {
		event.stopPropagation();
		event.preventDefault();
		
		handleDragging.value = true
		handleStartX.value = (event.changedTouches?.[0].clientX) ?? event.clientX
		handleStartHr.value = props.rightHandle
	}


	const handleMoveRight = (event) => {
		event.stopPropagation();
		event.preventDefault();

		if (!handleDragging.value) return

		const currentX = (event.changedTouches?.[0].clientX) ?? event.clientX
		rightHandleStop(currentX)
	}


	const handleEndRight = (event) => {
		event.stopPropagation();
		event.preventDefault();

		rightHandleBlink.value = ''
		handleDragging.value = false
	}


	// ========================================样式计算============================================
	
	// 根据真实值计算左侧定位百分比
	const handlePosition = (val) => {
		return Number(new Decimal(val).minus(props.lb).dividedBy(span.value).times(100)) + '%'
	}
	
	// 根据真实值计算宽度
	const handleWidth = (leftVal, rightVal) => {
		return Number(new Decimal(rightVal).minus(leftVal).dividedBy(span.value).times(100)) + '%'
	}

	// 左值渲染坐标(%)
	const positionLeft = computed(()=>{
		return handlePosition(props.leftHandle)
	})
	
	// 右值渲染坐标(%)
	const positionRight = computed(()=>{
		return handlePosition(props.rightHandle)
	})
	
	// 初始滚动条坐标(%)
	const initPos = (Number)(new Decimal((props.isFirst?props.currentTime:props.leftHandle) - props.lb).dividedBy(span.value))
	  
	

	// ========================================加减号============================================
	
	const addHalf = (e) => {
		const rightHr = props.rightHandle + resolution.value
		if (!wrappedFullCheck(props.leftHandle, rightHr)) {
			rightHandleBlink.value = ''
			setTimeout(() => {
				rightHandleBlink.value = 'handle-blink-temp'
			}, 100); // 0.1s后刷新动画
			return
		}


		emits('update:rightHandle', rightHr)
	}

	const minusHalf = (e) => {
		const rightHr = props.rightHandle - resolution.value
		if (!wrappedFullCheck(props.leftHandle, rightHr)) {
			rightHandleBlink.value = ''
			setTimeout(() => {
				rightHandleBlink.value = 'handle-blink-temp'
			}, 100); // 0.1s后刷新动画

			return
		}

		emits('update:rightHandle', rightHr)
	}

	onMounted(() => {

		// 初始化刻度
		hrArray.value = generateTsSequence(props.lb, props.ub, resolution.value)

		// 初始化时间条
		timeTable.value = formatMeetings(props.currentDate, props.currentTime, props.lb, props.ub, props.meetings)

		// 非编辑状态则尝试初始化手柄
		if(props.isFirst) getInitialHandle() 

	})


	
</script>

<template>
	<div>

		<ScrollContainer :initPos="initPos" :totalHeight="'7rem'" :timelineHeight="'2.5rem'" :hasTag="true"
			v-model:contentWidth="contentWidth" @touchPos="changeLeft">

			<template #tags>

				<div class="tag tag-left" :style="{left:handlePosition(leftHandle)}" v-if="!disabled">
					<div class="tag-text no-select">{{ts2hhmm(leftHandle)}}</div>
					<div class="triangle"></div>
				</div>
				<div class="tag tag-right" :style="{left:handlePosition(rightHandle)}" v-if="!disabled">
					<div class="tag-text no-select">{{ts2hhmm(rightHandle)}}</div>
					<div class="triangle"></div>
				</div>
			</template>

			<template #timeline-bar>
				<div :class="['period',item.className]" v-for="(item,i) in timeTable" :key="i" :style="{
			          left:handlePosition(item.start_time),
			          width:handleWidth(item.start_time,item.end_time)
			       }">{{ (item.end_time-item.start_time>resolution)?item.text:''}}</div>
				<div class="period selecting-period" v-if="!disabled" :style="{
			          left:handlePosition(leftHandle),
			          width:handleWidth(leftHandle,rightHandle)
			        }" @touchstart.stop="selectionTranslationStart" @touchmove.stop="selectionTranslationMove"
					@touchend.stop="selectionTranslationEnd"/>
				<div :class="'handle handle-left ' + leftHandleBlink" v-if="!disabled"
					:style="{left:positionLeft,cursor:'pointer'}" @touchstart.stop="handleStartLeft"
					@touchmove.stop="handleMoveLeft" @touchend.stop="handleEndLeft"/>
				<div :class="'handle handle-right ' + rightHandleBlink" v-if="!disabled"
					:style="{left:positionRight,cursor:'pointer'}" @touchstart.stop="handleStartRight"
					@touchmove.stop="handleMoveRight" @touchend.stop="handleEndRight"/>
			</template>

			<template #timeline-scale>
				<div :class="{
	  				'number':true,
	  				'no-select':true,
	  				'dot': (item%SEC_PER_HOUR!==0),
	  				'hour': (item%SEC_PER_HOUR===0)
	  			 }" :style="'left:'+(i/(hrArray.length-1))*100+'%;'" v-for="(item,i) in hrArray" :key="item">
					{{(item%SEC_PER_HOUR===0)?(new Date(item*1000).getHours()):'.'}}
				</div>
			</template>
		</ScrollContainer>



		<div class="time-stepper">
			<uni-icons style="cursor: pointer;" type="minus" size="30" @click="minusHalf"></uni-icons>

			<div class="title" v-if="!disabled">
				{{ts2hhmm(leftHandle)}}-{{ts2hhmm(rightHandle)}},&nbsp;{{tsDiff2hms(leftHandle,rightHandle)}}
			</div>
			<div class="title" v-else>
				{{$t('time.notAvailable')}}
			</div>

			<uni-icons style="cursor: pointer;" type="plus" size="30" @click="addHalf"></uni-icons>

		</div>
	</div>
</template>

<style scoped lang="scss">
	.timeline {
		width: 100%;
		display: flex;
		flex-direction: column;





		.timeline-bar-container {
			width: 100%;
			height: 7rem;
			overflow: hidden;
			position: relative;

			.timeline-content {
				width: 500%;
				position: relative;


				.tags {
					position: relative;
					width: 100%;
					padding-bottom: 0.3rem;
					height: 1.3rem;

					
				}

				.timeline-bar {
					position: relative;
					background-color: var(--color-default);
					height: 2.5rem;
					border-radius: 0.3rem;
					width: 100%;

					

				}



				.timeline-scale {
					height: 2.5rem;
					width: 100%;
					position: relative;
					// display: flex;
					// flex-direction: row;
					// justify-content: space-between;

					

				}
			}

		}



	}
	
	
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
	
	
	.period {
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
	
	.to-start {
		background-color: var(--color-primary-light);
	}
	
	.disabled {
		background-color: var(--color-canceled);
		color: var(--color-regular-text)
	}
	
	.overdue {
		background-color: var(--color-disabled);
	}
	
	.in-progress {
		background-color: var(--color-danger-light);
	}
	
	.selecting-period {
		background-color: var(--color-primary);
		border-radius: 0;
		z-index: 11;
		cursor: pointer;
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
	
	
	.number {
		position: absolute;
		top: 0;
		line-height: 2;
		font-size: 0.75rem;
		//font-weight: 700;
		color: var(--color-secondary-text);
	
	}
	
	.hour {
		transform: translateX(-50%);
	}
	
	.dot {
	
		transform: translateX(50%);
	}
	
	.number:first-of-type,
	.number:last-of-type {
		transform: none;
	}

	.time-stepper {
		display: flex;
		height: 3rem;
		align-items: center;
		flex-direction: row;
		justify-content: space-between;
		border-bottom: 0.05rem solid var(--color-border);
		color: var(--color-regular-text);

		.title {
			font-weight: 700;
			font-size: 1rem;
			color: var(--color-heading);
		}
	}
</style>