<script setup>
import { ref, onBeforeUpdate, reactive } from 'vue';
import {ymdFormat} from '@/utils/timeTool.js'
import { i18n } from '@/i18n/index';
import {showToast} from "vant";

const check_box_list = [
  { label: 'day.monday', value: '1' },
  { label: 'day.tuesday', value: '2' },
  { label: 'day.wednesday', value: '3' },
  { label: 'day.thursday', value: '4' },
  { label: 'day.friday', value: '5' },
  { label: 'day.saturday', value: '6' },
  { label: 'day.sunday', value: '0' },
]

const props = defineProps([])
const emits = defineEmits(['confirm','close'])

// 常量，今天到14天以后
const minDate = ref(new Date())
const maxDate = ref(new Date())
maxDate.value.setDate(minDate.value.getDate() + 14)

const showDateSelect = ref(false);

const onConfirmDate = (value) => {
  showDateSelect.value = false;
  form.rep_end_date = value.selectedValues[0]+'-'+value.selectedValues[1]+'-'+value.selectedValues[2]
}

const checkboxRefs = ref([]);
const toggle = (index) => {
  checkboxRefs.value[index].toggle();
};
onBeforeUpdate(() => {
  checkboxRefs.value = [];
});

// 拦截滚动事件
const stop_scroll_chaining=(e)=>{
  e.preventDefault();
  e.stopPropagation();
}


const form = reactive({
  rep_interval: 1,
  rep_day: [], //1~7
  rep_end_date: ymdFormat(new Date()),
})

const validate = ()=>{
  if(form.rep_interval<1 || form.rep_interval>8){
    showToast(i18n.global.t('meeting.form.rep_interval_fail'),);
    return
  }
  if(!form.rep_day || form.rep_day.length===0){
    showToast(i18n.global.t('meeting.form.rep_day_fail'),);
    return
  }


  emits('confirm',form)
}

</script>

<template>
  <van-overlay :show="true" lock-scroll @touchmove="stop_scroll_chaining">
    <div class="wrapper" @click.stop>
      <div class="content">
        <div class="header">循环定时预定</div>

        <div class="repeat">
          <div class="repeat-left">重复间隔为</div>
          <van-stepper v-model="form.rep_interval" min="1" max="8" input-width="50px" button-size="30px" />
          <div class="repeat-right">周后的</div>
        </div>


        <div class="select-area">
          <van-checkbox-group v-model="form.rep_day">
            <van-cell-group inset>
              <van-cell
                  v-for="(item,index) in check_box_list"
                  clickable
                  :key="item.value"
                  @click="toggle(index)"
              >
                <template #title>
                  <div class="title-wrapper">
                    <van-checkbox
                        :name="item.value"
                        :ref="el => checkboxRefs[index] = el"
                        shape="square"
                        checked-color="#591bb7"
                        icon-size="16px"
                        @click.stop
                    />
                    <div class="title">{{$t(item.label)}}</div>
                  </div>
                </template>

              </van-cell>
            </van-cell-group>
          </van-checkbox-group>

        </div>

        <div class="end-date">
          <div class="title">结束{{$t('meeting.form.date')}}</div>
          <div class="form-item-right" @click="showDateSelect=true;">
            <div class="text">{{ form.rep_end_date }}</div>
            <van-icon name="arrow" />
          </div>
        </div>

        <div class="btns">
          <div class="btn" @click="$emit('close')">{{$t('button.cancel')}}</div>
          <div class="btn btn-confirm" @click="validate()">{{$t('button.confirm')}}</div>
        </div>


      </div>
    </div>
    <van-popup v-model:show="showDateSelect" position="bottom">
      <van-date-picker @confirm="onConfirmDate" @cancel="showDateSelect = false" :min-date="minDate"
                       :max-date="maxDate">
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
    background-color: #fff;
    border-radius: 0.2rem;
    padding-top: 0.5rem;

    .header{
      padding-left: 32px;
      font-weight: 700;
      font-size: 1rem;
      color: #333;
      line-height: 3;
    }

    .repeat{
      padding-left: 32px;
      font-size: 0.9rem;
      color: #666;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      line-height: 3;
    }

    .title-wrapper{
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .title{
        color: #333;
        font-size: 0.8rem;
      }
    }

    .end-date{
      padding: 0 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;

      .title{
        font-weight: 700;
        color: #333;
        line-height: 4;
      }

      .form-item-right{
        color: #555;
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
    }

    .btns{
      display: flex;
      margin-top: 1rem;
      border-top: 0.05rem solid #eee;

      .btn{
        flex:1;
        text-align: center;
        line-height: 3;
      }

      .btn-confirm{
        color: #591BB7;
      }
    }
  }
}

</style>