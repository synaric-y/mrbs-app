<script setup>
	// vue
	import {
		computed,
		onMounted,
		ref,
		watch
	} from "vue";
	
	// uniapp
	import {
		onPullDownRefresh
	} from '@dcloudio/uni-app'
	
	// 国际化、路由
	import {
		i18n
	} from '@/i18n/index';
	import {
		useRoute
	} from 'vue-router';
	
	// api
	import {
		wrappedGetMeetings
	} from "@/api/index.js";
	
	// 组件
	import Layout from "@/components/Layout.vue";
	import Header from "@/components/Header.vue";
	import DateSelect from "@/components/DateSelect.vue";
	import MeetingRoomCard from "./components/MeetingRoomCard.vue";
	
	// 工具
	import dayjs from "dayjs";
	import _ from "lodash";
	import {gotoPage} from '@/utils/router.js'
	import {
		showToast,
		showModal
	} from '@/utils/display.js'

	// 用于路由参数获取
	const route = useRoute()

	// 已选日期
	const currentDate = ref(route.query.time ? new Date(parseInt(route.query.time)) : new Date())
	
	
	
	// 下拉框
	const areaOptions = ref([])
	
	// 已选区域（字符串）
	const selectedArea = ref(route.query.area_name ?? 'all')
	
	// 手机端选择器初始下标（仅用于显示）
	const index = ref(0)
	
	// 手机端选择器事件
	const bindPickerChange = (e)=> {
		selectedArea.value = areaOptions.value[e.detail.value].value;
		
		console.log(selectedArea.value);
	};
	


	// 服务器时间
	const serverTime = ref(dayjs().unix())

	// 加载完成标识
	const loaded = ref(false)
	
	// 区域房间会议总数据
	const totalList = ref([])
	
	// 过滤后的数据（按区域）
	const filteredList = computed(() => {
		return _.filter(totalList.value, (item) => {
			return selectedArea.value === 'all' || item.area_name === selectedArea.value
		})
	})
	
	// 初始化区域筛选表单
	const initAreaOptions = ()=>{
		if(areaOptions.value.length!=0) return // 已初始化，就用缓存
		
		areaOptions.value = _.map(totalList.value,item=>{
			return {
				text: item.area_name,
				value: item.area_name
			}
		})
		areaOptions.value.unshift({ // 全部
			text: i18n.global.t('index.filter.all'),
			value: 'all'
		})
	}

	// 获取会议数据
	const getMeetings = () => {
		loaded.value = false
		wrappedGetMeetings(currentDate.value)
			.then(data => {
				serverTime.value = data.timestamp // 服务器时间
				totalList.value = data.areas // 总表
				initAreaOptions() // 下拉框
			}).catch(e => {
				console.log(e)
			}).finally(()=>{loaded.value = true;uni.stopPullDownRefresh()})
	}

	
	// 点击会议详情前检查
	const gotoMeetingDetail = (areaDisabled, roomDisabled, room_id, area_id) => {
		if (areaDisabled)
			showToast(i18n.global.t('index.disabled_notify.area'));
		else if (roomDisabled)
			showToast(i18n.global.t('index.disabled_notify.room'));
		else {
			gotoPage('../detail/detail',{
				room_id: room_id,
				time: currentDate.value.getTime(),
				area_name: selectedArea.value,
				area_id: area_id
			})
		}
	}
	
	// 打开页面时刷新会议
	onMounted(() => {
		getMeetings()
	})
	
	// 手动选择日期时刷新会议
	const onManualSelectDate = () => {
		getMeetings()
	}
	
	// 下拉刷新时刷新会议
	onPullDownRefresh(()=>{
		getMeetings()
	})


</script>

