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
        <uni-icons color="#777777" type="location-filled" size="25"></uni-icons>
        <div class="text">{{position}}</div>
      </div>
      <div class="capacity">
		  <uni-icons color="#777777" type="staff-filled" size="25"></uni-icons>
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
    margin-bottom: 0.6rem;
    padding-top: 1rem;
	padding-left: 0.2rem;

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