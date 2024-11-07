<script setup>
import {computed, onMounted, ref, watch} from "vue";
import MeetingRoomCard from "@/components/MeetingRoomCard.vue";
import axios from "axios";
import {getAllRoomsApi, getAreaListApi, getAllMeetingsApi} from "@/api/index.js";
import {i18n} from '@/i18n/index';
import {showNotify} from 'vant';
import 'vant/es/notify/style' // 样式
import {showToast} from "vant";
import 'vant/es/toast/style'
import {Collapse, CollapseItem, Notify} from 'vant';
import {
  Skeleton,
  SkeletonTitle,
  SkeletonImage,
  SkeletonAvatar,
  SkeletonParagraph,
} from 'vant';
import {useRoute, useRouter} from 'vue-router';
import Layout from "@/components/Layout.vue";
import Header from "@/components/Header.vue";
import DateSelect from "@/components/DateSelect.vue";
import LanguageSelect from "@/components/LanguageSelect.vue";
import {getZeroTimestamp, secondsInOneDay,calcTimeSpace,} from "@/utils/timeTool.js";
import SvgIcon from "@/components/SvgIcon.vue";
import dayjs from "dayjs";
import _ from "lodash";

// 全局路由
const router = useRouter();
const route = useRoute()

const currentDate = ref(route.query.time ? new Date(parseInt(route.query.time)) : new Date())

// 区域总表
const areaList = ref([])
const areaOptions = ref([]) // 表单


// 加载完成标识
const loaded = ref(false)


const getMeetings = () => {
  loaded.value = false

  const dayObj = dayjs(currentDate.value || new Date())

  const today = dayObj.startOf('day').unix()
  const todayEnd = dayObj.endOf('day').unix()

  // 构造查询数据
  const temp = {
    end_time: todayEnd,
    start_time: today,
    timezone: "Asia/Shanghai",
    id: "",
    type: "all"
  }

  console.log(temp)

  return new Promise((resolve, reject)=>{
    getAllMeetingsApi(temp)
      .then(({data}) => {
        // 重新赋值
        areaList.value = data.areas

        // 表单
        areaOptions.value.push({ // 全部
          text:i18n.global.t('area.location.all'),
          value:'all'
        })
        _.forEach(areaList.value,(item)=>{
          areaOptions.value.push({
            text: item.area_name,
            value: item.area_name
          })
        })


        loaded.value = true
        resolve()
      })
      .catch(err => {
        showNotify({ type: 'danger', message: err.message })
        reject("未知异常" + err.message)
      })
  })

}


onMounted(() => {
  getMeetings()
})

const onManualSelectDate = () => {
  getMeetings()
}

const gotoMeetingDetail = (areaDisabled, roomDisabled, room_id) => {
  if (areaDisabled)
    showToast(i18n.global.t('area.notify.disabled'));
  else if (roomDisabled)
    showToast(i18n.global.t('room.notify.disabled'));
  else router.push({path: '/detail', query: {room_id: room_id, time: currentDate.value.getTime()}});
}

const selectedArea = ref('all')
const showPicker = ref(false)

const onConfirm = ({ selectedOptions }) => {
  showPicker.value = false;
  selectedArea.value = selectedOptions[0].value;
};

const filteredArea = computed(() => {
  // 必须有一个返回值return
  return areaList.value.filter((item)=>{
    return selectedArea.value==='all' || item.area_name===selectedArea.value
  })

})

</script>

<template>


  <Layout>
    <template #header>

      <Header :title="$t('title.reservation')">
        <template #header-right>
          <div class="right-wrapper">
            <!--          <LanguageSelect/>-->

            <div class="header-right" @click="router.push({path: '/my'});">
              <SvgIcon name="user-outline" width="2.3rem" height="2.3rem"/>
              <div class="info">{{ $t('title.myReservation') }}</div>
            </div>
          </div>
        </template>
      </Header>

      <DateSelect v-model:currentDate="currentDate" @manualSelectDate="onManualSelectDate"/>


    </template>
    <template #content>
      <div class="filter-wrapper">
        <div class="cases">
          <div class="case">
            <div class="square square-disabled"></div>
            <div class="text">{{ $t('filter.disabled') }}</div>
          </div>
          <div class="case">
            <div class="square square-in-progress"></div>
            <div class="text">{{ $t('filter.inProgress') }}</div>
          </div>
          <div class="case">
            <div class="square square-to-start"></div>
            <div class="text">{{ $t('filter.toStart') }}</div>
          </div>
        </div>
        <div class="icon-wrapper">
          <SvgIcon name="filter" width="1.5rem" height="1.5rem" @click="showPicker=true"/>
        </div>
      </div>

      <van-skeleton title v-for="i in 5" :key="i" :row="3" :loading="!loaded" class="skeleton"></van-skeleton>

      <div v-if="loaded">
<!--        注意只有主键这样的key才能强制使子元素重绘-->
        <div v-for="area in filteredArea" :key="area.area_id">
          <MeetingRoomCard class="card-container" v-for="room in area.rooms" :key="room.room_id"
                           :disabled="area.disabled || room.disabled"
                           :title="room.room_name"
                           :capacity="room.capacity"
                           :position="area.area_name"
                           :facilities="room.description||''"
                           :timeTable="room.entries||[]"
                           :startTime="area.morningstarts || 6"
                           :endTime="area.eveningends || 21"
                           :currentDate="currentDate"
                           @click="gotoMeetingDetail(area.disabled,room.disabled,room.room_id)"
          />
        </div>
      </div>

    </template>
  </Layout>
  <van-popup v-model:show="showPicker" round position="bottom">
    <van-picker
        :columns="areaOptions"
        @cancel="showPicker = false"
        @confirm="onConfirm"
    >
      <template #confirm>
        <div style="color:#591BB7">{{$t('button.confirm')}}</div>
      </template>
    </van-picker>
  </van-popup>


</template>

<style scoped lang="scss">

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

  .header-right {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.3rem;

    .info {
      font-weight: 400;
      font-size: 0.9rem;
      color: var(--color-primary-text);
    }
  }

}


.container {


  background-color: var(--color-background);

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
    background-color: var(--color-background-content);


    .filter-wrapper {
      display: flex;
      width: 100%;
      margin-bottom: 0.3rem;

      .cases {
        width: 100%;
        display: flex;
        justify-content: center;

        .case {

          display: flex;
          align-items: center;
          margin-right: 0.8rem;

          .text {
            font-size: 0.7rem;
            color: var(--color-secondary-text);
          }

          .square {
            width: 0.8rem;
            height: 0.8rem;
            margin-right: 0.4rem;
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
        }
      }

      .icon-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }

    .card-container {
      border-bottom: 0.1rem solid var(--color-border);
    }

  }

}

.test {
  line-height: 2;
}

</style>