<template>

	<Layout>
		<template #header>

			<Header :title="$t('index.title')">
				<template #header-right>
					<div class="right-wrapper">
						<!--          <LanguageSelect/>-->

						<div class="header-right" @click="gotoPage('../my/my')">
							<uni-icons type="person" size="30" style="color:var(--color-primary)"></uni-icons>

							<div class="info">{{ $t('my.title') }}</div>
						</div>
					</div>
				</template>
			</Header>

			<DateSelect :currentTime="serverTime" v-model:currentDate="currentDate" @manualSelectDate="onManualSelectDate" />


		</template>
		<template #content>
			<div class="filter-wrapper">
				<div class="cases">
					<div class="case">
						<div class="square square-disabled"></div>
						<div class="text">{{ $t('common.meeting.overdue') }}</div>
					</div>
					<div class="case">
						<div class="square square-to-start"></div>
						<div class="text">{{ $t('common.meeting.to_start') }}</div>
					</div>
					<div class="case">
						<div class="square square-in-progress"></div>
						<div class="text">{{ $t('common.meeting.in_progress') }}</div>
					</div>
					<div class="case">
						<div class="square square-finished"></div>
						<div class="text">{{ $t('common.meeting.finished') }}</div>
						
					</div>
				</div>
				<div class="my-picker">
					<div class="my-picker-mobile">
						<picker @change="bindPickerChange" :value="index" :range="areaOptions" range-key="text">
							<div class="icon-wrapper">
								<image src="../../assets/imgs/filter.png" class="icon"></image>
							</div>
						</picker>
					</div>
					<div class="my-picker-pc">
						<uni-data-select style="min-width: 200px;" v-model="selectedArea" :localdata="areaOptions" :clear="false"></uni-data-select>
					</div>
				</div>
				
			</div>

			
			<div v-if="!loaded" style="padding: 0 1rem;">
				<template v-for="item in [1,2,3,4,5]" :key="item">
					<uv-skeletons  :loading="true" :skeleton="[{
							type: 'line',
							num: 3,
							gap: '20rpx'
						}]"/>
					<view style="height: 60rpx;"></view>
				</template>
				
			</div>
				
				

			<div v-if="loaded">
					<!--        注意只有主键这样的key才能强制使子元素重绘-->
					<div v-for="area in filteredList" :key="area.area_id">
						
						<MeetingRoomCard class="card-container" v-for="room in area.rooms" :key="room.room_id"
						:disabled="area.disabled || room.disabled" :title="room.room_name" :capacity="room.capacity"
						:position="area.area_name" :facilities="room.description||''" :timeTable="room.entries||[]"
						:startTime="area.morningstarts || 6" :endTime="area.eveningends || 21"
						:currentDate="currentDate" :currentTime="serverTime"
						@click="gotoMeetingDetail(area.disabled,room.disabled,room.room_id,area.area_id)" />
						
					</div>
				</div>
			

		</template>
	</Layout>


</template>

<style scoped lang="scss">
	
	::v-deep .uni-calendar-item--isDay-text{
		color: var(--color-primary);
	}
	
	::v-deep .uni-calendar-item--isDay{
		background-color: var(--color-primary);
		
		.uni-calendar-item--isDay-text{
			color: #fff;
		}
	}
	
	::v-deep .uni-calendar-item--checked{
		background-color: var(--color-primary);
	}
	
	::v-deep .uni-picker-container .uni-picker-action.uni-picker-action-confirm{
		color: var(--color-primary);
	}
	
	/* 媒体查询: 宽屏，显示有边框的下拉选择器 */
	@media screen and (min-width: 1024px) {
		.my-picker-mobile{
			display: none;
		}
		.my-picker{
			position: absolute;
			min-width: 200px;
			top: 0;
			right: 1rem;
			width: 1.5rem;
			height: 1.5rem;
		}
		.my-picker-pc{
			min-width: 200px;
		}
	}
	
	/* 媒体查询: 窄屏，显示从底部弹起的选择器 */
	@media screen and (max-width: 1024px) {
		.my-picker{
			position: absolute;
			top: 0;
			right: 1rem;
			width: 1.5rem;
			height: 1.5rem;
		}
		.my-picker-pc{
			display: none;
		}
	}
	
	
	
	html {
		font-size: 20px;
	}

	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	.skeleton {
		margin: 1rem 0 3rem;
	}

	.right-wrapper {
		font-size: 1.3rem;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1.5rem;
		cursor: pointer;

		.header-right {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 0.3rem;
			color: var(--color-text);

			.info {
				font-weight: 400;
				font-size: 0.9rem;
			}
		}

	}


	.container {


		background-color: var(--color-background-soft);

		.header-wrapper {
			padding: 1rem;

			.header {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				margin-bottom: 0.4rem;

				.title {
					line-height: 3;
					color: var(--color-primary-text);
					font-weight: 700;
					font-size: 14px;
					padding-left: 0.2rem;

				}


			}


		}


		.content-wrapper {
			padding: 1rem 0 5rem;
			background-color: var(--color-background);


			.filter-wrapper {
				display: flex;
				align-items: center;
				width: 100%;
				margin-bottom: 0.3rem;
				position: relative;
				height: 1.5rem;

				.cases {
					width: 100%;
					display: flex;
					justify-content: center;
					height: 1.5rem;

					.case {

						display: flex;
						align-items: center;
						margin-right: 0.4rem;

						.text {
							font-size: 0.7rem;
							color: var(--color-secondary-text);
						}

						.square {
							width: 0.8rem;
							height: 0.8rem;
							margin-right: 0.3rem;
						}

						.square-to-start {
							background-color: var(--color-primary-light);
						}

						.square-disabled {
							background-color: var(--color-disabled);
						}

						.square-in-progress {
							background-color: var(--color-danger-light);
						}
						
						.square-finished{
							background-color: var(--color-canceled);
						}
					}
				}
				


				.icon-wrapper {
					display: flex;
					justify-content: center;
					align-items: center;
					cursor: pointer;
					
					.icon{
						width: 1.5rem;
						height: 1.5rem;
					}
				}
			}

			.card-container {
				border-bottom: 0.1rem solid var(--color-border);
				cursor: pointer;
			}

		}

	}

	.test {
		line-height: 2;
	}
</style>