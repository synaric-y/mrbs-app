<script setup>
	import {
		ref,
		onBeforeUpdate,
		reactive,
		onMounted
	} from 'vue';
	
	import FormLineItem from '@/components/FormLineItem.vue';
	
	import {
		ymdFormatTs
	} from '@/utils/dateTool.js'
	import {
		ts2hhmm
	} from '@/utils/timeCoersionTool.js'
	import {
		i18n
	} from '@/i18n/index';
	import _ from 'lodash'
	import dayjs from "dayjs";

	import {
		wrappedEditRepeatedMeeting,
		wrappedGetMeetingById
	} from '@/api/meeting.js'

	import {
		showToast
	} from '@/utils/display.js'
	
	import {
		WEEK_LIST
	} from '@/utils/dateTool.js'

	const props = defineProps(['repeat_id', 'entry_id'])
	const emits = defineEmits(['confirm', 'close'])

	const check_box_list = WEEK_LIST

	const minDate = ref(dayjs().format('YYYY-MM-DD'))
	console.log(minDate.value);



	// 临时表单
	const tempMeetForm = reactive({
		area_id: '',
		area_name: '',
		area_start_time: '',
		area_end_time: '',
		resolution: 900,
		room_id: '',
		room_name: '',
		title: '',
		start_date: '',
		time1: '',
		time2: '',
		interval: '',
		days: [],
		end_date: ''
	})

	const validate = () => {

		if (!tempMeetForm.title) {
			showToast(i18n.global.t('my.rep_edit_form.rep_edit_form_validate_notify.meeting_topic_missing'));
			return false
		}
		if (!tempMeetForm.start_date) {
			showToast(i18n.global.t('my.rep_edit_form.rep_edit_form_validate_notify.start_date_missing'));
			return false
		}
		if (!tempMeetForm.time1) {
			showToast(i18n.global.t('my.rep_edit_form.rep_edit_form_validate_notify.time1_missing'));
			return false
		}
		if (!tempMeetForm.time2) {
			showToast(i18n.global.t('my.rep_edit_form.rep_edit_form_validate_notify.time2_missing'));
			return false
		}
		if (tempMeetForm.time1 >= tempMeetForm.time2) {
			showToast(i18n.global.t('my.rep_edit_form.rep_edit_form_validate_notify.time1_time2_fail'));
			return false
		}
		if (!tempMeetForm.days || tempMeetForm.days.length==0) {
			showToast(i18n.global.t('my.rep_edit_form.rep_edit_form_validate_notify.rep_day_missing'));
			return false
		}
		if (!tempMeetForm.interval || tempMeetForm.interval<1 || tempMeetForm.interval>4) {
			showToast(i18n.global.t('my.rep_edit_form.rep_edit_form_validate_notify.rep_interval_fail'));
			return false
		}
		if (!tempMeetForm.end_date) {
			showToast(i18n.global.t('my.rep_edit_form.rep_edit_form_validate_notify.rep_end_date_missing'));
			return false
		}
		if (tempMeetForm.start_date >= tempMeetForm.end_date) {
			showToast(i18n.global.t('my.rep_edit_form.rep_edit_form_validate_notify.rep_start_end_date_fail'));
			return false
		}

		console.log(tempMeetForm)

		return true
	}

	onMounted(() => {
		
		wrappedGetMeetingById(props.repeat_id,true)
		.then((data)=>{
			
			Object.assign(tempMeetForm, {
				
				area_id: data.area_id,
				area_name: data.area_name,
				room_id: data.room_id,
				room_name: data.room_name,
				title: _.trim(data.name,'\"'),
				start_date: ymdFormatTs(data.start_time),
				time1: ts2hhmm(data.start_time),
				time2: ts2hhmm(data.end_time),
				interval: data.rep_interval,
				days: _.map(data.rep_day, (item) => {
					return item + ''
				}), // 周一...周日
				end_date: data.end_date,
			})
			
			console.log(tempMeetForm)
		})
		

	})
	
	
	const commit = () => {

		if (!validate()) return
		
		uni.showLoading({
			title: i18n.global.t('common.loading')
		})
		wrappedEditRepeatedMeeting(
			props.entry_id,
			props.repeat_id,
			tempMeetForm.area_id,
			tempMeetForm.area_name,
			tempMeetForm.room_id,
			tempMeetForm.room_name,
			10, // capacity
			tempMeetForm.title,
			tempMeetForm.start_date,
			tempMeetForm.time1,
			tempMeetForm.time2,
			tempMeetForm.end_date,
			tempMeetForm.days,
			tempMeetForm.interval
		)
		.then((data)=>{
			uni.hideLoading();
			showToast(i18n.global.t('my.rep_edit_notify.success'), 2000);
						
			setTimeout(() => {
				emits('confirm')
			}, 1500)
		})
		.catch(e => {
			uni.hideLoading();
			showToast(i18n.global.t('my.rep_edit_notify.fail') + e);
		})

	}

	function bindStartDateChange(e) {
		console.log(e.detail.value);
		tempMeetForm.start_date = e.detail.value
	}

	function bindTime1Change(e) {
		tempMeetForm.time1 = e.detail.value
	}

	function bindTime2Change(e) {
		tempMeetForm.time2 = e.detail.value
	}

	function daysChange(e) {
		tempMeetForm.days = e.detail.value
	}

	function bindEndDateChange(e) {
		tempMeetForm.end_date = e.detail.value
	}
