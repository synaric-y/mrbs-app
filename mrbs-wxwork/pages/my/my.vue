<script setup>
	import {
		ref,
		onMounted
	} from 'vue'
	import Layout from "@/components/Layout.vue";
	import Header from "@/components/Header.vue";
	import ReservationCard from "./components/ReservationCard.vue";
	import RepeatedEditDialog from "./components/RepeatedEditDialog.vue";
	import {
		wrappedGetMeetingsByCreator
	} from "@/api/my.js";
	import {
		wrappedForceEndMeetingById,
		wrappedCancelMeetingById
	} from "@/api/meeting.js"
	import {
		i18n
	} from "@/i18n/index.js";
	import _ from 'lodash'
	import {
		returnToIndex
	} from '@/utils/router.js'
	import {
		showToast,
		showModal
	} from '@/utils/display.js'
	import {
		gotoPage
	} from "../../utils/router";
	import {
		onReachBottom
	} from '@dcloudio/uni-app'


	//======================================加载会议===============================================

	// 当前tab
	const active = ref(0)

	// 各tab总数据
	const totalList = ref([{
			list: [],
			page: 1,
			loadingStatus: 'more' // more/loading/noMore
		},
		{
			list: [],
			page: 1,
			loadingStatus: 'more'
		},
		{
			list: [],
			page: 1,
			loadingStatus: 'more'
		},
	])

	// 加载各tab数据
	const getMyMeetings = () => {

		if (totalList.value[active.value].loadingStatus == 'noMore') return // 无更多数据，不加载

		totalList.value[active.value].loadingStatus = 'loading'

		wrappedGetMeetingsByCreator(totalList.value[active.value].page, active.value)
			.then((data) => {

				totalList.value[active.value].loadingStatus = 'more'

				if (data.length === 0) { // 加载完
					totalList.value[active.value].loadingStatus = 'noMore'
				} else {
					totalList.value[active.value].list = [...totalList.value[active.value].list, ...data]
					totalList.value[active.value].page += 1
				}

			})
			.catch(e => {
				totalList.value[active.value].loadingStatus = 'noMore'
				showToast(e)
			})
	}


	// 切换tab，加载
	const onClickItem = (e) => {
		if (active.value !== e.currentIndex) {
			active.value = e.currentIndex
			getMyMeetings()
		}
	}

	// 启动时自动加载
	onMounted(() => {
		getMyMeetings()
	})

	// 触底的事件
	onReachBottom(() => {
		getMyMeetings()
	})


	//======================================删除会议===============================================

	// 防止取消到刷新之间的一段时间用户点击卡片
	const disableClick = ref(false)

	// 删除会议、提前结束会议api使用
	const selectedEntryId = ref('')

	// 删除会议二次弹窗
	const confirmCancelMeeting = (entry_id, repeatId) => {

		selectedEntryId.value = entry_id

		if (repeatId)
			showModal(i18n.global.t('my.cancel_notify.message_repeat'), cancelRepeatedMeeting)
		else
			showModal(i18n.global.t('my.cancel_notify.message'), cancelSingleMeeting)
	}

	// 删除单次会议
	const cancelSingleMeeting = () => {
		if (disableClick.value) return // 防止等待的1s内误触

		disableClick.value = true
		wrappedCancelMeetingById(selectedEntryId.value, false)
			.then((data) => {
				showToast(i18n.global.t('my.cancel_notify.success'))

				setTimeout(() => {
					disableClick.value = false
					window.location.reload() // 刷新整个页面，兼容ios
				}, 1000)
			})
			.catch((e) => {
				showToast(i18n.global.t('my.cancel_notify.fail') + e)
				disableClick.value = false
				console.log(e);
			})
	}

	// 删除循环会议
	const cancelRepeatedMeeting = () => {
		if (disableClick.value) return // 防止等待的1s内误触

		disableClick.value = true
		wrappedCancelMeetingById(selectedEntryId.value, true)
			.then((data) => {
				showToast(i18n.global.t('my.cancel_notify.success'))

				setTimeout(() => {
					disableClick.value = false
					window.location.reload() // 刷新整个页面，兼容ios
				}, 1000)
			})
			.catch((e) => {
				showToast(i18n.global.t('my.cancel_notify.fail') + e)
				disableClick.value = false
				console.log(e);
			})
	}

	//======================================提前结束会议===============================================


	// 提前结束会议二次弹窗
	const confirmForceEndMeeting = (entry_id) => {
		selectedEntryId.value = entry_id

		showModal(i18n.global.t('my.force_end_notify.message'), forceEndMeeting)
	}

	// 提前结束会议
	const forceEndMeeting = () => {
		if (disableClick.value) return // 防止等待的1s内误触

		disableClick.value = true
		wrappedForceEndMeetingById(selectedEntryId.value)
			.then((data) => {
				console.log(data);

				showToast(i18n.global.t('my.force_end_notify.success'))
				setTimeout(() => {
					disableClick.value = false
					window.location.reload() // 刷新整个页面，兼容ios
				}, 1000)
			})
			.catch((e) => {
				showToast(i18n.global.t('my.force_end_notify.fail') + e)
				disableClick.value = false
				console.log(e);
			})
	}

	//======================================编辑会议===============================================

	// 编辑弹窗用
	const currentRepeatId = ref('')
	const currentEntryId = ref('')

	// 编辑弹窗显示
	const refPopup = ref(null)

	// 编辑前检查
	const gotoEdit = (status, repeat_id, id, room_id) => {
		if (disableClick.value || status === 2) return // 防止误触；已结束的不可编辑


		if (!repeat_id) { // 单次

			gotoPage('../detail/detail', {
				room_id: room_id,
				entry_id: id
			})

		} else { // 循环

			currentRepeatId.value = repeat_id
			currentEntryId.value = id
			refPopup.value.open()

		}

	}

	// 确认循环编辑窗口
	const repeatEditConfirm = () => {
		refPopup.value.close()
		window.location.reload()
	}
	
	// 去除双引号
	const trimTopic = (str)=>{
		return _.trim(str,'\"')
	}
