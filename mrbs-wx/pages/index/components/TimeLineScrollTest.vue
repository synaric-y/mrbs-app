<script setup>
	import {
		computed,
		onMounted,
		ref,
		watch
	} from "vue";
	import {
		fullCheck
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
		ceilScaleTs,
	} from "@/utils/timestampTool.js";
	import {
		SEC_PER_HOUR,
		SEC_PER_MINUTE,
	} from '@/constants/time.js'
	import {
		formatMeetings
	} from "@/utils/meeting";

	const contentWidth = ref(100) // 实际内容长度，双向绑定


	const props = defineProps(['lb','ub','meetings','currentDate','currentTime','scale','full'])
	const emits = defineEmits(['update:full']) // 双向绑定

	// 转换成ref变量
	const timeTable = ref(props.meetings); // 保持响应式连接

	const span = ref(props.ub - props.lb)
	const resolution = ref(props.scale * SEC_PER_MINUTE) // 最小间隔秒数
	const hrArray = ref([])


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

		if (wrappedFullCheck(left, right)) return

		
		for(let entry of timeTable.value){
			left = ceilScaleTs(entry.end_time, resolution.value) // 尝试从各个时间段的右边开始
			right = left + resolution.value
			
			if (wrappedFullCheck(left, right)) return
		}


		// 还是找不到，就报错
		emits("update:full", true)
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

	// 初始滚动条坐标(%)
	const initPos = computed(()=>{
		return (Number)(new Decimal(props.currentTime - props.lb).dividedBy(span.value))
	})
	

	onMounted(() => {

		// 初始化刻度
		hrArray.value = generateTsSequence(props.lb, props.ub, resolution.value)

		// 初始化时间条
		timeTable.value = formatMeetings(props.currentDate, props.currentTime, props.lb, props.ub, props.meetings)

		// 判断是否约满
		getInitialHandle() 

	})


	
</script>

<template>
	<div>

		<ScrollContainer :initPos="initPos" :totalHeight="'3rem'" :timelineHeight="'1rem'" :hasTag="false"
			v-model:contentWidth="contentWidth">

			<template #timeline-bar>
				<div :class="['period',item.className]" v-for="(item,i) in timeTable" :key="i" :style="{
			          left:handlePosition(item.start_time),
			          width:handleWidth(item.start_time,item.end_time)
			       }"></div>
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
	
	
	.number {
		position: absolute;
		display: inline;
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
</style>