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

const minDate = ref(new Date())
const filter = (type, options) => {
  if (type === 'minute') {
    return options.filter((option) => Number(option.value) % ((tempMeetForm.resolution||1800)/60) === 0);
  }
  return options;
};

// 弹窗
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
  end_date: ''
})

// 用于表单展示，无逻辑效果
const startDateDisplay = ref([])
const endDateDisplay = ref([])
const time1Display = ref([])
const time2Display = ref([])

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

    startDateDisplay.value = tempMeetForm.start_date.split('-')
    endDateDisplay.value = tempMeetForm.end_date.split('-')
    time1Display.value = tempMeetForm.time1.split(':')
    time2Display.value = tempMeetForm.time2.split(':')

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

  // 构建查询参数
  const query = {
    "area_id": tempMeetForm.area_id,
    "area_name": tempMeetForm.area_name,
    "room_id": tempMeetForm.room_id,
    "room_name": tempMeetForm.room_name,
    "rooms": [
      tempMeetForm.room_id
    ],
    "name": tempMeetForm.title,
    "start_date": tempMeetForm.start_date,
    "start_hour": tempMeetForm.time1,
    "start_seconds": dayjs(tempMeetForm.start_date+' '+tempMeetForm.time1).unix(),
    "end_date": tempMeetForm.end_date,
    "end_hour": tempMeetForm.time2,
    "end_seconds": dayjs(tempMeetForm.start_date+' '+tempMeetForm.time2).unix(),
    "rep_end_date": tempMeetForm.end_date,
    "original_room_id": tempMeetForm.room_id,
    "tmp_repeat_id": props.repeat_id,
    "id": props.entry_id,
    "edit_series": 1, // 决定循环会议
    "rep_day": toStrArray(tempMeetForm.days),
    "rep_interval": tempMeetForm.interval,
    "rep_opt": toBinary(tempMeetForm.days),
    "rep_type": 2,
  }


  console.log(query)


  showLoadingToast("请稍候...")
  editMeetingByIdApi(query).then(({ data, code, msg }) => {
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
              disabled
              name="areaPicker"
              label="区域"
              placeholder="无"
          />
          <van-field
              v-model="tempMeetForm.room_name"
              disabled
              name="roomPicker"
              label="会议室"
              placeholder="无"
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
              is-link
              label="会议开始"
              placeholder="点击选择时间"
              left-icon="clock-o"
              @click="showTime1Select = true"
          />
          <van-field
              v-model="tempMeetForm.time2"
              readonly
              is-link
              label="会议结束"
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
              label="结束日期"
              placeholder="点击选择日期"
              @click="showEndDateSelect = true"
          />
        </van-cell-group>




        <div class="btns">
          <div class="btn" @click="$emit('close')">{{$t('button.cancel')}}</div>
          <div class="btn btn-confirm" @click="commit">{{$t('button.confirm')}}</div>
        </div>


      </div>
    </div>


    <!--开始时间-->
    <van-popup v-model:show="showStartDateSelect" position="bottom">
      <van-date-picker @confirm="onConfirmStartDate" @cancel="showStartDateSelect = false" :min-date="minDate" v-model="startDateDisplay">
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
          v-model="time1Display"
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
          v-model="time2Display"
      />
    </van-popup>
    <!--结束时间-->
    <van-popup v-model:show="showEndDateSelect" position="bottom">
      <van-date-picker @confirm="onConfirmEndDate" @cancel="showEndDateSelect = false" :min-date="minDate" v-model="endDateDisplay">
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