</script>

<template>

	<Layout>
		<template #header>
			<Header :title="$t('my.title')" :isReturn="true" @return="returnToIndex" />
		</template>
		<template #content>

			<uni-segmented-control :current="active"
				:values="[$t('common.meeting.to_start'),$t('common.meeting.in_progress'),$t('common.meeting.finished')]"
				@clickItem="onClickItem" styleType="text" activeColor="#591BB7" />

			<uni-swipe-action style="padding: 40rpx;">
				<!-- 使用插槽 （请自行给定插槽内容宽度）-->
				<uni-swipe-action-item v-for="(entry, index) in totalList[active].list" :key="entry.id"
					:disabled="active==2">
					<view>
						<ReservationCard :begTime="entry.start_time" :endTime="entry.end_time" :desc="trimTopic(entry.name)"
							:type="active" :isRepeat="entry.repeat_id"
							@edit="gotoEdit(active,entry.repeat_id,entry.id,entry.room_id)"
							@cancel="confirmForceEndMeeting(entry.id,entry.repeat_id)"
							@force_end="confirmForceEndMeeting(entry.id)"/>
					</view>
					<template v-slot:right>
						<div class="btns">
							<template v-if="active!=2">
								<view class="btn change-button" @click="gotoEdit(active,entry.repeat_id,entry.id,entry.room_id)">
									<text>{{$t('common.button.edit')}}</text>
								</view>
								<view class="btn cancel-button" @click="confirmCancelMeeting(entry.id,entry.repeat_id)">
									<text>{{$t('common.button.cancel')}}</text>
								</view>
								<view class="btn force-end-button" v-show="active==1" @click="confirmForceEndMeeting(entry.id)">
									<text>{{$t('common.button.force_end')}}</text>
								</view>
							</template>

						</div>
					</template>
				</uni-swipe-action-item>
				<uni-load-more :showIcon="true" :showText="true"
					:status="totalList[active].loadingStatus"></uni-load-more>
			</uni-swipe-action>



		</template>
	</Layout>
	<uni-popup ref="refPopup" :mask-click="false">
		<RepeatedEditDialog :repeat_id="currentRepeatId" :entry_id="currentEntryId" @close="refPopup.close()"
			@confirm="repeatEditConfirm" />
	</uni-popup>


</template>

<style scoped lang="scss">
	.meetings {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1.5rem;
	}


	.btns {
		display: flex;
		flex-direction: row;
		height: 100%;


		.btn {
			height: 100%;
			width: 4rem;
			color: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.cancel-button {
			background-color: var(--color-danger);
		}
		
		.force-end-button {
			background-color: var(--color-force-end);
		}

		.change-button {
			background-color: var(--color-primary);
		}
	}
</style>