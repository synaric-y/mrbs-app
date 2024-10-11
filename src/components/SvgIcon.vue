<template>
  <!--svg外层容器，需要配置子元素use使用-->
  <svg :style="{width, height}">
    <!--xlink:href引用的svg图标，#icon-图标名-->
    <use :xlink:href="symbolId" :fill="fill" />
  </svg>
</template>

<script setup>
import {computed} from "vue"
const props = defineProps({
  prefix: {
    type: String,
    default: 'icon'
  },
  name: {
    type: String,
    required: true
  },
  width: {
    type: String,
    default: "16px"
  },
  height: {
    type: String,
    default: "16px"
  },
  fill: {
    type: String,
    default: '#333'
  }
})
// svg icon引入的格式
const symbolId = computed(() => {
  return `#${props.prefix}-${props.name}`
})
</script>