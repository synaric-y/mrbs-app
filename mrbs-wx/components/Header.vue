<script setup>
defineProps(['title','isReturn'])
defineEmits(['return'])
</script>

<template>
  <div class="header">
    <div class="header-left">
      <uni-icons style="cursor: pointer;" v-if="isReturn" color="#666666" type="left" size="25" @click="$emit('return')"></uni-icons>
      <div class="title">{{title}}</div>
    </div>

    <slot name="header-right"></slot>
  </div>
</template>

<style scoped lang="scss">
html{
  font-size: 20px;
}
.header{
  display: flex;
  flex-direction: row;
  justify-content: space-between;


  .header-left{

    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;

    .title{
      line-height: 3;
      color: var(--color-heading);
      font-weight: 700;
      font-size: 1.1rem;
      padding-left: 0.2rem;
      box-sizing: border-box;
    }
  }


}
</style>