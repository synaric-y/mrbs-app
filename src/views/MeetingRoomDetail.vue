<script setup>

import Header from "@/components/Header.vue";
import Layout from "@/components/Layout.vue";
import DateSelect from "@/components/DateSelect.vue";
import TimeStepperScroll from "@/components/TimeStepperScroll.vue";
import RepeatedReserveDialog from "@/components/RepeatedReserveDialog.vue";
import {useRoute, useRouter} from 'vue-router';
import {onMounted, ref} from "vue";
import {
  calcTimeSpace,
  dayTag,
  getZeroTimestamp, hourFormat,
  hrToTimestamp,
  secondsInOneDay,
  timestampToHr,
  ymdFormat
} from '@/utils/timeTool.js'
import {
  bookMeetingApi,
  cancelMeetingByIdApi,
  editMeetingByIdApi,
  getAllRoomsApi,
  getAreaListApi,
  getMeetingByIdApi
} from "@/api/index.js";
import {closeDialog, showConfirmDialog, showNotify, showToast} from "vant";
import 'vant/es/toast/style'
import 'vant/es/notify/style'
import SvgIcon from "@/components/SvgIcon.vue";
import InfoHeader from "@/components/InfoHeader.vue";
import 'vant/es/dialog/style'
import {i18n} from "@/i18n/index.js";

const route = useRoute()
const router = useRouter();


const currentDate = ref(route.query.time?new Date(parseInt(route.query.time)):new Date()) // 当前日期，双向绑定 初始值是由index的时间戳（ms）转来的，如果没有这个参就是当天日期

// 常量，今天到14天以后
const minDate = ref(new Date())
const maxDate = ref(new Date())
maxDate.value.setDate(minDate.value.getDate() + 14)

const showRepeatedReserveDialog = ref(false) // 周期会议对话框

const room_id = ref(route.query.room_id)
const room = ref({})
const area = ref({})
const loaded = ref(false)

const entryId = route.query.entry_id
const isFirst = ref(!!entryId)
const currentMeeting = ref(null)

// 时间轴事件
const leftTime = ref(8)
const rightTime = ref(8)
const timelineDisabled = ref(false)
const meetingTopic = ref('')

const returnToIndex = ()=>{
  router.replace({ path:'/room',query:{time:currentDate.value.getTime()} }) //直接跳走
}

const getMeetings = ()=>{

  loaded.value = false

  const today = getZeroTimestamp(currentDate.value)
  const todayEnd = today + secondsInOneDay - 1

  // 构造查询数据
  const temp = {
    end_time:todayEnd,
    start_time:today,
    area:"",
    type:"all"
  }

  // 清空会议
  room.value.entries = []

  return new Promise((resolve, reject) => {

    // 发请求
    getAreaListApi(temp)
      .then((res) => {
        // 重新赋值
        const temp = res.data.areas

        for(let a of temp){
          const j = a.rooms.findIndex((e)=>{return e.room_id == room_id.value})
          console.log(j)
          if(j!==-1){
            room.value.entries = a.rooms[j].entries
            area.value = a
            console.log(area.value)
            break
          }
        }

        if(room.value.entries==undefined) room.value.entries = []

        loaded.value = true
        timelineDisabled.value = false

        resolve();

      }).catch(err => {
        throw new Error("未知异常"+err.message);
      })

  });
}

const getAllRoomList = async ()=>{

  loaded.value = false

  // 构造查询数据
  const temp = {
    id:'',
    type:"all"
  }

  return new Promise((resolve, reject) => {

    getAllRoomsApi(temp)
        .then((res) => {
          let areas = res.data.areas

          console.log(areas)

          for (let a of areas) {
            const j = a.rooms.findIndex((e) => {return e.room_id == room_id.value})
            console.log(j)
            if (j !== -1) {
              room.value = a.rooms[j]
              area.value = a
              break
            }
          }

          resolve()

        })
        .catch(err => {
          throw new Error("未知异常" + err.message);
        })

  });
}

