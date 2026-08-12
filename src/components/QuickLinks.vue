<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { userSettings, quickLinksActions } from '../store/index.js'
import Sortable from 'sortablejs'
import ContextMenu from './ContextMenu.vue'
import LinkDialog from './LinkDialog.vue'

const trackRef = ref(null)
const contextMenuRef = ref(null)
const linkDialogRef = ref(null)

const getHostname = (urlStr) => {
  try {
    return new URL(urlStr).hostname
  } catch (e) {
    return ''
  }
}

const openContextMenu = (e, link) => {
  contextMenuRef.value?.open(e, link)
}

const handleEdit = (link) => {
  linkDialogRef.value?.openDialog(link)
}

const handleDelete = (link) => {
  quickLinksActions.deleteQuickLink(link.id)
}

const handleAdd = () => {
  linkDialogRef.value?.openDialog()
}

const handleSaveLink = (data) => {
  if (data.isEdit) {
    quickLinksActions.updateQuickLink(data.id, data.title, data.url)
  } else {
    quickLinksActions.addQuickLink(data.title, data.url)
  }
}

onMounted(() => {
  if (trackRef.value) {
    Sortable.create(trackRef.value, {
      animation: 150,
      delay: 200,
      delayOnTouchOnly: true,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      filter: '.add-link-wrapper',
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex !== newIndex && newIndex < userSettings.quickLinks.length) {
          // Revert DOM change to avoid Vue VDOM mismatch
          const itemEl = evt.item
          const parent = evt.from
          parent.removeChild(itemEl)
          if (oldIndex === parent.children.length) {
            parent.appendChild(itemEl)
          } else {
            parent.insertBefore(itemEl, parent.children[oldIndex])
          }
          
          // Apply change to store
          const newLinks = [...userSettings.quickLinks]
          const [moved] = newLinks.splice(oldIndex, 1)
          newLinks.splice(newIndex, 0, moved)
          quickLinksActions.reorderQuickLinks(newLinks.map(l => l.id))
        }
      }
    })
  }
})
</script>

<template>
  <section id="quick-links-region" class="quick-links-container" :aria-labelledby="$t('quickLinks.title')">
    <h2 id="quick-links-title" class="sr-only">{{ $t('quickLinks.title') }}</h2>
    <div id="quick-links-track" class="quick-links-track" ref="trackRef">
      <!-- Existing Links -->
      <div v-for="link in userSettings.quickLinks" 
           :key="link.id" 
           class="quick-link-item" 
           :data-id="link.id">
        <a :href="link.url" class="quick-link-card" @contextmenu.stop.prevent="openContextMenu($event, link)" draggable="false">
          <span class="quick-link-icon-wrapper">
            <img :src="`https://icon.horse/icon/${getHostname(link.url)}`" alt="" loading="lazy" draggable="false" />
          </span>
          <span class="quick-link-title">{{ link.title }}</span>
        </a>
        <button class="quick-link-menu" type="button" :aria-label="$t('quickLinks.edit')" @click.stop.prevent="openContextMenu($event, link)">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
        </button>
      </div>

      <!-- Add Button -->
      <div class="quick-link-item add-link-wrapper">
        <button class="quick-link-add" type="button" :aria-label="$t('quickLinks.add')" @click="handleAdd">
          <span class="quick-link-icon-wrapper" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </span>
          <span class="quick-link-title">{{ $t('quickLinks.add') }}</span>
        </button>
      </div>
    </div>
  </section>

  <ContextMenu ref="contextMenuRef" @edit="handleEdit" @delete="handleDelete" />
  <LinkDialog ref="linkDialogRef" @save="handleSaveLink" />
</template>


<style>
.quick-links-track {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  gap: 1.5rem 1rem;
  justify-content: center;
  align-items: flex-start;
}

.quick-link-item {
  position: relative;
  display: flex;
  width: auto;
  min-width: 0;
  height: 100px;
  align-items: flex-start;
  justify-content: center;
}

.quick-link-card,
.quick-link-add {
  display: flex;
  width: 90px;
  height: 100px;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border: 0;
  background: transparent;
  color: var(--desktop-text);
  text-decoration: none;
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  -webkit-user-drag: none;
  user-drag: none;
}

.quick-link-card:hover,
.quick-link-add:hover {
  transform: translateY(-5px);
}

.quick-link-icon-wrapper {
  display: flex;
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.quick-link-card:hover .quick-link-icon-wrapper {
  background: var(--surface-strong);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
}

.quick-link-icon-wrapper img {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  object-fit: contain;
  -webkit-user-drag: none;
  user-drag: none;
}

.quick-link-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
  padding: 0 4px;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  text-overflow: ellipsis;
  text-shadow: none;
  white-space: normal;
  word-break: break-word;
  transition: color 0.3s ease;
}

.quick-link-add .quick-link-icon-wrapper {
  border: 1.5px dashed var(--border-strong);
  background: var(--surface-soft);
  color: var(--text-primary);
  opacity: 0.85;
  transition: color 0.3s ease, background 0.3s ease;
}

.quick-link-add:hover .quick-link-icon-wrapper {
  background: var(--surface-strong);
  color: var(--text-primary);
  opacity: 1;
  border-style: solid;
}

/* 动态反色规则：当遮罩强度 < 15% 时开启自动反色 */
html[data-overlay-active="false"][data-wallpaper-luminance="light"] .quick-link-title {
  color: #111827 !important;
}

html[data-overlay-active="false"][data-wallpaper-luminance="light"] .quick-link-add .quick-link-icon-wrapper {
  color: #111827 !important;
}

html[data-overlay-active="false"][data-wallpaper-luminance="dark"] .quick-link-title {
  color: #ffffff !important;
}

html[data-overlay-active="false"][data-wallpaper-luminance="dark"] .quick-link-add .quick-link-icon-wrapper {
  color: #ffffff !important;
}

.quick-link-item:hover .quick-link-menu,
.quick-link-item:focus-within .quick-link-menu {
  opacity: 0.72;
  pointer-events: auto;
  transform: none;
}

@media (max-width: 768px) {
  .quick-links-track {
    gap: 1rem 0.5rem;
    padding: 0 0.5rem;
  }
  
  .quick-link-item {
    height: 90px;
  }
  
  .quick-link-card,
  .quick-link-add {
    width: 70px;
    height: 90px;
    padding: 1rem 0.25rem;
  }
  
  .quick-link-icon-wrapper {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    border-radius: 14px;
  }
  
  .quick-link-icon-wrapper img {
    width: 26px;
    height: 26px;
  }
  
  .quick-link-title {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .quick-links-track {
    gap: 0.75rem 0.25rem;
  }
  
  .quick-link-item {
    height: 88px;
  }

  .quick-link-card,
  .quick-link-add {
    width: 66px;
    height: 88px;
    padding: 0.5rem 0.1rem;
    gap: 6px;
  }
  
  .quick-link-icon-wrapper {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    border-radius: 12px;
  }
  
  .quick-link-icon-wrapper img {
    width: 22px;
    height: 22px;
  }

  .quick-link-title {
    font-size: 0.75rem;
  }
}
</style>
