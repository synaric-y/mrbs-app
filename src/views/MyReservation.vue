<script setup>
import {closeDialog, showNotify, showToast, SwipeCell, Tab, Tabs} from 'vant';
import 'vant/es/notify/style' // 样式
import {ref, computed, onMounted} from 'vue'
import Layout from "@/components/Layout.vue";
import Header from "@/components/Header.vue";
import {useRouter} from 'vue-router';
import ReservationCard from "@/components/ReservationCard.vue";
import RepeatedEditDialog from "@/components/RepeatedEditDialog.vue";
import {cancelMeetingByIdApi, getMeetingByIdApi, getMeetingsByCreatorApi} from "@/api/index.js";
import {showConfirmDialog} from 'vant';
import 'vant/es/dialog/style'
import {i18n} from "@/i18n/index.js";
import _ from 'lodash'

// 全局路由
const router = useRouter();

const statusMapping = ['meeting.status.toStart', 'meeting.status.inProgress',  'meeting.status.finished', 'meeting.status.canceled']

const getStatus = (beg, end) => {
  const currentTs = new Date().getTime() / 1000 //转成s
  const begInt = parseInt(beg)
  const endInt = parseInt(end)


  if (currentTs < begInt) return 1 // 未开始
  if (currentTs < endInt) return 0 // 进行中
  return 2 // 已结束
}

const showRepeatedEditDialog = ref(false)

const disableClick = ref(false) // 禁止用户点击卡片，主要是防止取消到刷新之间的一段时间用户点击卡片

const active = ref(0)


const loading = ref(false)

const currentRepeatId = ref('')
const currentEntryId = ref('')
const totalList = ref([
  {
    list: [],
    page: 1,
    finished: false,
    loading: false,
    status: 0
  },
  {
    list: [],
    page: 1,
    finished: false,
    loading: false,
    status: 1
  },
  {
    list: [],
    page: 1,
    finished: false,
    loading: false,
    status: 2
  },
])

const getMyMeetings = (status) => {
  loading.value = true
  getMeetingsByCreatorApi({
    "pagenum": totalList.value[status].page,
    "status": status
  })
      .then(({code, data: list}) => {

        totalList.value[status].loading = false

        if (code !== 0) {
          throw new Error('列表加载失败')
        }

        if (list.length === 0) { // 加载完
          totalList.value[status].finished = true
        }else{
          totalList.value[status].list = [...totalList.value[status].list, ...list]
          totalList.value[status].page += 1
        }



      })
      .catch(err => {
        totalList.value[status].loading = false
        totalList.value[status].finished = true // 防止死循环
        showNotify({type: 'danger', message: err.message})
      })
}


const gotoEdit = (status, repeat_id, id, room_id) => {
  if (disableClick.value || status === 2) return



  if(!repeat_id){ // 单次
    router.push({path: '/detail',query:{room_id: room_id,entry_id:id}});
  }
  else{ // 循环
    currentRepeatId.value = repeat_id
    currentEntryId.value = id
    showRepeatedEditDialog.value = true
  }

  // getMeetingByIdApi({
  //   id: repeat_id,
  //   is_series: 1
  // })
  // .then(({data})=>{
  //   console.log(data)
  //   showRepeatedEditDialog.value = true
  // })
  // .catch(e=>{
  //   showNotify({type: 'danger', message: e.message})
  // })

}

const cancelMeeting = (entryId) => {

  if(disableClick.value) return

  disableClick.value = true

  const temp = {
    entry_id: parseInt(entryId),
  }

  showConfirmDialog({
    title: i18n.global.t('meeting.cancel.title'),
    message: i18n.global.t('meeting.cancel.message'),
    confirmButtonColor: '#591bb7'
  })
      .then(() => {
        cancelMeetingByIdApi(temp).then(res => {
          console.log(res)
          showToast(i18n.global.t('meeting.cancel.success'))


          setTimeout(()=>{
            disableClick.value = false
            window.location.reload() // 刷新整个页面，兼容ios
          },1000)


        })
            .catch((err) => {
              disableClick.value = false
              console.log(err)
              showToast(i18n.global.t('meeting.cancel.fail'))
            });
      })
      .catch((err) => {
        disableClick.value = false
        closeDialog()
      });

}


</script>

<template>

  <Layout>
    <template #header>
      <Header :title="$t('title.myReservation')">
        <template #header-left-btn>
          <van-icon size="1.4rem" name="arrow-left" @click="()=>{router.replace({ path: '/room' })}"/>
        </template>
      </Header>
    </template>
    <template #content>

      <van-tabs v-model:active="active" color="#591BB7">
        <van-tab v-for="(item,i) in totalList" :key="i" :title="$t(statusMapping[i])">
          <van-list
              v-model:loading="item.loading"
              :finished="item.finished"
              finished-text="没有更多了"
              @load="getMyMeetings(item.status)"
          >
            <div class="meetings">
              <van-swipe-cell
                  v-for="entry in item.list"
                  :key="entry.id"
                  :disabled="item.status===2"
              >
                <ReservationCard
                    :begTime="entry.start_time"
                    :endTime="entry.end_time"
                    :desc="entry.name"
                    :type="item.status"
                    :isRepeat="entry.repeat_id"
                    @click="gotoEdit(item.status,entry.repeat_id,entry.id,entry.room_id)"
                />
                <template #right>
                  <div class="btns">
                    <van-button square :text="$t('button.cancel')" class="cancel-button" @click="cancelMeeting(entry.id)"/>
                    <van-button square :text="$t('button.edit')" class="change-button"
                                @click="gotoEdit(item.status,entry.repeat_id,entry.id,entry.room_id)"/>
                  </div>
                </template>
              </van-swipe-cell>

            </div>
          </van-list>

        </van-tab>
      </van-tabs>

    </template>
  </Layout>
  <RepeatedEditDialog v-if="showRepeatedEditDialog" :repeat_id="currentRepeatId" :entry_id="currentEntryId" @close="showRepeatedEditDialog=false" @confirm="()=>{showRepeatedEditDialog=false;router.go(0)}"/>

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

  .cancel-button {
    height: 100%;
    background-color: var(--color-danger);
    color: #fff;
    border: 0;
  }

  .change-button {
    height: 100%;
    background-color: var(--color-primary);
    color: #fff;
    border: 0;
  }
}


</style>