const getMeetingById = ()=>{
  return new Promise((resolve, reject) => {
    getMeetingByIdApi({
      id: entryId
    })
    .then(res=>{
      currentMeeting.value=res.data

      // 时间轴手柄
      leftTime.value = timestampToHr(currentMeeting.value.start_time)
      rightTime.value = timestampToHr(currentMeeting.value.end_time)

      // 会议主题
      meetingTopic.value = currentMeeting.value.name

      // 更换时间，以跳到会议当天
      currentDate.value = new Date(currentMeeting.value.start_time * 1000)

      resolve()
    })
    .catch(err => {
      throw new Error("未知异常" + err.message);
    })
  });
}

// 只留下和自己无关的会
const removeEditingMeeting = ()=>{
  return new Promise((resolve, reject)=>{
    const j = room.value.entries.findIndex((e) => {return e.entry_id == entryId})
    room.value.entries.splice(j,1)  // 直接赋值好像不能触发刷新
    resolve()
  })
}



const showDateSelect = ref(false)
const onConfirmDate = (value) => {
  isFirst.value=false
  showDateSelect.value = false;
  currentDate.value = new Date(value.selectedValues[0]+'/'+value.selectedValues[1]+'/'+value.selectedValues[2])
  // 拼接数组，注意移动端适配
  getMeetings()
}

const onManualSelectDate = ()=>{
  isFirst.value=false
  getMeetings()
}

const showCommonDialog = (type,nextFunc)=>{
  showConfirmDialog({
    title: i18n.global.t('meeting.'+type+'.title'),
    message: i18n.global.t('meeting.'+type+'.message'),
    confirmButtonColor: '#591bb7'
  })
  .then(() => {
    nextFunc()
  })
  .catch(() => {
    closeDialog()
  });
}

const showReserveDialog=()=>{
  if(!meetingTopic.value || meetingTopic.value.length==0){
    showToast(i18n.global.t('meeting.form.missing'),);
    return
  }
  showCommonDialog('reserve',reserveMeeting)
}

const reserveMeeting=()=>{

  if(!meetingTopic.value || meetingTopic.value.length==0){
    showToast(i18n.global.t('meeting.form.missing'),);
    return
  }

  // 构建查询参数
  const query = {
    room_id: room.value.room_id,
    start_time: hrToTimestamp(currentDate.value,leftTime.value),
    end_time: hrToTimestamp(currentDate.value,rightTime.value),
    name: meetingTopic.value
  }


  bookMeetingApi(query)
      .then(res=>{
        showToast(i18n.global.t('meeting.reserve.success'));

      })
      .catch(error=>{
        showNotify({type:'danger',message:i18n.global.t('meeting.reserve.fail')+error});

      })
      .finally(()=>{
        returnToIndex()
      })
}

const convertToBinaryWithSundayLeft = (rep_day)=>{
  let binaryRepresentation = 0;
  rep_day.forEach(value => {
    binaryRepresentation |= (1 << (7 - value));
  });
  return binaryRepresentation;
}

const repeatReserve=(form)=>{
  showRepeatedReserveDialog.value=false;

  console.log(form)

  let pack = {
    "id": 0,
    "area_id": 20,
    "area_name": "shanghai",
    "room_id": 18,
    "room_name": "TestA",
    "rooms": [
      18
    ],
    "name": "测试A",
    "start_date": "2024-10-31",
    "end_date": "2024-10-31",
    "start_hour": "19:30",
    "start_seconds": 1730374200,
    "rep_end_date": "2024-11-08",
    "end_hour": "20:00",
    "end_seconds": 1730376000,
    "description": "",
    "repeat_week": "1",
    "check_list": [],
    "rep_opt": 48,
    "rep_interval": 2,
    "all_day": "",
    "type": "E",
    "original_room_id": 18,
    "ical_uid": "1123123",
    "ical_sequence": 1,
    "ical_recur_id": "asdfa",
    "allow_registration": "",
    "registrant_limit": 10,
    "registrant_limit_enabled": "1",
    "registration_opens_value": 1,
    "registration_open_units": "w",
    "registration_open_enabled": "",
    "registration_closes_value": 1,
    "registration_closes_units": "w",
    "registration_closes_enabled": "",
    "rep_id": null,
    "edit_series": 1,
    "rep_type": 2,
    "rep_day": [
      "2",
      "3"
    ],
    "month_type": 0,
    "month_absolute": 2,
    "month_relative_ord": "",
    "month_relative_day": "",
    "skip": 0,
    "no_mail": 1,
    "private": "",
    "create_by": ""
  }

  const rep_day = form.rep_day

  rep_day.forEach((item,idx,arr)=>{arr[idx]=item+''})

  // 构建查询参数
  const query = {
    area_id: area.value.area_id,
    area_name: area.value.area_name,
    description: '',
    room_id: room.value.room_id,
    original_room_id: room.value.room_id,
    room_name: room.value.room_name,
    rooms: [room.value.room_id],
    name: meetingTopic.value,
    start_date: ymdFormat(new Date()),
    start_hour: hourFormat(leftTime.value),
    start_seconds: hrToTimestamp(currentDate.value,leftTime.value),
    end_date: ymdFormat(new Date()),
    end_hour: hourFormat(rightTime.value),
    end_seconds: hrToTimestamp(currentDate.value,rightTime.value),
    rep_end_date: form.rep_end_date,
    rep_day: rep_day,
    rep_opt: convertToBinaryWithSundayLeft(form.rep_day)
  }

  pack = {
    ...pack,
    ...query
  }

  console.log(pack)

  editMeetingByIdApi(pack).then(res=>{

    showToast(i18n.global.t('meeting.edit.success'))

  }).catch(err=>{

    showToast(i18n.global.t('meeting.edit.fail')+err)

  }).finally(()=>{
    router.replace({ path:'/my' }) //直接跳走
  })

}

