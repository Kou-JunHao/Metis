<script setup>
const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    required: false,
    default: ''
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  format: {
    type: Function,
    default: (val) => val
  }
})

const emit = defineEmits(['update:modelValue'])

const updateValue = (e) => {
  emit('update:modelValue', Number(e.target.value))
}
</script>

<template>
  <div class="premium-range">
    <div class="range-header">
      <label v-if="label">{{ label }}</label>
      <output>{{ format(modelValue) }}</output>
    </div>
    <div class="range-container">
      <div class="range-track" :style="{ width: ((modelValue - min) / (max - min)) * 100 + '%' }"></div>
      <input type="range" :min="min" :max="max" :value="modelValue" @input="updateValue">
    </div>
  </div>
</template>

<style scoped>
.premium-range {
  margin-top: 1rem;
}

.range-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.range-header label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.range-header output {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.range-container {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}

/* Base visually hidden track */
.range-container::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 6px;
  background: var(--surface-soft);
  border-radius: 3px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Active filled track */
.range-track {
  position: absolute;
  height: 6px;
  background: var(--bg-color, var(--text-primary));
  border-radius: 3px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  background: transparent;
  outline: none;
  margin: 0;
  padding: 0;
  height: 100%;
  position: relative;
  z-index: 2;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bg-color, var(--text-primary));
  cursor: pointer;
  box-shadow: 0 2px 6px var(--shadow-color, rgba(0,0,0,0.3));
  transition: transform 0.1s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 50%;
  background: var(--bg-color, var(--text-primary));
  cursor: pointer;
  box-shadow: 0 2px 6px var(--shadow-color, rgba(0,0,0,0.3));
  transition: transform 0.1s ease;
}

input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.2);
}
</style>
