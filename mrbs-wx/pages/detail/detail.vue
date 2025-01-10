<script setup>
	// 组件
	import Header from "@/components/Header.vue";
	import Layout from "@/components/Layout.vue";
	import InfoHeader from "@/components/InfoHeader.vue";
	import DateSelect from "@/components/DateSelect.vue";
	import TimePicker from "./components/TimePicker.vue";
	import RepeatedReserveDialog from "./components/RepeatedReserveDialog.vue";
	import TimeStepperScrollTest from "./components/TimeStepperScrollTest.vue";
	
	// vue
	import {
		useRoute
	} from 'vue-router';
	import {
		computed,
		onMounted,
		ref,
		watch
	} from "vue";
	
	// uniapp
	import {
		onShow,
		onLoad
	} from '@dcloudio/uni-app'
	
	
	// api
	import {
		wrappedGetMeetingsByRoomId
	} from "@/api/index.js";
	import {
		wrappedGetMeetingById,
		wrappedReserveSingleMeeting,
		wrappedReserveRepeatedMeeting,
		wrappedEditSingleMeeting,
	} from "@/api/meeting.js";
	
	// 库函数
	import {
		i18n
	} from "@/i18n/index.js";
	import dayjs from "dayjs";
	import _ from "lodash";
	
	// 工具类
	import {
		SEC_PER_MINUTE,
	} from '@/constants/time.js'
	import {
		fl2ts,
		hhmm2fl,
	} from '@/utils/timeCoersionTool.js'
	import {
		ymdFormat,
		dayText
	} from '@/utils/dateTool.js'
	import {
		showToast,
		showModal
	} from '@/utils/display.js'
	import {
		gotoPage,
		navigateBack
	} from "@/utils/router.js";



	// 路由参数
	const room_id = ref(0)
	const entryId = ref(0)
	const isFirst = ref(true) // 是否为编辑态
	const currentDate = ref(null) // 当前日期，双向绑定
	const area_name = ref('all')
	
	
	
	// 时间轴
	const serverTime = ref(0)
	const leftTime = ref(0)
	const rightTime = ref(0)
	
	// 时间轴失败时，禁止提交表单
	const timelineDisabled = ref(false)
	
	// 会议主题
	const meetingTopic = ref('')
	
	// ================================返回首页=================================

	// 返回首页，带参数
	const returnToIndex = () => {
		
		gotoPage('../index/index',{
			time: currentDate.value.getTime(),
			area_name: area_name.value ?? 'all'
		})

	}
	
	// 手动返回首页，不带任何参数
	const manualReturnToIndex = ()=>{
		gotoPage('../index/index',{})
	}
	
	
	// ================================加载会议=================================
	
	const loaded = ref(false) // 加载完成标识
	const msg = ref('') // 报错信息（如有）
	
	const room = ref({})
	const area = ref({})
	const currentMeeting = ref(null) // 正在编辑的会议

	const getMeetings = () => {
		
		return new Promise((resolve,reject)=>{
			
			loaded.value = false
			
			wrappedGetMeetingsByRoomId(
				currentDate.value,
				room_id.value
			)
			.then(({area:a,room:r,timestamp:ts})=>{
				console.log(a,r,ts);
				
				console.log('getMeetings');
				
				if(!a || !r){ // 没有查到对应的区域或房间（可能是不在用户组里）
					
					console.log('123');
					msg.value = i18n.global.t('detail.validate_notify.rejected')
					showToast(i18n.global.t('detail.validate_notify.rejected'),2000);
				
					setTimeout(()=>{
						gotoPage('../index/index',{}) // 返回首页，不带任何参数
					},2000)
					
					return
				}
				
				loaded.value = true
				serverTime.value = ts
				area.value = a
				room.value = r
				
				// 设置标题栏
				wx.setNavigationBarTitle({
				  title: i18n.global.t('detail.title')+' '+(r.room_name ? r.room_name:'')
				})
				
				if (room.value.entries == undefined) room.value.entries = [] // 防止时间轴报错
				
				if (entryId.value) { // 清除正在编辑的会
					room.value.entries = _.filter(room.value.entries, (item) => {
						return item.entry_id != entryId.value
					})
				}
				
				console.log(area.value,room.value);
				
				resolve()
				
			})
			.catch(e=>{
				loaded.value = true
				msg.value = e
				
				console.log(e);
				
				reject()
			})
		})
		
	}


	const getMeetingById = () => {
		
		return new Promise((resolve,reject)=>{
			
			wrappedGetMeetingById(entryId.value,false)
			.then((data)=>{
				currentMeeting.value = data
				
				const {start_time,end_time,name} = currentMeeting.value
				
				// 时间轴手柄
				leftTime.value = start_time
				rightTime.value = end_time
				
				// 会议主题
				meetingTopic.value =  _.trim(name,'\"');
				
				// 更换时间，以跳到会议当天
				currentDate.value = new Date(start_time * 1000)
				
				resolve()
			})
			.catch(e=>{
				msg.value = e
				
				console.log(e);
				
				reject()
			})
			
		})
		
	
	}

	// uniapp生命周期，拿路由参数
	onLoad(options=>{
		room_id.value = options.room_id
		entryId.value = options.entry_id
		currentDate.value = options.time ? new Date(parseInt(options.time)) : new Date()
		isFirst.value = !entryId.value
		area_name.value = options.area_name
	})

	// uniapp生命周期
	onShow(() => {
		
		console.log(364);

		if (isFirst.value) {
			Promise.all([getMeetings()])
		}
		else{
			Promise.all([getMeetings(),getMeetingById()])
		}
		
	})


	// ================================表单校验=================================
	
	const validate = ()=>{
		if (!meetingTopic.value || meetingTopic.value.length == 0) {
			showToast(i18n.global.t('detail.form.form_validate_notify.meeting_topic_missing'));
			return false
		}
		
		return true
	}
	
	// ================================预定单次会议=================================

	const confirmReserve = () => {
		if (!validate()) return
		showModal(i18n.global.t('detail.reserve_notify.message'),reserveMeeting)
	}

	const reserveMeeting = () => {

		const {
			area_id,
			area_name
		} = area.value
		const {
			room_id,
			room_name,
			capacity
		} = room.value

		wrappedReserveSingleMeeting(
				area_id,
				area_name,
				room_id,
				room_name,
				capacity,
				meetingTopic.value,
				Math.trunc(leftTime.value),
				Math.trunc(rightTime.value)
			)
			.then(res => {
				console.log(res);
				showToast(i18n.global.t('detail.reserve_notify.success'),2000);
				returnToIndex()
			})
			.catch(error => {
				showToast(i18n.global.t('detail.reserve_notify.fail') + error);
			})
			.finally(() => {
				// returnToIndex()
			})
	}
	
	// ================================预定循环会议=================================

	const repeatedReserveRef = ref(null)
	const showRepeatReserveDialog = () => {
		if (!validate()) return
		repeatedReserveRef.value.open()
	}

	const repeatReserve = (form) => {

		if (!validate()) return

		const {
			area_id,
			area_name
		} = area.value
		const {
			room_id,
			room_name,
			capacity
		} = room.value
		const {
			rep_end_date,
			rep_day,
			rep_interval
		} = form

		wrappedReserveRepeatedMeeting(
				area_id,
				area_name,
				room_id,
				room_name,
				capacity,
				meetingTopic.value,
				Math.trunc(leftTime.value),
				Math.trunc(rightTime.value),
				rep_end_date,
				rep_day,
				rep_interval
			)
			.then(res => {

				console.log(res);

				showToast(i18n.global.t('detail.reserve_notify.repeat_success'))
				returnToIndex()

			}).catch(err => { showToast(i18n.global.t('detail.reserve_notify.repeat_fail') + err) })

	}

	// ================================编辑单次会议=================================

	const confirmEdit = () => {
		if (!validate()) return
		
		showModal(i18n.global.t('detail.edit_notify.message'),editMeeting)
	}
	
	const editMeeting = () => {
		const {
			id,
			area_id,
			area_name,
			room_id,
			room_name,
			capacity
		} = currentMeeting.value

		wrappedEditSingleMeeting(
				id,
				area_id,
				area_name,
				room_id,
				room_name,
				capacity,
				meetingTopic.value,
				Math.trunc(leftTime.value),
				Math.trunc(rightTime.value)
			)
			.then(res => { showToast(i18n.global.t('detail.edit_notify.success')) })
			.catch(err => { showToast(i18n.global.t('detail.edit_notify.fail') + err) })
			.finally(() => { gotoPage('../my/my') })
	}


	
	// ================================切换日期=================================

	
	
	
	const minDate = ref(new Date()) // 今天
	const maxDate = ref(dayjs().add('14','d').toDate()) // 14天

	const onManualSelectDate = () => {
		isFirst.value = true
		getMeetings()
	}
	


	const timePickerRef = ref(null)
	
	const confirmDate = (date)=>{
		
		timePickerRef.value.close()
		console.log(date);
		
		currentDate.value = dayjs(date, 'YYYY-MM-DD').toDate()
		onManualSelectDate()
	}
	
	// ================================输入框事件=================================
	
	const onKeyInput = (event)=>{
		console.log(event.detail.value);
		meetingTopic.value = event.detail.value
	}
