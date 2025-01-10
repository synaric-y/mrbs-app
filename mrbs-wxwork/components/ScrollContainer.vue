<script setup>
	import {
		onMounted,
		ref,
		watch,
		onUpdated,
		nextTick
	} from "vue";

	import _ from 'lodash'
	import {
		Decimal
	} from "decimal.js";


	const props = defineProps(["initPos", "contentWidth","timelineHeight","totalHeight","hasTag"])
	const emits = defineEmits(["touchPos", "update:contentWidth"]);


	const fringe = 20 // 左右两边的安全区
	const zoomIn = document.documentElement.clientWidth > 1024 ? 200 : 600 //大屏幕放大倍率小一点
	const zoomConstant = -((zoomIn - 100) / zoomIn)



	// ref DOM元素
	const refContainer = ref(null)
	const refContent = ref(null)


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
		'weakBounce': 0.8,
		'strongBounce': 0.4,
	};
	const bounceRate = 10; // 回弹阻力
	const bounceThreshold = 300; // 强弱回弹的分割值
	const bezierMap = {
		'noBounce': 'cubic-bezier(.17, .89, .45, 1)',
		'weakBounce': 'cubic-bezier(.25, .46, .45, .94)',
		'strongBounce': 'cubic-bezier(.25, .46, .45, .94)',
	};

	const stop = () => {
		// 获取当前 translate 的位置
		const matrix = window.getComputedStyle(refContent.value).getPropertyValue('left');
		const idx = matrix.indexOf('px')
		contentPositionLeft.value = Math.round(+matrix.substring(0, idx))
	}

	const scrollContentMouseStart = (event) => {
		event.stopPropagation();
		event.preventDefault();

		isScrolling.value = true

		// 动态计算一下边界
		minX = (zoomConstant * refContent.value.clientWidth) - fringe
		maxX = fringe

		startX = (event.changedTouches?.[0].clientX) ?? event.clientX
		startPosition = contentPositionLeft.value

		document.addEventListener('mousemove', scrollContentMouseMove, true);
		document.addEventListener('mouseup', scrollContentMouseEnd, true);
	}

	const scrollContentMouseMove = (event) => {
		event.stopPropagation();
		event.preventDefault();

		if (!isScrolling.value) return

		const deltaX = ((event.changedTouches?.[0].clientX) ?? event.clientX) - startX

		// 浮点数坐标会影响渲染速度
		let finalX = Math.round(startPosition + deltaX);

		// 超出边界时设为边界
		if (finalX > maxX) {
			finalX = maxX
		}

		if (finalX < minX) {
			finalX = minX
		}

		// 改坐标
		contentPositionLeft.value = finalX
	}

	const scrollContentMouseEnd = (event) => {
		event.stopPropagation();
		event.preventDefault();

		if (!isScrolling.value) return
		isScrolling.value = false // 不再用手指滚动了

		document.removeEventListener('mousemove', scrollContentMouseMove);
		document.removeEventListener('mouseup', scrollContentMouseEnd);
	}

	const scrollContentStart = (event) => {
		event.stopPropagation();
		event.preventDefault();

		console.log(345);

		isScrolling.value = true

		// 动态计算一下边界
		minX = (zoomConstant * refContent.value.clientWidth) - fringe
		maxX = fringe

		stop()

		startTime = event.timeStamp;
		startX = (event.changedTouches?.[0].clientX) ?? event.clientX
		momentumStartX = startPosition = contentPositionLeft.value


	}

	const scrollContentMove = (event) => {
		event.stopPropagation();
		event.preventDefault();

		if (!isScrolling.value) return

		const deltaX = ((event.changedTouches?.[0].clientX) ?? event.clientX) - startX

		// 浮点数坐标会影响渲染速度
		let finalX = Math.round(startPosition + deltaX);

		// 超出边界时增加阻力，只增加三分之一的位移
		if (finalX > maxX || finalX < minX) {
			finalX = Math.round(startPosition + deltaX / 3);
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
	const isNeedReset = () => {



		let finalX = contentPositionLeft.value

		if (finalX > fringe) {
			finalX = fringe
		} else if (finalX < (zoomConstant * refContent.value.clientWidth) - fringe) {
			finalX = (zoomConstant * refContent.value.clientWidth) - fringe
		}

		if (finalX !== contentPositionLeft.value) { // 最终计算的超出了边界
			contentPositionLeft.value = finalX
			animationDuration.value = 0.25
			animationCurve.value = 'cubic-bezier(.165, .84, .44, 1)'
			return true;
		}


		animationDuration.value = 0 // 如果没超出边界，则清除动画
		return false;
	}

	// 计算滑动/回弹函数
	const momentum = (current, start, duration) => {

		let type = 'noBounce';

		const maxOverflowX = refContent.value.clientWidth / 6; // 回弹的最大限度

		let overflowX;

		const distance = current - start;
		const speed = Math.abs(distance) / duration;

		let destination = current + 2 * speed / deceleration * (distance < 0 ? -1 : 1);


		const minX = (zoomConstant * refContent.value.clientWidth) - fringe
		const maxX = fringe

		if (destination < minX) {
			overflowX = minX - destination;
			type = overflowX > bounceThreshold ? 'strongBounce' : 'weakBounce';
			destination = Math.max(minX - maxOverflowX, minX - overflowX / bounceRate);
		} else if (destination > maxX) {
			overflowX = destination - maxX;
			type = overflowX > bounceThreshold ? 'strongBounce' : 'weakBounce';
			destination = Math.min(maxX + maxOverflowX, maxX + overflowX / bounceRate);
		}

		return {
			destination,
			duration: durationMap[type],
			bezier: bezierMap[type],
		};
	}

	const scrollContentEnd = (event) => {
		event.stopPropagation();
		event.preventDefault();

		document.removeEventListener('mousemove', scrollContentMove, true);
		document.removeEventListener('mouseup', scrollContentEnd, true);

		if (!isScrolling.value) return
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

	const onTransitionEnd = () => {
		console.log(477);
		isNeedReset();
	}


	/**
	 * 点选新时间事件
	 * 中层
	 * 不冒泡
	 * 阻止左滑刷新
	 * */
	var startY = 0
	var isMove = false
	let barTapDragging = false
	const barTapStart = (event) => {
		event.stopPropagation();
		event.preventDefault();

		startX = (event.changedTouches?.[0].clientX) ?? event.clientX
		startY = (event.changedTouches?.[0].clientY) ?? event.clientY
		startPosition = contentPositionLeft.value
		isMove = false // 初始是没滚动的

		isScrolling.value = true

		// 动态计算一下边界
		minX = (zoomConstant * refContent.value.clientWidth) - fringe
		maxX = fringe

		stop()

		startTime = event.timeStamp;
		startX = (event.changedTouches?.[0].clientX) ?? event.clientX
		momentumStartX = startPosition = contentPositionLeft.value

		barTapDragging = true
		// document.addEventListener('mousemove', barTapMove, true);
		// document.addEventListener('mouseup', barTapEnd, true);
	}

	const barTapMove = (event) => {
		event.stopPropagation();
		event.preventDefault();

		if (!barTapDragging) return

		const moveX = (event.changedTouches?.[0].clientX) ?? event.clientX
		const moveY = (event.changedTouches?.[0].clientY) ?? event.clientY


		if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) { // 滚动了
			isMove = true

			if (!isScrolling.value) return

			const deltaX = ((event.changedTouches?.[0].clientX) ?? event.clientX) - startX

			// 浮点数坐标会影响渲染速度
			let finalX = Math.round(startPosition + deltaX);

			// 超出边界时增加阻力，只增加三分之一的位移
			if (finalX > maxX || finalX < minX) {
				finalX = Math.round(startPosition + deltaX / 3);
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

	const barTapEnd = (event) => {

		event.stopPropagation();
		event.preventDefault();
		barTapDragging = false

		// document.removeEventListener('mousemove', barTapMove, true);
		// document.removeEventListener('mouseup', barTapEnd, true);

		if (!isMove) { // 不滚动就是点选

			emits('touchPos', (Number)(new Decimal(startX - startPosition).dividedBy(refContent.value
				.clientWidth))); // 抛出点击位置的百分比
			return


		} else { // 滚动的逻辑

			if (!isScrolling.value) return
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

	const barTapMouseStart = (event) => {
		event.stopPropagation();
		event.preventDefault();

		startX = (event.changedTouches?.[0].clientX) ?? event.clientX
		startY = (event.changedTouches?.[0].clientY) ?? event.clientY
		startPosition = contentPositionLeft.value
		isMove = false // 初始是没滚动的

		isScrolling.value = true

		// 动态计算一下边界
		minX = (zoomConstant * refContent.value.clientWidth) - fringe
		maxX = fringe

		startX = (event.changedTouches?.[0].clientX) ?? event.clientX

		barTapDragging = true
		document.addEventListener('mousemove', barTapMouseMove, true);
		document.addEventListener('mouseup', barTapMouseEnd, true);
	}

	const barTapMouseMove = (event) => {
		event.stopPropagation();
		event.preventDefault();

		if (!barTapDragging) return

		isMove = true

		if (!isScrolling.value) return

		const deltaX = ((event.changedTouches?.[0].clientX) ?? event.clientX) - startX

		// 浮点数坐标会影响渲染速度
		let finalX = Math.round(startPosition + deltaX);

		// 超出边界时增加阻力，只增加三分之一的位移
		if (finalX > maxX) {
			finalX = maxX
		}
		if (finalX < minX) {
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

	const barTapMouseEnd = (event) => {

		event.stopPropagation();
		event.preventDefault();
		barTapDragging = false

		document.removeEventListener('mousemove', barTapMouseMove, true);
		document.removeEventListener('mouseup', barTapMouseEnd, true);


		if (!isMove) { // 不滚动就是点选

			emits('touchPos', (Number)(new Decimal(startX - startPosition).dividedBy(refContent.value
				.clientWidth))); // 抛出点击位置的百分比
			return

		} else { // 滚动的逻辑

			if (!isScrolling.value) return
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




	const autoScroll = () => {

		if (!props.initPos) return

		const finalX = (Number)(new Decimal(props.initPos).times(refContent.value.clientWidth).minus(refContainer.value
			.clientWidth / 2).times(-1)) // -容器的一半是为了让左边有空隙

		console.log(finalX);

		// 动态计算一下边界
		minX = (zoomConstant * refContent.value.clientWidth) - fringe
		maxX = fringe


		contentPositionLeft.value = _.clamp(finalX, minX, maxX)
	}
	
	
	
	async function test(){
		animationCurve.value = bezierMap['weakBounce'] // 曲线类型
		animationDuration.value = 0.5 // 动画时间，s
		
		await nextTick()
		
		console.log(refContent.value.clientWidth);
		emits("update:contentWidth", refContent.value.clientWidth)
		
		autoScroll()
	}

	onMounted(() => {

		test()

	})
</script>

<template>
	<div class="timeline">

		<div class="timeline-bar-container" :style="{height: totalHeight}" ref="refContainer">

			<div class="timeline-content" ref="refContent"
				:style="{width:zoomIn+'%', left:contentPositionLeft+'px',transition:'left '+animationCurve+' '+animationDuration+'s',cursor:isScrolling?'grabbing':'grab'}"
				@touchstart="scrollContentStart" @touchmove="scrollContentMove" @touchend="scrollContentEnd"
				@transitionend="onTransitionEnd" @mousedown="scrollContentMouseStart">
				<div class="tags" v-if="hasTag">
					<slot name="tags"></slot>
				</div>
				<div :style="{height: timelineHeight}" class="timeline-bar" @touchstart="barTapStart" @touchmove="barTapMove" @touchend="barTapEnd"
					@mousedown="barTapMouseStart" @transitionend="onTransitionEnd">
					<slot name="timeline-bar"></slot>
				</div>
				<div class="timeline-scale">
					<slot name="timeline-scale"></slot>
				</div>
			</div>
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
				}
			}
		}
	}
</style>