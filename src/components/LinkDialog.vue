<script setup>
import { ref, reactive, computed } from 'vue'

const props = defineProps({
  // none needed
})

const emit = defineEmits(['save'])

const dialogRef = ref(null)
const isEditMode = ref(false)
const formData = reactive({
  id: null,
  title: '',
  url: ''
})

const openDialog = (linkData = null) => {
  if (linkData) {
    isEditMode.value = true
    formData.id = linkData.id
    formData.title = linkData.title
    formData.url = linkData.url
  } else {
    isEditMode.value = false
    formData.id = null
    formData.title = ''
    formData.url = ''
  }
  dialogRef.value?.showModal()
}

const closeDialog = () => {
  dialogRef.value?.close()
}

const handleSave = () => {
  if (formData.title && formData.url) {
    // Add protocol if missing
    let finalUrl = formData.url
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }
    
    emit('save', {
      id: formData.id,
      title: formData.title,
      url: finalUrl,
      isEdit: isEditMode.value
    })
    closeDialog()
  }
}

defineExpose({ openDialog, closeDialog })
</script>

<template>
  <dialog id="link-dialog" class="compact-dialog" ref="dialogRef" :aria-labelledby="isEditMode ? 'link-dialog-title-edit' : 'link-dialog-title-add'">
    <form class="dialog-content" @submit.prevent="handleSave">
      <header class="dialog-header">
        <h2 :id="isEditMode ? 'link-dialog-title-edit' : 'link-dialog-title-add'">
          {{ isEditMode ? $t('quickLinks.editTitle') : $t('quickLinks.addTitle') }}
        </h2>
        <button class="icon-button close-button" type="button" :aria-label="$t('quickLinks.cancel')" @click="closeDialog">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
        </button>
      </header>
      
      <div class="form-group">
        <label for="link-title-input">{{ $t('quickLinks.formName') }}</label>
        <input id="link-title-input" class="text-input" type="text" v-model="formData.title" required autofocus>
      </div>
      
      <div class="form-group">
        <label for="link-url-input">{{ $t('quickLinks.formUrl') }}</label>
        <input id="link-url-input" class="text-input" type="text" inputmode="url" v-model="formData.url" required>
      </div>
      
      <footer class="dialog-footer">
        <button class="primary-button" type="submit">{{ $t('quickLinks.save') }}</button>
      </footer>
    </form>
  </dialog>
</template>

<style>
.dialog-content {
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--surface-soft);
}

.dialog-header h2 {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.5rem 0;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.text-input {
  padding: 0.8rem 1rem;
  border: none;
  border-radius: 8px;
  background: var(--surface-soft);
  color: var(--text-primary);
  font-size: 1rem;
  outline: none;
  box-shadow: inset 0 0 0 1px var(--border);
  transition: all 0.2s ease;
}

.text-input:focus {
  background: var(--surface);
  box-shadow: inset 0 0 0 1.5px var(--text-muted);
}

.dialog-footer {
  padding: 1.5rem;
  display: flex;
  justify-content: flex-end;
}
.dialog-footer .primary-button {
  width: 100%;
}
</style>
