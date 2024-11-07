<script setup>
import {closeDialog, showNotify, showToast, SwipeCell, Tab, Tabs} from 'vant';
import 'vant/es/notify/style' // 样式
import {ref,computed,onMounted} from 'vue'
import Layout from "@/components/Layout.vue";
import Header from "@/components/Header.vue";
import {useRouter} from 'vue-router';
import ReservationCard from "@/components/ReservationCard.vue";
import {cancelMeetingByIdApi, getMeetingsByCreatorApi} from "@/api/index.js";
import { showConfirmDialog } from 'vant';
import 'vant/es/dialog/style'
import {i18n} from "@/i18n/index.js";
import _ from 'lodash'

// 全局路由
const router = useRouter();

const statusMapping = ['meeting.status.inProgress','meeting.status.toStart','meeting.status.finished','meeting.status.canceled']

const getStatus = (beg,end)=>{
  const currentTs = new Date().getTime()/1000 //转成s
  const begInt = parseInt(beg)
  const endInt = parseInt(end)


  if(currentTs < begInt) return 1 // 未开始
  if(currentTs < endInt) return 0 // 进行中
  return 2 // 已结束
}

const reservationList = ref([])
const loaded = ref(false)
const active = ref(1)


const loading = ref(false)
const finished = ref(false)
const currentPage = ref(1)
const totalList = ref([])

const getMyMeetings = ()=>{
  loading.value = true
  getMeetingsByCreatorApi({
        "pagenum": currentPage.value,
      })
      .then(({code,data:list})=>{

        loading.value = false

        if(code!==0){
          throw new Error('列表加载失败')
        }

        if(list.length===0){ // 加载完
          finished.value = true
        }

        const tempList = _.forEach(list,item=>{
          item.status = getStatus(item.start_time,item.end_time)
        })
        totalList.value = [...totalList.value, ...tempList]
        currentPage.value += 1

      })
      .catch(err=>{
        loading.value = false
        showNotify({type: 'danger', message: err.message})
      })
}

onMounted(()=>{
  // getMyMeetings()
})



const gotoEdit = (status,id,room_id)=>{
  if(status!==1) return
  router.push({path: '/detail',query:{room_id: room_id,entry_id:id}});
}

const cancelMeeting = (entryId)=>{


  const temp={
    entry_id:parseInt(entryId),
  }

  showConfirmDialog({
    title: i18n.global.t('meeting.cancel.title'),
    message: i18n.global.t('meeting.cancel.message'),
    confirmButtonColor: '#591bb7'
  })
  .then(() => {
    cancelMeetingByIdApi(temp).then(res=>{
      console.log(res)
      showToast(i18n.global.t('meeting.cancel.success'))

      getMyMeetings()

    })
    .catch((err) => {
      showToast(i18n.global.t('meeting.cancel.fail'))
    });
  })
  .catch((err) => {
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

      <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="getMyMeetings"
      >
        <div class="meetings">
          <ReservationCard
              v-for="item in totalList"
              :key="item.id"
              :begTime="item.start_time"
              :endTime="item.end_time"
              :desc="item.name"
              :type="item.status"
              @click="gotoEdit(item.status,item.id,item.room_id)"
          />
        </div>
      </van-list>



      <!--      <van-tabs v-model:active="active" color="#591BB7" v-if="loaded">-->
<!--        <van-tab v-for="(list,i) in reservationList" :title="$t(statusMapping[i])">-->
<!--          <div class="meetings">-->

<!--            <div v-if="reservationList[i].length==0">{{$t("meeting.notify.none")}}</div>-->
<!--&lt;!&ndash;            注意主键&ndash;&gt;-->

<!--            <van-swipe-cell-->
<!--                v-if="i!==2"-->
<!--                v-for="item in list"-->
<!--                :key="item.id">-->
<!--                <ReservationCard-->
<!--                    :begTime="item.start_time"-->
<!--                    :endTime="item.end_time"-->
<!--                    :desc="item.name"-->
<!--                    :type="i"-->
<!--                    @click="gotoEdit(item.id,item.room_id)"-->
<!--                />-->
<!--                <template #right>-->
<!--                  <div class="btns">-->
<!--                    <van-button square :text="$t('button.cancel')" class="cancel-button" @click="cancelMeeting(item.id)" />-->
<!--                    <van-button square :text="$t('button.edit')" class="change-button" @click="gotoEdit(item.id,item.room_id)"/>-->
<!--                  </div>-->
<!--                </template>-->
<!--            </van-swipe-cell>-->
<!--            <ReservationCard-->
<!--                v-if="i==2"-->
<!--                v-for="item in list"-->
<!--                :key="item.id"-->
<!--                :begTime="item.start_time"-->
<!--                :endTime="item.end_time"-->
<!--                :desc="item.name"-->
<!--                :type="i"-->
<!--            />-->

<!--          </div>-->
<!--        </van-tab>-->
<!--      </van-tabs>-->

    </template>
  </Layout>

</template>

<style scoped lang="scss">

.meetings{
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1.5rem;
}



.btns{
  display: flex;
  flex-direction: row;
  height: 100%;

  .cancel-button{
    height: 100%;
    background-color: var(--color-danger);
    color: #fff;
    border: 0;
  }

  .change-button{
    height: 100%;
    background-color: var(--color-primary);
    color: #fff;
    border: 0;
  }
}


</style>