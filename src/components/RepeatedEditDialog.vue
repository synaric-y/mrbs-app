<script setup>
import { ref, onBeforeUpdate, reactive, onMounted } from 'vue';
import {calcTimeSpace, calcTimeSpaceStr, ymdFormat} from '@/utils/timeTool.js'
import { i18n } from '@/i18n/index';
import {closeToast, showLoadingToast, showToast} from "vant";
import _ from 'lodash'
import dayjs from "dayjs";
import {editMeetingByIdApi, getAllAreasApi, getAllRoomsApi, getMeetingByIdApi} from '@/api/index.js'

const props = defineProps(['repeat_id','entry_id'])
const emits = defineEmits(['confirm','close'])

const check_box_list = [
  { label: 'day.monday', value: '1' },
  { label: 'day.tuesday', value: '2' },
  { label: 'day.wednesday', value: '3' },
  { label: 'day.thursday', value: '4' },
  { label: 'day.friday', value: '5' },
  { label: 'day.saturday', value: '6' },
  { label: 'day.sunday', value: '0' },
]

let meetForm = {
  tmp_repeat_id: 0,
  id: 0,
  area_id: '',
  area_name: '',
  room_id: '',
  room_name: '',
  rooms: [],
  name: '',
  start_date: '',
  end_date: '',
  start_hour: '',
  start_seconds: 0,
  rep_end_date: '',
  end_hour: '',
  end_seconds: 0,
  description: '',
  repeat_week: '1',
  check_list: [],
  rep_opt: 0,
  rep_interval: 1,
  // 未知参数
  all_day: "",
  type: "E",
  original_room_id: null,
  ical_uid: "1123123",
  ical_sequence: 1,
  ical_recur_id: "asdfa",
  allow_registration: "",
  registrant_limit: 10,
  registrant_limit_enabled: "1",
  registration_opens_value: 1,
  registration_open_units: "w",
  registration_open_enabled: "",
  registration_closes_value: 1,
  registration_closes_units: "w",
  registration_closes_enabled: "",
  rep_id: null,
  edit_series: 1,
  rep_type: 2,
  rep_day: [],
  month_type: 0,
  month_absolute: 2,
  month_relative_ord: "",
  month_relative_day: "",
  skip: 0,
  no_mail: 1,
  private: "",
  create_by: '',
  book_by: ''
}


const minDate = ref(new Date())
const areaOptions = ref([])
const roomOptions = ref([])
const filter = (type, options) => {
  if (type === 'minute') {
    return options.filter((option) => Number(option.value) % ((tempMeetForm.resolution||1800)/60) === 0);
  }
  return options;
};

// 弹窗
const showAreaPicker = ref(false)
const showRoomPicker = ref(false)
const showStartDateSelect = ref(false);
const showEndDateSelect = ref(false);
const showTime1Select = ref(false);
const showTime2Select = ref(false);

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
  days: {
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  },
  days_binary: '',
  end_date: ''
})


const getRooms = (area_id)=>{
  return new Promise((resolve,reject)=>{
    getAllRoomsApi({
      id: area_id
    }).then(({data})=>{

      const areas = data.areas
      const rooms = areas.rooms
      console.log(areas.start_time)


      tempMeetForm.area_start_time = calcTimeSpaceStr(areas.start_time)
      tempMeetForm.area_end_time = calcTimeSpaceStr(areas.end_time)
      tempMeetForm.resolution = areas.resolution

      console.log(tempMeetForm)

      roomOptions.value = []
      _.forEach(rooms,(item)=>{
        roomOptions.value.push({
          text: item.room_name,
          value: item.room_id
        })
      })

      resolve()
    })
    .catch(e=>{
      showToast('房间信息获取失败');
      reject()
    })
  })
}

// 区域
const onAreaConfirm = ({selectedOptions})=>{
  showAreaPicker.value = false
  tempMeetForm.area_id = selectedOptions[0].value
  tempMeetForm.area_name = selectedOptions[0].text

  getRooms(tempMeetForm.area_id)
}


const prepareRoom = ()=>{

  if(roomOptions.value.length === 0){
    showToast('房间信息为空，请切换其他区域');
    return
  }

  showRoomPicker.value = true;
}

