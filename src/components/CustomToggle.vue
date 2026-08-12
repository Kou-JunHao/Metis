<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  label: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label class="premium-toggle-row" @click.prevent="toggle">
    <span class="toggle-label">{{ label }}</span>
    <div class="toggle-track" :class="{ active: modelValue }">
      <div class="toggle-thumb" :class="{ active: modelValue }"></div>
    </div>
  </label>
</template>

<style scoped>
.premium-toggle-row {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.92rem;
  cursor: pointer;
  padding: 8px 0;
}

.premium-toggle-row:hover .toggle-label {
  color: var(--text-primary);
}

.toggle-label {
  transition: color 0.3s ease;
}

.toggle-track {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--surface-soft);
  border: 1px solid var(--border-strong);
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-track.active {
  background: var(--color-primary, var(--text-primary));
  border-color: transparent;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bg-color, var(--text-primary));
  box-shadow: 0 2px 4px var(--shadow-color, rgba(0,0,0,0.3));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-track.active .toggle-thumb {
  transform: translateX(20px);
  background: var(--bg-color);
}
</style>
