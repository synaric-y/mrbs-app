<script setup>
import {computed, onMounted, ref, watch} from "vue";
import MeetingRoomCard from "@/components/MeetingRoomCard.vue";
import axios from "axios";
import {getAllRoomsApi, getAreaListApi} from "@/api/index.js";
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

// 全局路由
const router = useRouter();
const route = useRoute()


const currentDate = ref(route.query.time ? new Date(parseInt(route.query.time)) : new Date())

const areas = ref([])
const areaSet = ref([])
const loaded = ref(false)

const initAreaSet = ()=>{
  return new Promise((resolve, reject)=>{
    for(let area of areas.value){
      areaSet.value.push({text:area.area_name,value:area.area_name})
    }
    areaSet.value.unshift({text:i18n.global.t('area.location.all'),value:'all'})
    resolve()
  })
}

const getMeetings = () => {
  loaded.value = false

  const today = getZeroTimestamp(currentDate.value || new Date())
  const todayEnd = today + secondsInOneDay - 1

  // 构造查询数据
  const temp = {
    end_time: todayEnd,
    start_time: today,
    timezone: "Asia/Shanghai",
    id: "",
    type: "all"
  }

  // 清空会议
  for (let i = 0; i < areas.value.length; i++)
    for (let j = 0; j < areas.value[i].rooms.length; j++)
      areas.value[i].rooms[j].entries = []


  return new Promise((resolve, reject)=>{
    getAreaListApi(temp)
      .then((res) => {
        // 重新赋值
        const temp = res.data.areas

        for (let area of temp) {
          const i = areas.value.findIndex((e) => {return e.area_id == area.area_id}) // 大括号内一定要加return，否则一直返回-1
          if (i !== -1) {
            for (let room of area.rooms) {
              const j = areas.value[i].rooms.findIndex((e) => {return e.room_id == room.room_id}) // 大括号内一定要加return，否则一直返回-1
              areas.value[i].rooms[j].entries = room.entries || []
            }
          }
        }

        loaded.value = true
        resolve()
      })
      .catch(err => {
        throw new Error("未知异常" + err.message);
      })
  })

}


const getAllRoomList = ()=>{

  loaded.value = false

  // 构造查询数据
  const temp = {
    type: "all"
  }

  return new Promise((resolve, reject) => {
    getAllRoomsApi(temp)
      .then((res) => {
        areas.value = res.data.areas
        resolve()
      })
      .catch(err => {
        throw new Error("未知异常" + err.message);
      })

  });
}


onMounted(() => {
  getAllRoomList()
      .then(getMeetings)
      .then(initAreaSet)
      .catch(err=>{showNotify({ type: 'danger', message: err.message })})

})

const onManualSelectDate = () => {
  getMeetings()
}

const gotoMeetingDetail = (areaDisabled, roomDisabled, room_id) => {
  if (areaDisabled == '1')
    showToast(i18n.global.t('area.notify.disabled'));
  else if (roomDisabled == '1')
    showToast(i18n.global.t('room.notify.disabled'));
  else router.push({path: '/detail', query: {room_id: room_id, time: currentDate.value.getTime()}});
}

const selectedArea = ref('all')
const showPicker = ref(false)

const onConfirm = ({ selectedOptions }) => {
  showPicker.value = false;
  selectedArea.value = selectedOptions[0].value;
};

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
        <div v-for="(area,i) in areas.filter((item)=>{return selectedArea=='all'||item.area_name==selectedArea})" :key="area.area_id">
          <MeetingRoomCard class="card-container" v-for="(room,i) in area.rooms" :key="room.room_id"
                           :status="(area.disabled=='1'||room.disabled=='1')?0:1"
                           :title="room.room_name || (room.entries && room.entries[0].room_name)"
                           :capacity="room.capacity"
                           :position="area.area_name"
                           :facilities="room.description||''"
                           :timeTable="room.entries||[]"
                           :startTime="area.morningstarts?parseInt(area.morningstarts):(area.start_time?calcTimeSpace(area.start_time):6)"
                           :endTime="area.eveningends?parseInt(area.eveningends):(area.end_time?calcTimeSpace(area.end_time):21)"
                           :currentDate="currentDate"
                           @click="gotoMeetingDetail(area.disabled,room.disabled,room.room_id)"
          />
        </div>
      </div>

    </template>
  </Layout>
  <van-popup v-model:show="showPicker" round position="bottom">
    <van-picker
        :columns="areaSet"
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