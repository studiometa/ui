<script setup>
  const { type, text, vertical } = defineProps({
    type: {
      type: String,
      default: 'tip',
    },
    text: String,
    vertical: {
      type: String,
      default: 'top',
    },
  });
</script>

<template>
  <span :class="type" class="badge" :style="{ verticalAlign: vertical }">
    <slot>{{ text }}</slot>
  </span>
</template>

<style scoped>
  .badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: bold;
    line-height: 1;
    border-radius: 0.25em;
    padding: 0.5em 0.75em;
    color: #fff;
    background-color: var(--vp-c-indigo-3);
    white-space: nowrap;
  }

  .badge.green {
    background-color: var(--vp-c-indigo-3);
  }

  .badge.error {
    background-color: #da5961;
  }

  .badge.warning,
  .badge.warn,
  .badge.yellow {
    background-color: #e7c000;
  }

  .badge + .badge {
    margin-left: 5px;
  }
</style>