// 房间
const onRoomConfirm = ({selectedOptions})=>{
  showRoomPicker.value = false
  tempMeetForm.room_id = selectedOptions[0].value
  tempMeetForm.room_name = selectedOptions[0].text
}

// 开始时间
const onConfirmStartDate = ({selectedValues})=>{
  showStartDateSelect.value = false;
  tempMeetForm.start_date = _.join(selectedValues,'-')
}

// 会议开始时间
const onConfirmTime1 = ({selectedValues})=>{
  showTime1Select.value = false;
  tempMeetForm.time1 = _.join(selectedValues,':')
}

// 会议结束时间
const onConfirmTime2 = ({selectedValues})=>{
  showTime2Select.value = false;
  tempMeetForm.time2 = _.join(selectedValues,':')
}


// 结束时间
const onConfirmEndDate = (val) => {
  showEndDateSelect.value = false;
  tempMeetForm.end_date = _.join(val.selectedValues,'-')
}


const validate = ()=>{
  if(!tempMeetForm.area_id || !tempMeetForm.area_name){
    showToast('区域未选择');
    return false
  }
  if(!tempMeetForm.room_id || !tempMeetForm.room_name){
    showToast('房间未选择');
    return false
  }
  if(!tempMeetForm.title){
    showToast('会议标题不能为空');
    return false
  }
  if(!tempMeetForm.start_date){
    showToast('请选择开始日期');
    return false
  }
  if(!tempMeetForm.time1){
    showToast('请选择会议开始时间');
    return false
  }
  if(!tempMeetForm.time2){
    showToast('请选择会议结束时间');
    return false
  }
  if(tempMeetForm.time1>=tempMeetForm.time2){
    showToast('会议开始时间必须小于结束时间');
    return false
  }
  if(!tempMeetForm.days){
    showToast('必须至少选择一个重复日期');
    return false
  }
  if(!tempMeetForm.end_date){
    showToast('请选择结束日期');
    return false
  }
  if(tempMeetForm.start_date>=tempMeetForm.end_date){
    showToast('开始日期必须小于结束日期');
    return false
  }

  console.log(tempMeetForm)

  return true
  // emits('confirm',form)
}

onMounted(()=>{

  getMeetingByIdApi({
    id: props.repeat_id,
    is_series: 1,
    ts: new Date().getTime() //防止取消重复请求
  })
  .then(({data})=>{
    console.log(data)

    let days = {
          0: false,
          1: false,
          2: false,
          3: false,
          4: false,
          5: false,
          6: false,
    }
    _.forEach(data.rep_day,item=>{
      days[item] = true
    })

    Object.assign(meetForm, data)

    Object.assign(tempMeetForm, {
      start_date: dayjs.unix(data.start_time).format('YYYY-MM-DD'),
      end_date: data.end_date,
      area_id: data.area_id,
      area_name: data.area_name,
      room_id: data.room_id,
      room_name: data.room_name,
      interval: data.rep_interval,
      days: days, // 周一...周日
      title: data.name,
      time1: dayjs.unix(data.start_time).format('HH:mm'),
      time2: dayjs.unix(data.end_time).format('HH:mm'),
      create_by: data.create_by,
    })


    getRooms(tempMeetForm.area_id)

  })

  getAllAreasApi()
      .then(({data})=>{
        _.forEach(data,(item)=>{
          areaOptions.value.push({
            text: item.area_name,
            value: item.id
          })
        })
      })
      .catch(e=>{
        showToast('区域信息获取失败');
      })
})

const toBinary = (checkList)=>{
  let binaryArray = new Array(7).fill('0');
  _.forIn(checkList, (value, key)=>{
    console.log(value,key);
    binaryArray[parseInt(key)] = value?'1':'0'
  });
  return _.join(binaryArray, '');
}

const toStrArray = (checkList)=>{
  let strArray = []
  _.forIn(checkList, (value, key)=>{
    console.log(value,key);
    if(value) strArray.push(key+'')
  });
  return strArray
}