</script>

<template>
	<div class="outer">
		<div class="content-container">
			<div class="content">
				<div class="header">{{$t('my.rep_edit_form.title')}}</div>
			
				<div class="form">
					<FormLineItem :label="$t('my.rep_edit_form.area')">
						<input v-model="tempMeetForm.area_name" disabled class="uni-input input-disabled" style="padding-right: 0"
							type="text" :placeholder="$t('my.rep_edit_form.area_room_placeholder')" />
					</FormLineItem>
					<FormLineItem :label="$t('my.rep_edit_form.room')">
						<input v-model="tempMeetForm.room_name" disabled class="uni-input input-disabled" style="padding-right: 0"
							type="text" :placeholder="$t('my.rep_edit_form.area_room_placeholder')" />
					</FormLineItem>
					<FormLineItem :label="$t('my.rep_edit_form.meeting_topic')">
						<input v-model="tempMeetForm.title" :maxlength="20" class="uni-input" type="text" style="padding-right: 0"
							:placeholder="$t('my.rep_edit_form.meeting_topic_placeholder')" />
					</FormLineItem>
					<FormLineItem :label="$t('my.rep_edit_form.start_date')" :isLink="true">
						<picker class="uni-input" id="start_date" mode="date" :value="tempMeetForm.start_date"
							:start="minDate" @change="bindStartDateChange">
							<div>{{tempMeetForm.start_date || $t('my.rep_edit_form.date_placeholder')}}</div>
						</picker>
					</FormLineItem>
					<FormLineItem :label="$t('my.rep_edit_form.time1')" :isLink="true" :isSecondary="true">
						<picker class="uni-input" mode="time" :value="tempMeetForm.time1"
							:start="tempMeetForm.area_start_time || '08:00'" :end="tempMeetForm.area_end_time || '21:00'"
							@change="bindTime1Change">
							<div>{{tempMeetForm.time1 || $t('my.rep_edit_form.time_placeholder')}}</div>
						</picker>
					</FormLineItem>
					<FormLineItem :label="$t('my.rep_edit_form.time2')" :isLink="true" :isSecondary="true">
						<picker class="uni-input" mode="time" :value="tempMeetForm.time2"
							:start="tempMeetForm.area_start_time || '08:00'" :end="tempMeetForm.area_end_time || '21:00'"
							@change="bindTime2Change">
							<div>{{tempMeetForm.time2 || $t('my.rep_edit_form.time_placeholder')}}</div>
						</picker>
					</FormLineItem>
					
			
					<div class="form-row">
						<div class="repeat-left">{{$t('my.rep_edit_form.rep_interval')}}</div>
						<uni-number-box v-model="tempMeetForm.interval" :min="1" :max="4"></uni-number-box>
						<div class="repeat-right">{{$t('my.rep_edit_form.rep_interval_2')}}</div>
					</div>
			
					<checkbox-group @change="daysChange">
						<div class="checkbox-wrapper">
							<div class="title-wrapper" v-for="item in check_box_list" :key="item.value">
								<checkbox activeBackgroundColor="#591bb7" iconColor="#ffffff" activeBorderColor="#ffffff"
									:value="item.value" :checked="_.includes(tempMeetForm.days,item.value)" />
								<div class="title">{{item.label}}</div>
							</div>
						</div>
					</checkbox-group>
			
					<FormLineItem :label="$t('my.rep_edit_form.rep_end_date')" :isLink="true">
						<picker class="uni-input" id="end_date" mode="date" :value="tempMeetForm.end_date"
							:start="minDate" @change="bindEndDateChange">
							<div>{{tempMeetForm.end_date || $t('my.rep_edit_form.date_placeholder')}}</div>
						</picker>
					</FormLineItem>
				</div>
			</div>
			<div class="btns">
				<div class="btn" @click="$emit('close')">{{$t('common.button.cancel')}}</div>
				<div class="btn btn-confirm" @click="commit">{{$t('common.button.confirm')}}</div>
			</div>
		</div>
		

	</div>
</template>

<style scoped lang="scss">
	.uni-input {
		display: block;
		font-size: 16px;
		line-height: 1.4em;
		height: 1.4em;
		min-height: 1.4em;
		overflow: hidden;
		cursor: pointer;
		width: 100%;
		padding-right: 30px;
	}

	.input-disabled {
		color: var(--color-secondary-text);
	}
	
	.outer{
		display: flex;
		justify-content: center;
		
	}
	
	.content-container{
		width: 90%;
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
			
			.btn:hover{
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

		.repeat {
			font-size: 0.9rem;
			color: var(--van-cell-text-color);
			display: flex;
			gap: 0.5rem;
			align-items: center;
			line-height: 3;
		}

		.checkbox-wrapper {
			display: flex;
			flex-wrap: wrap;
			gap: 0.8rem;

			.title-wrapper {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				height: 2rem;

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
				cursor: default;
			}
		}

		.form-row-secondary {
			label {
				text-align: right;
				cursor: default;
			}
		}
	}
</style>