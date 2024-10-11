import {createMemoryHistory, createRouter, createWebHashHistory, createWebHistory} from 'vue-router'

import MeetingRoomIndex from '@/views/MeetingRoomIndex.vue'
import MyReservation from "@/views/MyReservation.vue";
import MeetingRoomDetail from "@/views/MeetingRoomDetail.vue";
import Login from "@/views/Login.vue";
import Callback from "@/views/Callback.vue";

const routes = [
    { path: '/', component: Login },
    { path: '/cb', component: Callback },
    { path: '/room', component: MeetingRoomIndex },
    { path: '/detail', component: MeetingRoomDetail },
    { path: '/my', component: MyReservation }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router