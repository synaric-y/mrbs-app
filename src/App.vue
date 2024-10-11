<script setup>
/**
 * 防止左滑返回
 * */

var startX, startY;
document.addEventListener("touchstart", function (e) {

  startX = e.targetTouches[0].pageX;
  startY = e.targetTouches[0].pageY;
});

document.addEventListener("touchmove", function (e) {

  var moveX = e.targetTouches[0].pageX;
  var moveY = e.targetTouches[0].pageY;

  if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) {
    e.preventDefault();
  }
}, {
  passive: false
});

</script>

<template>
  <RouterView />
</template>

<style scoped>
html {
  touch-action: none;
  touch-action: pan-y;
}
</style>
