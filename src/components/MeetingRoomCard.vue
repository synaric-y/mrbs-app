<script setup>
import {onMounted, ref, computed} from "vue";
import InfoHeader from "@/components/InfoHeader.vue";
import TimeLineScroll from "@/components/TimeLineScroll.vue";
import dayjs from "dayjs";

const props = defineProps(['title', 'disabled', 'position', 'capacity', 'facilities', 'timeTable', 'startTime', 'endTime', 'currentDate'])

const full = ref(false)

const hr21 = dayjs().startOf('day').add(props.endTime, 'hours')
const hr6 = dayjs().startOf('day').add(props.startTime, 'hours')

const overdue = ref(dayjs().isAfter(hr21) || dayjs().isBefore(hr6))

const calcTagClass = computed(() => {

  if(overdue.value || full.value) return 'tag tag-full'

  if(props.disabled) return 'tag tag-disabled'

  return 'tag tag-available'

})
const calcTagText = computed(() => {

  if(overdue.value) return 'room.status.not_in_service'

  if(full.value) return 'room.status.full'

  if(props.disabled) return 'room.status.disabled'

  return 'room.status.available'
})

</script>

<template>
  <div>
    <InfoHeader :title="title" :position="position" :capacity="capacity" :facilities="facilities">
      <template #tag>
        <div :class="calcTagClass">{{ $t(calcTagText) }}</div>
      </template>
    </InfoHeader>

    <TimeLineScroll :lb="startTime"
                    :ub="endTime"
                    :meetings="timeTable"
                    :currentDate="currentDate"
                    :scale="15"
                    v-model:full="full"
                    @clicked="$emit('click', $event)"
    />
  </div>

</template>

<style scoped lang="scss">

html {
  font-size: 20px;
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