const editMeeting = ()=>{


  const temp = {
    "id": "444",
    "create_by": "joy",
    "admins": [],
    "book_by": "joy",
    "name": "测试2",
    "description": "aaaaaaaa",
    "room_number": "TestB",
    "type": "I",
    "start_date": "2024-09-23",
    "start_seconds": 1727056800,
    "end_seconds": 1727064000,
    "end_date": "2024-09-23",
    "rooms": [
      20
    ],
    "edit_series": 0,
    "rep_type": 0,
    "all_day": "",
    "original_room_id": null,
    "ical_uid": "",
    "ical_sequence": 1,
    "ical_recur_id": "",
    "allow_registration": "",
    "registrant_limit": 10,
    "registrant_limit_enabled": "1",
    "registration_opens_value": 1,
    "registration_open_units": "",
    "registration_open_enabled": "",
    "registration_closes_value": 1,
    "registration_closes_units": "",
    "registration_closes_enabled": "",
    "rep_id": null,
    "rep_end_date": "",
    "rep_day": [],
    "rep_interval": 1,
    "month_type": 0,
    "month_absolute": 2,
    "month_relative_ord": "",
    "month_relative_day": "",
    "skip": 1,
    "no_mail": 1,
    "private": ""
  }

  Object.assign(temp,currentMeeting.value)

  temp.start_seconds = hrToTimestamp(currentDate.value,leftTime.value)
  temp.end_seconds= hrToTimestamp(currentDate.value,rightTime.value)
  temp.name = meetingTopic.value
  temp.rooms = [parseInt(room_id.value)]
  temp.start_date = ymdFormat(currentDate.value)
  temp.end_date = ymdFormat(currentDate.value)

  editMeetingByIdApi(temp).then(res=>{

    showToast(i18n.global.t('meeting.edit.success'))

  }).catch(err=>{

    showToast(i18n.global.t('meeting.edit.fail')+err)

  }).finally(()=>{
    router.replace({ path:'/my' }) //直接跳走
  })
}

const cancelMeeting = ()=>{

  const temp={
    entry_id:parseInt(entryId),
  }
  cancelMeetingByIdApi(temp)
      .then(res => {
        showToast(i18n.global.t('meeting.cancel.success'))
      })
      .catch(err => {
        showToast(i18n.global.t('meeting.cancel.fail') + err)
      })
      .finally(() => {
        router.replace({path: '/my'}) //直接跳走
      })
}




onMounted(()=>{

  if(!entryId){
    getAllRoomList()
        .then(getMeetings)
        .catch(err=>{showNotify({ type: 'danger', message: err.message })})
    return
  }

  getAllRoomList()
      .then(getMeetingById)
      .then(getMeetings)
      .then(removeEditingMeeting)
      .catch(err => {
        showNotify({ type: 'danger', message: err.message })
      })

})





</script>

