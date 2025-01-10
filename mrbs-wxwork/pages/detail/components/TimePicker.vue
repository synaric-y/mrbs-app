<script setup>
	import {
		onMounted,
		ref,
		computed
	} from 'vue';
	import dayjs from 'dayjs';
	import _ from 'lodash'

	const props = defineProps(['minDate', 'maxDate', 'initialDate'])
	const emits = defineEmits(['close', 'confirm'])

	const currentValue = ref([0, 0, 0])

	const yearList = ref([])

	const monthList = ref([])

	const dayList = ref([])

	const allDayList = ref({}) // 三维数组

	onMounted(() => {
		const minObj = dayjs(props.minDate)
		const maxObj = dayjs(props.maxDate)
		const initObj = dayjs(props.initialDate)

		console.log(props.initialDate);


		let i = dayjs(props.minDate)

		while (i.isBefore(maxObj,'d') || i.isSame(maxObj,'d')) {
			if (allDayList.value[i.year()] == undefined) allDayList.value[i.year()] = {}

			if (allDayList.value[i.year()][i.month() + 1] == undefined) allDayList.value[i.year()][i.month() +
				1
			] = {}

			allDayList.value[i.year()][i.month() + 1][i.date()] = i.date()

			i = i.add(1, 'd')
		}

		// 获取当前年份对应的索引
		let yearKey = initObj.year();
		let yearIndex = _.findIndex(_.keys(allDayList.value), (item) => item == yearKey);
		let yearValue = _.keys(allDayList.value)[yearIndex]

		// 获取当前月份对应的索引
		let monthKey = initObj.month() + 1; // 月份是从 0 开始的，所以要加 1
		let monthIndex = _.findIndex(_.keys(allDayList.value[yearValue]), (item) => item == monthKey);
		let monthValue = _.keys(allDayList.value[yearValue])[monthIndex]

		// 获取当前日期对应的索引
		let dateKey = initObj.date();
		let dateIndex = _.findIndex(_.keys(allDayList.value[yearValue][monthValue]), (item) => item == dateKey);
		let dateValue = _.keys(allDayList.value[yearValue][monthValue])[dateIndex]

		currentValue.value = [yearIndex, monthIndex, dateIndex]

		console.log(currentValue.value, initObj.toDate());

		yearList.value = _.map(_.keys(allDayList.value), Number)
		monthList.value = _.map(_.keys(allDayList.value[yearList.value[yearIndex]]), Number)
		dayList.value = _.map(_.keys(allDayList.value[yearList.value[yearIndex]][monthList.value[monthIndex]]), Number)

		console.log(allDayList.value);

	})


	const bindChange = (e) => {
		const arr = e.detail.value

		currentValue.value[0] = arr[0]
		currentValue.value[1] = arr[1]
		currentValue.value[2] = arr[2]

		const targetYear = yearList.value[arr[0]]
		const targetMonth = monthList.value[arr[1]]

		yearList.value = _.map(_.keys(allDayList.value), Number)
		monthList.value = _.map(_.keys(allDayList.value[yearList.value[arr[0]]]), Number)
		dayList.value = _.map(_.keys(allDayList.value[yearList.value[arr[0]]][monthList.value[arr[1]]]), Number)

	}

	const confirmDate = () => {

		const targetYear = yearList.value[currentValue.value[0]]
		const targetMonth = monthList.value[currentValue.value[1]]<10?('0'+monthList.value[currentValue.value[1]]):monthList.value[currentValue.value[1]]
		const targetDay = dayList.value[currentValue.value[2]]<10?('0'+dayList.value[currentValue.value[2]]):dayList.value[currentValue.value[2]]

		emits('confirm', `${targetYear}-${targetMonth}-${targetDay}`)
	}
</script>

<template>
	<div class="time-picker-content">
		<div class="btns">
			<div class="btn" @click="$emit('close')">{{$t('common.button.cancel')}}</div>
			<div class="btn btn-primary" @click="confirmDate">{{$t('common.button.confirm')}}</div>
		</div>
		<picker-view :indicator-style="'height: 50px;'" :value="currentValue" @change="bindChange" class="picker-view">
			<picker-view-column>
				<view class="item" v-for="(item,index) in yearList" :key="index">{{item}}</view>
			</picker-view-column>
			<picker-view-column>
				<view class="item" v-for="(item,index) in monthList" :key="index">{{item}}</view>
			</picker-view-column>
			<picker-view-column>
				<view class="item" v-for="(item,index) in dayList" :key="index">{{item}}</view>
			</picker-view-column>
		</picker-view>
	</div>
</template>

<style lang="scss" scoped>
	.time-picker-content {
		background-color: #fff;
		border-radius: 0.2rem 0.2rem 0 0;
		padding: 0;
	}

	.btns {

		display: flex;
		border-bottom: 0.1rem solid #eee;
		border-radius: 0.2rem 0.2rem 0 0;

		.btn {
			flex: 1;
			text-align: center;
			font-size: 1rem;
			line-height: 3;
		}
		
		.btn:hover{
			cursor: pointer;
			background-color: #f3f3f3;
		}

		.btn-primary {
			color: var(--color-primary)
		}
	}

	.picker-view {
		width: 100%;
		height: 40vh;
		padding: 0 1rem;
	}

	.item {
		line-height: 3;
		text-align: center;
	}
</style>