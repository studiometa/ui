<script setup>
  const { type, text, vertical } = defineProps({
    type: {
      type: String,
      default: 'tip',
    },
    text: String,
    vertical: {
      type: String,
      default: 'middle',
    },
  });
</script>

<template>
  <span :class="type" class="badge" :style="{ verticalAlign: vertical }">
    <slot>{{ text }}</slot>
  </span>
</template>

<style scoped lang="scss">
  .badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: bold;
    line-height: 1;
    border-radius: 0.25em;
    padding: 0.5em 0.75em;
    color: #fff;
    background-color: var(--c-brand);
    white-space: nowrap;

    h1 > &,
    h2 > &,
    + .badge {
      margin-left: 0.5rem;
    }

    &.green {
      background-color: var(--c-brand);
    }

    &.error {
      background-color: #da5961;
    }

    &.warning,
    &.warn,
    &.yellow {
      background-color: #e7c000;
    }
  }
</style>
