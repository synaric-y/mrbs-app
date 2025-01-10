<script setup>
import {onMounted, ref, computed} from "vue";
import InfoHeader from "@/components/InfoHeader.vue";
import dayjs from "dayjs";
import TimeLineScrollTest from "./TimeLineScrollTest.vue";

const props = defineProps(['title', 'disabled', 'position', 'capacity', 'facilities', 'timeTable', 'startTime', 'endTime', 'currentDate','currentTime'])

console.log(props.timeTable)

const full = ref(false)

const hr21 = dayjs(props.currentDate).startOf('day').add(props.endTime, 'hours')
const hr6 = dayjs(props.currentDate).startOf('day').add(props.startTime, 'hours')

const overdue = ref(dayjs(props.currentDate).isSame(new dayjs(),'day') && (dayjs().isAfter(hr21) || dayjs().isBefore(hr6)))

const calcTagClass = computed(() => {

  if(props.disabled) return 'tag tag-disabled'

  if(overdue.value || full.value) return 'tag tag-full'

  return 'tag tag-available'

})
const calcTagText = computed(() => {

  if(props.disabled) return 'common.room.disabled'

  if(overdue.value) return 'common.room.not_in_service'

  if(full.value) return 'common.room.full'

  return 'common.room.available'
})


const dummy = (e)=>{
  e.preventDefault()
  e.stopPropagation()
}

</script>

<template>
  <div class="card">
    <InfoHeader :title="title" :position="position" :capacity="capacity" :facilities="facilities">
      <template #tag>
        <div :class="calcTagClass">{{ $t(calcTagText) }}</div>
      </template>
    </InfoHeader>

    <TimeLineScrollTest :lb="hr6.unix()"
                    :ub="hr21.unix()"
                    :meetings="timeTable"
                    :currentDate="currentDate"
                    :currentTime="currentTime"
                    :scale="15"
                    v-model:full="full"
                    @click="dummy($event)"
    />
  </div>

</template>

<style scoped lang="scss">

html {
  font-size: 20px;
}

.card{
	padding: 0 1rem;
}

.tag {
  font-size: 0.65rem;
  line-height: 2.8;
  width: 3.9rem;
  color: #fff;
  border-radius: 0.3rem;
  text-align: center;
}

.tag-available {
  background-color: var(--color-primary);
}

.tag-disabled {
  background-color: var(--color-danger);
}

.tag-full {
  background-color: var(--color-full);
}
</style>