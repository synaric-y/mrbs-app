<script setup>
defineProps(['title','position','capacity','facilities'])
import SvgIcon from "@/components/SvgIcon.vue";
</script>

<template>
  <div class="info-header">
    <div class="header">
      <div class="title">{{title || $t('room.untitled')}}</div>
      <slot name="tag"></slot>
    </div>
    <div class="info-wrapper">
      <div class="position">
        <SvgIcon name="room" width="1rem" height="1rem"/>
        <div class="text">{{position}}</div>
      </div>
      <div class="capacity">
        <SvgIcon name="user" width="0.7rem" height="0.7rem" style="margin-right:0.2rem"/>
        <div class="text">{{capacity}}</div>
      </div>
      <div class="facility">
        {{facilities}}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.info-header{
  .header{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.8rem;
    padding-top: 1rem;

    .title{
      color: var(--color-heading);
      font-weight: 700;
      font-size: 1rem;
    }
  }

  .info-wrapper{
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 1.3rem;
    font-size: 0.8rem;
    margin-bottom: 1rem;

    .position,.capacity{
      display: flex;
      align-items: center;
      gap: 0.05rem;
    }
  }
}




</style>