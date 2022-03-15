<script lang="ts" setup>
  import { computed, useAttrs } from 'vue';

  const { modelValue, items, valueProp, labelProp } = defineProps<{
    modelValue: unknown;
    items: unknown[];
    valueProp?: string;
    labelProp?: string;
  }>();

  const emits = defineEmits(['update:modelValue']);

  function getValue(item, index) {
    return valueProp ? item[valueProp] : index;
  }
</script>

<template>
  <div class="relative bg-brand rounded text-white font-bold leading-none">
    <i-octicon-chevron-down-16 class="absolute m-2 right-0 block w-4 h-4" />
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="h-full py-0 pl-2 pr-6 bg-brand rounded font-medium text-white leading-none appearance-none"
    >
      <option
        v-for="(item, index) in items"
        :key="`item-${index}`"
        :value="getValue(item, index)"
        :selected="modelValue === getValue(item, index)"
      >
        <slot name="option" v-bind="{ item, index }">
          {{ item[labelProp] }}
        </slot>
      </option>
    </select>
  </div>
</template>
