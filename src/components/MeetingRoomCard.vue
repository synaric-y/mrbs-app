<script setup>
import {onMounted, ref, computed} from "vue";
import InfoHeader from "@/components/InfoHeader.vue";
import TimeLineScroll from "@/components/TimeLineScroll.vue";

const props = defineProps(['title', 'disabled', 'position', 'capacity', 'facilities', 'timeTable', 'startTime', 'endTime', 'currentDate'])

const full = ref(false)

const calcTagClass = computed(() => {
  return 'tag ' + (full.value ? 'tag-full' : (props.disabled ? 'tag-disabled' : 'tag-available'))
})
const calcTagText = computed(() => {
  return 'room.status.' + (full.value ? 'full' : (props.disabled ? 'disabled' : 'available'))
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
  background-color: var(--color-selected);
}

.tag-disabled {
  background-color: var(--color-danger);
}

.tag-full {
  background-color: var(--color-full);
}
</style>