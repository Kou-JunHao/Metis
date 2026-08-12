<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // The element to attach the click outside listener to
})

const emit = defineEmits(['edit', 'delete'])

const isVisible = ref(false)
const position = ref({ x: 0, y: 0 })
const contextData = ref(null)

const open = (e, data) => {
  e.preventDefault()
  
  // Calculate position (with bounds checking)
  let x = e.clientX
  let y = e.clientY
  
  // Basic bounds checking (assuming standard menu size)
  const menuWidth = 150
  const menuHeight = 100
  if (x + menuWidth > window.innerWidth) x -= menuWidth
  if (y + menuHeight > window.innerHeight) y -= menuHeight
  
  position.value = { x, y }
  contextData.value = data
  isVisible.value = true
}

const close = () => {
  if (isVisible.value) {
    isVisible.value = false
    contextData.value = null
  }
}

const handleEdit = () => {
  emit('edit', contextData.value)
  close()
}

const handleDelete = () => {
  emit('delete', contextData.value)
  close()
}

const handleClickOutside = (e) => {
  if (isVisible.value) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('contextmenu', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleClickOutside)
})

defineExpose({ open, close })
</script>

<template>
  <Teleport to="body">
    <div v-show="isVisible" class="context-menu" role="menu" :style="{ left: position.x + 'px', top: position.y + 'px', display: isVisible ? 'block' : 'none' }" @click.stop>
      <button class="context-menu-item" type="button" role="menuitem" @click="handleEdit">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        {{ $t('quickLinks.edit') }}
      </button>
      <button class="context-menu-item danger" type="button" role="menuitem" @click="handleDelete">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        {{ $t('quickLinks.delete') }}
      </button>
    </div>
  </Teleport>
</template>
