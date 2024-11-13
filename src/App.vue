<script setup>
/**
 * 防止左滑返回
 * */

import {computed, ref} from 'vue'

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
}, false);


/*适配深色模式*/

const theme = computed(()=>{
  const mode = getComputedStyle(document.documentElement).getPropertyValue('content');
  document.documentElement.setAttribute('data-theme', mode)

  if(mode.indexOf('dark') !== -1) return "dark"
  return "light"

})


</script>

<template>
  <van-config-provider :theme="theme" theme-vars-scope="global">
    <RouterView />
  </van-config-provider>

</template>

<style lang="scss">
html {
  touch-action: none;
  touch-action: pan-y;
}

/*适配深色模式*/
html {
  content: ""; /* (ab)using the content property */
}

/* Light mode */
@media (prefers-color-scheme: light) {
  html {
    content: "light"; /* (ab)using the content property */
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  html {
    content: "dark"; /* (ab)using the content property */
  }
}


</style>