</script>

<template>
	<Layout>

		<template #header>
			<DateSelect :currentTime="serverTime" v-model:currentDate="currentDate" @manualSelectDate="onManualSelectDate" />
		</template>
		<template #content>
			<div v-if="loaded" class="content" >
				<InfoHeader :title="room.room_name" :position="area.area_name" :capacity="room.capacity"
					:facilities="room.description" />

				<TimeStepperScrollTest
					:lb="fl2ts(currentDate,area.morningstarts?parseInt(area.morningstarts):(area.start_time?hhmm2fl(area.start_time):6))"
					:ub="fl2ts(currentDate,area.eveningends?parseInt(area.eveningends):(area.end_time?hhmm2fl(area.end_time):21))"
					:meetings="room.entries" v-model:leftHandle="leftTime" v-model:rightHandle="rightTime"
					v-model:disabled="timelineDisabled" :currentDate="currentDate" :currentTime="serverTime"
					:isFirst="isFirst" :scale="area.resolution? (area.resolution/SEC_PER_MINUTE) : 30" />

				<!-- 表单 -->

				<div class="form-item">
					<div class="title" >{{$t('detail.form.date')}}</div>
					<div class="form-item-right" @click="timePickerRef.open('bottom')">
						<div class="uni-input">{{ymdFormat(currentDate)}},&nbsp;{{dayText(currentDate,serverTime)}}</div>
						<uni-icons type="right" size="20" style="color:var(--color-regular-text);"></uni-icons>
					</div>
				</div>


				<div class="form-item">
					<div class="title">{{$t('detail.form.meeting_topic')}}</div>
					<input :disabled="timelineDisabled" class="input uni-input" v-model="meetingTopic" :maxlength="20"
						:placeholder="$t('detail.form.meeting_topic_placeholder')" />
				</div>


				<!-- 按钮 -->

				<template v-if="!entryId">
					<button :disabled="timelineDisabled" class="large-btn large-btn-primary" type="primary" round
						size="large" @click="confirmReserve">{{ $t('common.button.reserve') }}</button>
					<button :disabled="timelineDisabled" class="large-btn large-btn-primary" type="primary" round
						size="large" @click="showRepeatReserveDialog">{{ $t('common.button.repeated_reserve') }}</button>
					<button class="large-btn" type="default" round size="large"
						@click="returnToIndex">{{ $t('common.button.cancel') }}</button>
				</template>
				<template v-else>
					<button :disabled="timelineDisabled" class="large-btn large-btn-primary" type="primary" round size="large"
						@click="confirmEdit">{{ $t('common.button.confirm') }}</button>
					<button class="large-btn" type="default" round size="large"
						@click="navigateBack">{{ $t('common.button.cancel') }}</button>
				</template>

			</div>
			<!-- 报错 -->
			<p v-if="msg.length!==0" class="msg" @click="manualReturnToIndex">
				{{msg}}
			</p>
		</template>
	</Layout>
	<!-- 日期选择器 -->
	<uni-popup ref="timePickerRef">
		<TimePicker :minDate="minDate" :maxDate="maxDate" :initialDate="currentDate" @close="timePickerRef.close()" @confirm="confirmDate" />
	</uni-popup>
	<!-- 循环会议弹窗 -->
	<uni-popup ref="repeatedReserveRef" :mask-click="false">
		<RepeatedReserveDialog @confirm="(form)=>{repeatReserve(form)}"
			@close="repeatedReserveRef.close()" />
	</uni-popup>
	

