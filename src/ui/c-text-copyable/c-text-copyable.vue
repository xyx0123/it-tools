<script setup lang="ts">
import { useCopy } from '@/composable/copy';

const props = withDefaults(defineProps<{ value?: string; displayedValue?: string; showIcon?: boolean }>(), { value: '', displayedValue: undefined, showIcon: true });
const { value, displayedValue, showIcon } = toRefs(props);

const { copy, isJustCopied } = useCopy({ source: value, createToast: false });
</script>

<template>
  <c-tooltip :tooltip="isJustCopied ? 'Copied!' : undefined" cursor-pointer @click="copy">
    <span flex items-center gap-2>
      {{ displayedValue ?? value }}
      <icon-mdi-content-copy v-if="showIcon" class="copy-icon" op-40 />
    </span>
  </c-tooltip>
</template>

<style scoped>
.copy-icon {
  flex-shrink: 0;
  width: 1em;
  height: 1em;
}
</style>