const commit = ()=>{

  if(!validate()) return

  const res = toBinary(tempMeetForm.days)
  console.log(res)

  console.log(dayjs(tempMeetForm.start_date+' '+tempMeetForm.time2).unix())

  meetForm = {
    ...meetForm,
    original_room_id: tempMeetForm.room_id,
    tmp_repeat_id: props.repeat_id,
    id: props.entry_id,
    name: tempMeetForm.title,
    room_id: tempMeetForm.room_id,
    room_name: tempMeetForm.room_name,
    rooms: [tempMeetForm.room_id],
    area_id: tempMeetForm.area_id,
    area_name: tempMeetForm.area_name,
    end_date: tempMeetForm.end_date,
    rep_end_date: tempMeetForm.end_date,
    start_date: tempMeetForm.start_date,
    start_hour: tempMeetForm.time1,
    start_time: dayjs(tempMeetForm.start_date+' '+tempMeetForm.time1).unix(),
    end_time: dayjs(tempMeetForm.start_date+' '+tempMeetForm.time2).unix(),
    end_hour: tempMeetForm.time2,
    rep_opt: toBinary(tempMeetForm.days),
    rep_day: toStrArray(tempMeetForm.days)
  }

  console.log(meetForm)

  showLoadingToast("请稍候...")
  editMeetingByIdApi(meetForm).then(({ data, code, msg }) => {
      closeToast()
      if (code === 0) {
        showToast('循环会议编辑成功');

        setTimeout(()=>{
          emits('confirm')
        },1500)

      } else {
        showToast('循环会议编辑失败，错误信息：'+msg);
      }
    }).catch(e=>{
    closeToast()
    showToast('循环会议编辑失败，错误信息：'+e.message);
  })
  // Api.editMeet(this.meetForm).then(({ data, code, msg }) => {
  //   if (code == 0) {
  //     this.$emit('close')
  //     ElMessage({
  //       message: this.$t('base.editSuccess'),
  //       type: 'success',
  //     })
  //   } else {
  //     ElMessage({
  //       message: msg,
  //       type: 'error',
  //     })
  //   }
  // })
}


</script>