</template>

<style scoped lang="scss">
	.wrapper {
		width: 100%;
	}
	
	.button-hover{
		color: #fff!important;//修复不自动弹起问题
	}
	
	
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

	.content {
		padding: 0 1rem;
	}
	
	.msg{
		padding: 1rem;
		word-break: break-all;
	}


	.form-item {
		display: flex;
		height: 3rem;
		align-items: center;
		flex-direction: row;
		justify-content: space-between;
		border-bottom: 0.05rem solid var(--color-border);

		.title {
			font-weight: 700;
			font-size: 0.85rem;
			color: var(--color-text);
			min-width: 4rem;
			white-space: nowrap;
		}

		.form-item-right {
			display: flex;
			width: 100%;
			gap: 0.3rem;
			align-items: center;
			flex-direction: row;
			color: var(--color-regular-text);
			cursor: pointer;

			.time {
				border: 0.05rem solid #ccc;
				border-radius: 0.3rem;
				line-height: 2;
				min-width: 5rem;
				text-align: center;
			}
		}

		.text {
			color: var(--color-regular-text);
			font-size: 0.85rem;
		}
	}

	.large-btn {
		margin-top: 1.2rem;
		font-size: 1.1rem;
	}

	.large-btn-primary {
		background-color: var(--color-primary);
		border: 1px solid var(--color-primary);
	}

</style>