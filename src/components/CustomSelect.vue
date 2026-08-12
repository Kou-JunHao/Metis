<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import gsap from 'gsap'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array, // Array of { label, value, icon? }
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectRef = ref(null)
const listRef = ref(null)

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue) || props.options[0]
})

const toggleOpen = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    gsap.fromTo(listRef.value, 
      { autoAlpha: 0, y: -10, scale: 0.95 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out", display: 'block' }
    )
  } else {
    gsap.to(listRef.value, {
      autoAlpha: 0, y: -10, scale: 0.95, duration: 0.15, ease: "power2.in", display: 'none'
    })
  }
}

const selectOption = (val) => {
  emit('update:modelValue', val)
  toggleOpen()
}

const handleClickOutside = (e) => {
  if (isOpen.value && selectRef.value && !selectRef.value.contains(e.target)) {
    toggleOpen()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="custom-select-wrapper" ref="selectRef">
    <button class="custom-select-trigger" type="button" @click="toggleOpen" :aria-expanded="isOpen">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span v-if="selectedOption?.icon" v-html="selectedOption.icon" style="width: 16px; height: 16px;"></span>
        <span class="custom-select-value">{{ selectedOption?.label }}</span>
      </div>
      <svg class="custom-select-chevron" :class="{ open: isOpen }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    </button>
    <ul class="custom-select-options" ref="listRef" style="display: none;">
      <li v-for="opt in options" :key="opt.value" class="custom-select-option" :class="{ selected: opt.value === modelValue }" @click="selectOption(opt.value)">
        <span v-if="opt.icon" v-html="opt.icon" class="opt-icon"></span>
        <span>{{ opt.label }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.custom-select-options {
  position: absolute;
  z-index: 1000;
  width: 100%;
  top: calc(100% + 4px);
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--surface);
  -webkit-backdrop-filter: blur(25px);
  backdrop-filter: blur(25px);
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px var(--border), 0 10px 40px var(--shadow-color, rgba(0,0,0,0.2));
}

.custom-select-option {
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.2s ease;
}

.opt-icon {
  width: 16px;
  height: 16px;
}

.custom-select-option:hover {
  background: var(--surface-soft);
  color: var(--text-primary);
}
.custom-select-option.selected {
  background: var(--text-primary);
  color: var(--bg-color, #fff);
}
.custom-select-chevron {
  transition: transform 0.3s ease;
}
.custom-select-chevron.open {
  transform: rotate(180deg);
}

:deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