<template>
  <van-overlay :show="true" lock-scroll @touchmove.stop="()=>{}">
    <div class="wrapper" @click.stop>
      <div class="content">
        <div class="header">编辑循环会议</div>

        <van-cell-group inset>

          <van-field
              v-model="tempMeetForm.area_name"
              is-link
              readonly
              name="areaPicker"
              label="区域"
              placeholder="点击选择区域"
              @click="showAreaPicker = true"
          />
          <van-field
              v-model="tempMeetForm.room_name"
              is-link
              readonly
              name="roomPicker"
              label="会议室"
              placeholder="点击选择会议室"
              @click="prepareRoom"
          />
          <van-field
              v-model="tempMeetForm.title"
              name="datePicker"
              maxlength="20"
              label="会议标题"
              placeholder="请输入会议标题"
          />
          <van-field
              v-model="tempMeetForm.start_date"
              is-link
              readonly
              name="datePicker"
              label="开始日期"
              placeholder="点击选择日期"
              @click="showStartDateSelect = true"
          />
          <van-field
              v-model="tempMeetForm.time1"
              readonly
              label="会议开始时间"
              label-align="right"
              placeholder="点击选择时间"
              left-icon="clock-o"
              @click="showTime1Select = true"
          />
          <van-field
              v-model="tempMeetForm.time2"
              readonly
              label-align="right"
              label="会议结束时间"
              placeholder="点击选择时间"
              left-icon="clock-o"
              @click="showTime2Select = true"
          />
        </van-cell-group>



        <div class="repeat">
          <div class="repeat-left">重复间隔为</div>
          <van-stepper v-model="tempMeetForm.interval" min="1" max="4" input-width="50px" button-size="30px" />
          <div class="repeat-right">周后的</div>
        </div>

        <div class="select-area">
          <div class="checkbox-wrapper">
            <div class="title-wrapper"
                 v-for="(item,index) in check_box_list"
                 :key="item.value"
            >
              <van-checkbox
                  :name="item.value"
                  v-model="tempMeetForm.days[item.value]"
                  shape="square"
                  checked-color="#591bb7"
                  icon-size="16px"
                  @click.stop
              ></van-checkbox>

              <div class="title">{{$t(item.label)}}</div>
            </div>
          </div>
        </div>

        <van-cell-group inset>
          <van-field
              v-model="tempMeetForm.end_date"
              is-link
              readonly
              name="datePicker"
              label="结束时间"
              placeholder="点击选择时间"
              @click="showEndDateSelect = true"
          />
        </van-cell-group>




        <div class="btns">
          <div class="btn" @click="$emit('close')">{{$t('button.cancel')}}</div>
          <div class="btn btn-confirm" @click="commit">{{$t('button.confirm')}}</div>
        </div>


      </div>
    </div>
    <!--区域-->
    <van-popup v-model:show="showAreaPicker" round position="bottom">
      <van-picker
          :columns="areaOptions"
          @cancel="showAreaPicker = false"
          @confirm="onAreaConfirm"
      >
        <template #confirm>
          <div style="color:#591BB7">{{$t('button.confirm')}}</div>
        </template>
      </van-picker>
    </van-popup>
    <!--房间-->
    <van-popup v-model:show="showRoomPicker" position="bottom">
      <van-picker :columns="roomOptions" @confirm="onRoomConfirm" @cancel="showRoomPicker = false">
        <template #confirm>
          <div style="color:#591BB7">{{$t('button.confirm')}}</div>
        </template>
      </van-picker>
    </van-popup>
    <!--开始时间-->
    <van-popup v-model:show="showStartDateSelect" position="bottom">
      <van-date-picker @confirm="onConfirmStartDate" @cancel="showStartDateSelect = false" :min-date="minDate">
        <template #confirm>
          <div style="color:#591BB7">{{$t('button.confirm')}}</div>
        </template>
      </van-date-picker>
    </van-popup>
    <!--选择会议开始时间-->
    <van-popup v-model:show="showTime1Select" position="bottom">
      <van-time-picker
          title="选择会议开始时间"
          @confirm="onConfirmTime1"
          @cancel="showTime1Select = false"
          :min-time="tempMeetForm.area_start_time || '08:00'"
          :max-time="tempMeetForm.area_end_time || '21:00'"
          :filter="filter"
      />
    </van-popup>
    <!--选择会议结束时间-->
    <van-popup v-model:show="showTime2Select" position="bottom">
      <van-time-picker
          title="选择结束时间"
          @confirm="onConfirmTime2"
          @cancel="showTime2Select = false"
          :min-time="tempMeetForm.area_start_time || '08:00'"
          :max-time="tempMeetForm.area_end_time || '21:00'"
          :filter="filter"
      />
    </van-popup>
    <!--结束时间-->
    <van-popup v-model:show="showEndDateSelect" position="bottom">
      <van-date-picker @confirm="onConfirmEndDate" @cancel="showEndDateSelect = false" :min-date="minDate">
        <template #confirm>
          <div style="color:#591BB7">{{$t('button.confirm')}}</div>
        </template>
      </van-date-picker>
    </van-popup>

  </van-overlay>
</template>

<style scoped lang="scss">
.wrapper{
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,.3);
  display: flex;
  justify-content: center;
  align-items: center;

  .content{
    width: 90%;
    border-radius: 0.2rem;
    padding-top: 0.5rem;
    background-color: var(--van-cell-background);

    .header{
      padding-left: 32px;
      font-weight: 700;
      font-size: 1rem;
      color: var(--color-heading);
      line-height: 3;
    }

    .repeat{
      padding-left: 32px;
      font-size: 0.9rem;
      color: var(--van-cell-text-color);
      display: flex;
      gap: 0.5rem;
      align-items: center;
      line-height: 3;
    }

    .checkbox-wrapper{
      display: flex;
      flex-wrap: wrap;
      padding-left: 2rem;

      .title-wrapper{
        display: flex;
        align-items: center;
        gap: 0.5rem;
        height: 3rem;
        margin-right: 1rem;

        .title{
          color: var(--van-cell-text-color);
          font-size: 0.8rem;
        }
      }
    }


    .btns{
      display: flex;
      margin-top: 1rem;
      border-top: 0.05rem solid var(--color-border);

      .btn{
        flex:1;
        text-align: center;
        line-height: 3;
      }

      .btn-confirm{
        color: var(--color-primary);
      }
    }
  }
}

</style>