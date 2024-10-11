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

*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container{
  padding: 0;
  margin: 0;
  width: 100%;
  background-color: var(--color-background);
  box-sizing: border-box;

  .header-wrapper {
    padding: 1rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .content-wrapper {
    padding: 1rem 2rem 1rem 1.5rem;
    background-color: var(--color-background-content);
    box-sizing: border-box;
    min-height: 100vh;
  }
}
</style>