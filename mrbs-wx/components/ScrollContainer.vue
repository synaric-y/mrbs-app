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

	import {
		getCurrentInstance
	} from 'vue';
	const instance = getCurrentInstance();

	const query = uni.createSelectorQuery().in(instance.proxy);



	const props = defineProps(["initPos", "contentWidth", "timelineHeight", "totalHeight", "hasTag"])
	const emits = defineEmits(["touchPos", "update:contentWidth"]);


	const fringe = 20 // 左右两边的安全区
	const zoomIn = 600 //大屏幕放大倍率小一点
	const zoomConstant = -((zoomIn - 100) / zoomIn)



	// ref DOM元素
	const refContainer = ref(null)
	const refContent = ref(null)

	const containerWidth = ref(100)
	const contentWidth = ref(600)

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


	const scrollContentStart = (event) => {
		event.stopPropagation();
		event.preventDefault();

		isScrolling.value = true

		startX = (event.changedTouches?.[0].clientX) ?? event.clientX
	}

	const scrollContentMove = (event) => {
		event.stopPropagation();
		event.preventDefault();

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


	}

	const scrollContentEnd = (event) => {
		event.stopPropagation();
		event.preventDefault();

		if (!isScrolling.value) return
		isScrolling.value = false // 不再用手指滚动了

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


		startX = (event.changedTouches?.[0].clientX) ?? event.clientX

		barTapDragging = true
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
			if (finalX > maxX) {
				finalX = maxX
			}

			if (finalX < minX) {
				finalX = minX
			}

			// 改坐标
			contentPositionLeft.value = finalX

		}

	}

	const barTapEnd = (event) => {

		event.stopPropagation();
		event.preventDefault();
		barTapDragging = false


		if (!isMove) { // 不滚动就是点选

			emits('touchPos', (Number)(new Decimal(startX - startPosition).dividedBy(contentWidth
				.value))); // 抛出点击位置的百分比
			return


		} else { // 滚动的逻辑

			if (!isScrolling.value) return
			isScrolling.value = false // 不再用手指滚动了

		}
	}


	const autoScroll = () => {

		if (!props.initPos) return

		const finalX = (Number)(new Decimal(props.initPos).times(contentWidth.value).minus(containerWidth.value / 2)
			.times(-1)) // -容器的一半是为了让左边有空隙

		contentPositionLeft.value = _.clamp(finalX, minX, maxX)
	}

	const getElementWidth = (id) => {
		return new Promise(resolve => {
			query
				.select("#" + id)
				.boundingClientRect((data) => {
					resolve(data.width)
				})
				.exec();
		})
	}



	async function test() {
		animationCurve.value = bezierMap['weakBounce'] // 曲线类型
		animationDuration.value = 0.5 // 动画时间，s

		await nextTick()

		containerWidth.value = await getElementWidth('my-container')

		contentWidth.value = await getElementWidth('my-content')

		minX = (zoomConstant * contentWidth.value) - fringe
		maxX = fringe

		console.log(containerWidth.value, contentWidth.value);
		emits("update:contentWidth", contentWidth.value)

		autoScroll()
	}

	defineExpose({
		test1: ({
			left,
			width
		}) => {
			emits('touchPos', (Number)(new Decimal(left).dividedBy(width))); // 抛出点击位置的百分比
		}
	})

	onMounted(() => {

		test()

	})
</script>

<template>
	<div class="timeline">

		<div class="timeline-bar-container" :style="{height: totalHeight}" ref="refContainer" id="my-container">

			<div class="timeline-content" id="my-content" :style="{width:zoomIn+'%'}" @touchstart="test.touchstart"
				@touchmove="test.touchmove" @touchend="test.touchend" @transitionend="test.transitionend">
				<div class="tags" v-if="hasTag">
					<slot name="tags"></slot>
				</div>
				<div :style="{height: timelineHeight}" class="timeline-bar">
					<slot name="timeline-bar"></slot>
				</div>
				<div class="timeline-scale">
					<slot name="timeline-scale"></slot>
				</div>
			</div>
		</div>
	</div>
</template>

<script module="test" lang="wxs">
	var startX = 0
	var lastLeft = 0;
	var minX = 0 // 最小的left（负数，2/3个content的宽度+20）
	var maxX = 0 // 最大的left（正数，20）
	var fringe = 20 // 左右两边的安全区
	var zoomIn = 600 //大屏幕放大倍率小一点
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
			ins.callMethod('test1', {
				left: (-contentLeft - containerLeft + startX),
				width: contentWidth
			})
			return
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