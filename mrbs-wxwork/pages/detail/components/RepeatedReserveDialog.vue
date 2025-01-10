<script setup>
	import {
		ref,
		reactive,
	} from 'vue';

	import TimePicker from './TimePicker.vue';

	import {
		i18n
	} from '@/i18n/index';
	import _ from 'lodash'
	import dayjs from "dayjs";


	import {
		showToast
	} from '@/utils/display.js'

	import {
		WEEK_LIST
	} from '@/utils/dateTool.js'

	const emits = defineEmits(['confirm', 'close'])

	const check_box_list = WEEK_LIST

	const minDate = ref(new Date()) // 今天
	const maxDate = ref(dayjs().add('90', 'd').toDate()) // 90天

	// 临时表单
	const tempMeetForm = reactive({
		interval: 1,
		days: [],
		end_date: dayjs(minDate.value).add(1, 'week').format('YYYY-MM-DD')
	})

	const validate = () => {

		if (!tempMeetForm.interval || tempMeetForm.interval < 1 || tempMeetForm.interval > 4) {
			showToast(i18n.global.t('detail.rep_form.rep_form_validate_notify.rep_interval_fail'));
			return false
		}
		if (!tempMeetForm.days || tempMeetForm.days.length == 0) {
			showToast(i18n.global.t('detail.rep_form.rep_form_validate_notify.rep_day_missing'));
			return false
		}
		if (!tempMeetForm.end_date) {
			showToast(i18n.global.t('detail.rep_form.rep_form_validate_notify.rep_end_date_missing'));
			return false
		}

		console.log(tempMeetForm)

		return true
	}



	const commit = () => {

		if (!validate()) return

		emits('confirm', {
			rep_end_date: tempMeetForm.end_date,
			rep_day: tempMeetForm.days,
			rep_interval: tempMeetForm.interval
		})
	}

	function daysChange(e) {
		tempMeetForm.days = e.detail.value
	}

	function bindEndDateChange(e) {
		tempMeetForm.end_date = e.detail.value
	}

	const timePickerRef = ref(null)
	const confirmDate = (date) => {

		timePickerRef.value.close()
		tempMeetForm.end_date = date
	}

	// 结束时间自动带入
	function intervalChange(e) {
		console.log(e);
		tempMeetForm.end_date = dayjs(minDate.value).add(e, 'week').format('YYYY-MM-DD') // 增加n周
	}
</script>

<template>
	<div style="display: flex;justify-content: center;">
		<div class="content-container">
			<div class="content">
				<div class="header">{{$t('detail.rep_form.title')}}</div>

				<div class="form">

					<div class="form-row">
						<div class="repeat-left">{{$t('detail.rep_form.rep_interval')}}</div>
						<uni-number-box v-model="tempMeetForm.interval" :min="1" :max="4"
							@change="intervalChange"></uni-number-box>
						<div class="repeat-right">{{$t('detail.rep_form.rep_interval_2')}}</div>
					</div>

					<checkbox-group @change="daysChange">
						<div class="checkbox-wrapper">
							<div class="title-wrapper" v-for="item in check_box_list" :key="item.value">
								<checkbox activeBackgroundColor="#591bb7" iconColor="#ffffff"
									activeBorderColor="#ffffff" :value="item.value"
									:checked="_.includes(tempMeetForm.days,item.value)" />
								<div class="title">{{item.label}}</div>
							</div>
						</div>
					</checkbox-group>

					<div class="form-row">
						<label for="end_date">{{$t('detail.rep_form.rep_end_date')}}</label>
						<div class="uni-input" @click="timePickerRef.open('bottom')">
							{{tempMeetForm.end_date || $t('detail.rep_form.rep_end_date_placeholder')}}</div>
						<uni-icons type="right" size="20"
							style="color:var(--color-regular-text);cursor: pointer;"></uni-icons>
					</div>

				</div>





			</div>
			<div class="btns">
				<div class="btn" @click="$emit('close')">{{$t('common.button.cancel')}}</div>
				<div class="btn btn-confirm" @click="commit">{{$t('common.button.confirm')}}</div>
			</div>
		</div>


	</div>
	<!-- 日期选择器 -->
	<uni-popup ref="timePickerRef">
		<TimePicker :minDate="minDate" :maxDate="maxDate"
			:initialDate="dayjs(tempMeetForm.end_date,'YYYY-MM-DD').toDate()" @close="timePickerRef.close()"
			@confirm="confirmDate" />
	</uni-popup>
</template>

<style scoped lang="scss">
	.uni-input {
		display: block;
		font-size: 16px;
		line-height: 1.4em;
		height: 1.4em;
		min-height: 1.4em;
		overflow: hidden;
		text-align: right;
		width: 100%;
		cursor: pointer;
	}

	.input-disabled {
		color: var(--color-secondary-text);
	}
	
	.content-container{
		width: 90vw;
		border-radius: 0.2rem;
		background-color: #fff;
		
		.btns {
			display: flex;
			margin-top: 1rem;
			border-top: 0.05rem solid var(--color-border);
			
		
			.btn {
				flex: 1;
				text-align: center;
				line-height: 3;
				border-radius: 0 0 0.2rem 0.2rem;
			}
		
			.btn:hover {
				cursor: pointer;
				background-color: #f3f3f3;
			}
		
			.btn-confirm {
				color: var(--color-primary);
			}
		}
	}

	.content {
		padding: 0.5rem 1.5rem;

		.header {
			font-weight: 700;
			font-size: 1rem;
			color: var(--color-heading);
			line-height: 3;
			margin-bottom: 0.4rem;
		}

		.repeat-left,
		.repeat-right {
			flex-shrink: 0;
		}

		.checkbox-wrapper {

			.title-wrapper {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				height: 2.8rem;
				border-bottom: 0.05rem solid #eee;

				.title {
					color: var(--van-cell-text-color);
					font-size: 0.8rem;
				}
			}
		}


		
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		.form-row {
			display: flex;
			gap: 1rem;
			font-size: 1rem;
			align-items: center;

			label {
				min-width: 5rem;
			}
		}

		.form-row-secondary {
			label {
				text-align: right;
			}
		}
	}
</style>