<template>
  <Layout v-if="loaded">

    <template #header>
      <Header :title="$t('room.title')+(room.room_name)">
        <template #header-left-btn>
          <SvgIcon name="navigate-before" width="1.7rem" height="1.7rem" @click="returnToIndex"/>
        </template>
      </Header>

      <DateSelect v-model:currentDate="currentDate" @manualSelectDate="onManualSelectDate"/>


    </template>
    <template #content>
      <InfoHeader :title="room.room_name" :position="area.area_name" :capacity="room.capacity" :facilities="room.description"/>

      <TimeStepperScroll
          :isFirst="isFirst"
          :lb="area.morningstarts?parseInt(area.morningstarts):(area.start_time?calcTimeSpace(area.start_time):6)"
          :ub="area.eveningends?parseInt(area.eveningends):(area.end_time?calcTimeSpace(area.end_time):21)"
          :meetings="room.entries"
          :currentDate="currentDate"
          v-model:leftHandle="leftTime"
          v-model:rightHandle="rightTime"
          v-model:disabled="timelineDisabled"
          :scale="15"
      />

      <div class="form-item">
        <div class="title">{{$t('meeting.form.date')}}</div>
        <div class="form-item-right" @click="showDateSelect=true;">
          <div class="text">{{ymdFormat(currentDate)}},&nbsp;{{$t(dayTag(currentDate))}}</div>
          <van-icon name="arrow" />
        </div>
      </div>
      <div class="form-item">
        <div class="title">{{$t('meeting.form.topic')}}</div>
        <input :disabled="timelineDisabled" class="input" v-model="meetingTopic" :placeholder="$t('meeting.form.placeholder')"/>
      </div>
      <van-button :disabled="timelineDisabled" class="large-btn" color="#591bb7" type="primary" round size="large" @click="showReserveDialog" v-if="!entryId">{{ $t('button.reserve') }}</van-button>
      <van-button :disabled="timelineDisabled" class="large-btn" color="#591bb7" type="primary" round size="large" @click="showRepeatedReserveDialog=true" v-if="!entryId">{{ $t('button.repeated_reserve') }}</van-button>
      <van-button class="large-btn" color="#bebebe" type="primary" round size="large" @click="returnToIndex" v-if="!entryId">{{ $t('button.cancel') }}</van-button>
      <van-button class="large-btn" color="#591bb7" type="primary" round size="large" @click="showCommonDialog('edit',editMeeting)" v-if="entryId">{{ $t('button.confirm') }}</van-button>
      <van-button class="large-btn" color="#bebebe" type="primary" round size="large" @click="showCommonDialog('cancel',cancelMeeting)" v-if="entryId">{{ $t('button.cancel') }}</van-button>

    </template>
  </Layout>
  <van-popup v-model:show="showDateSelect" position="bottom">
    <van-date-picker @confirm="onConfirmDate" @cancel="showDateSelect = false" :min-date="minDate"
                     :max-date="maxDate">
      <template #confirm>
        <div style="color:#591BB7">{{$t('button.confirm')}}</div>
      </template>
    </van-date-picker>
  </van-popup>
  <RepeatedReserveDialog v-if="showRepeatedReserveDialog" @confirm="(form)=>{repeatReserve(form)}" @close="showRepeatedReserveDialog=false"/>

</template>

<style scoped lang="scss">

.wrapper{
  width:100%;
}


.form-item{
  display: flex;
  height: 3rem;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  border-bottom: 0.05rem solid var(--color-border);

  .title{
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--color-primary-text);
    min-width: 4rem;
    white-space: nowrap;
  }

  .form-item-right{
    display: flex;
    gap: 0.3rem;
    align-items: center;
    flex-direction: row;
    color: var(--color-regular-text);
  }

  .text{
    color: var(--color-regular-text);
    font-size: 0.85rem;
  }
}

.large-btn{
  margin-top: 1.2rem;
  font-size: 1.1rem;
}

.input{
  color: #575757;
  font-size: 0.85rem;
  box-sizing: border-box;
  line-height: inherit;
  resize: none;
  user-select: auto;
  background-color: transparent;
  border: 0;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  display: block;
  text-align: right;
  overflow-clip-margin: 0 !important;
  overflow: clip !important;
  padding-block: 1px;
  padding-inline: 2px;
  -webkit-appearance:none;
}

.input::placeholder {
  color: #cccccc;
}
</style>