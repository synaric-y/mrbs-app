<script setup>
</script>

<template>
  <div class="container">


    <div class="header-wrapper">
      <slot name="header"></slot>
    </div>
    <div class="content-wrapper">
      <slot name="content"></slot>
    </div>


  </div>
</template>

<style scoped lang="scss">
html{
  font-size: 20px;
}

.container{
  padding: 0;
  margin: 0;
  width: 100%;
  background-color: var(--color-background-soft);
  box-sizing: border-box;

  .header-wrapper {
    padding: 1rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
	margin-bottom: 0.2rem;
  }

  .content-wrapper {
    // padding: 1rem 2rem 1rem 1.5rem;
    background-color: var(--van-tabs-nav-background);
    box-sizing: border-box;
    min-height: 100vh;
	width: 100%;
  }
}
</style>