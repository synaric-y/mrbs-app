import {createMemoryHistory, createRouter, createWebHashHistory, createWebHistory} from 'vue-router'

import index from '../pages/index/index.vue'
import my from "../pages/my/my.vue";
import detail from "../pages/detail/detail.vue";
import login from "../pages/login/login.vue";
import cb from "../pages/cb/cb.vue";

const routes = [
    { path: '/', component: login },
    { path: '/cb', component: cb },
    { path: '/room', component: index },
    { path: '/detail', component: detail },
    { path: '/my', component: my }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router