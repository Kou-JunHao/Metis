<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { userSettings, getEngineDictionary, DEFAULT_ENGINES, DEFAULT_SETTINGS, searchActions } from '../store/index.js'
import Sortable from 'sortablejs'
import HeroClock from './HeroClock.vue'
import CustomSelect from './CustomSelect.vue'
import CustomToggle from './CustomToggle.vue'
import CustomRange from './CustomRange.vue'
import MetisLogo from './MetisLogo.vue'

const dialogRef = ref(null)
const activeTab = ref('appearance')
const showLicenses = ref(false)

const activeEnginesRef = ref(null)
const availableEnginesRef = ref(null)
const importFileInput = ref(null)

const newEngineName = ref('')
const newEngineUrl = ref('')
const engineError = ref('')

const availableEngines = computed(() => {
  const dict = getEngineDictionary()
  const allInactive = Object.values(dict).filter(e => !userSettings.activeEngineIds.includes(e.id))
  
  if (userSettings.inactiveEngineOrder && userSettings.inactiveEngineOrder.length) {
    const orderMap = new Map()
    userSettings.inactiveEngineOrder.forEach((id, index) => {
      orderMap.set(id, index)
    })
    
    return allInactive.sort((a, b) => {
      const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : 999
      const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : 999
      return indexA - indexB
    })
  }
  
  return allInactive
})

const { t } = useI18n()

const themeOptions = computed(() => [
  { label: t('settings.options.theme.auto'), value: 'auto' },
  { label: t('settings.options.theme.light'), value: 'light' },
  { label: t('settings.options.theme.dark'), value: 'dark' }
])

const bgOptions = computed(() => [
  { label: t('settings.options.bg.bing'), value: 'bing' },
  { label: t('settings.options.bg.wikimedia'), value: 'wikimedia' },
  { label: t('settings.options.bg.picsum'), value: 'picsum' },
  { label: t('settings.options.bg.custom'), value: 'custom' },
  { label: t('settings.options.bg.local'), value: 'local' }
])

const clockStyleOptions = computed(() => [
  { label: t('settings.options.clockStyle.default'), value: 'default' },
  { label: t('settings.options.clockStyle.minimal'), value: 'minimal' },
  { label: t('settings.options.clockStyle.editorial'), value: 'editorial' },
  { label: t('settings.options.clockStyle.mono'), value: 'mono' },
  { label: t('settings.options.clockStyle.neon'), value: 'neon' },
  { label: t('settings.options.clockStyle.outline'), value: 'outline' },
  { label: t('settings.options.clockStyle.chroma'), value: 'chroma' },
  { label: t('settings.options.clockStyle.glitch'), value: 'glitch' },
  { label: t('settings.options.clockStyle.gradient-gold'), value: 'gradient-gold' },
  { label: t('settings.options.clockStyle.gradient-aurora'), value: 'gradient-aurora' }
])


const defaultEngineOptions = computed(() => {
  return userSettings.activeEngineIds.map(id => {
    const engine = getEngineDictionary()[id]
    return { label: engine?.name, value: id, icon: engine?.icon }
  })
})

const openDialog = () => {
  dialogRef.value?.showModal()
  nextTick(() => {
    initSortables()
  })
}

const closeDialog = () => {
  dialogRef.value?.close()
}

const switchTab = (tab) => {
  activeTab.value = tab
  showLicenses.value = false
  if (tab === 'engines') {
    nextTick(() => initSortables())
  }
}

const initSortables = () => {
  const scrollEl = document.querySelector('.panels-container');
  const sortableOptions = {
    group: 'engines',
    animation: 150,
    handle: '.engine-drag-handle',
    scroll: scrollEl,
    scrollSensitivity: 100,
    scrollSpeed: 20,
    forceFallback: true,
    fallbackClass: 'sortable-fallback',
    onEnd: handleEngineSort
  };

  if (activeEnginesRef.value && !activeEnginesRef.value.sortable) {
    activeEnginesRef.value.sortable = Sortable.create(activeEnginesRef.value, sortableOptions)
  }
  if (availableEnginesRef.value && !availableEnginesRef.value.sortable) {
    availableEnginesRef.value.sortable = Sortable.create(availableEnginesRef.value, sortableOptions)
  }
}

const handleEngineSort = (evt) => {
  const itemEl = evt.item;
  const fromEl = evt.from;
  const toEl = evt.to;
  
  // Revert DOM change so Vue can take over smoothly without VDOM mismatch.
  // 1. Remove item from its new position (it's currently inside toEl)
  toEl.removeChild(itemEl);
  
  // 2. Put it back in its original position in fromEl
  if (evt.oldIndex === fromEl.children.length) {
    fromEl.appendChild(itemEl);
  } else {
    fromEl.insertBefore(itemEl, fromEl.children[evt.oldIndex]);
  }

  // Calculate new state
  const id = itemEl.dataset.id;
  const activeIds = [...userSettings.activeEngineIds];
  const inactiveIds = availableEngines.value.map(e => e.id);

  if (fromEl === toEl) {
    // Reorder within the same list
    if (fromEl === activeEnginesRef.value) {
      activeIds.splice(evt.oldIndex, 1);
      activeIds.splice(evt.newIndex, 0, id);
      searchActions.updateActiveEngines(activeIds);
    } else if (fromEl === availableEnginesRef.value) {
      inactiveIds.splice(evt.oldIndex, 1);
      inactiveIds.splice(evt.newIndex, 0, id);
      searchActions.updateInactiveOrder(inactiveIds);
    }
  } else {
    // Moving between lists
    if (toEl === activeEnginesRef.value && fromEl === availableEnginesRef.value) {
      inactiveIds.splice(evt.oldIndex, 1);
      activeIds.splice(evt.newIndex, 0, id);
      searchActions.updateActiveEngines(activeIds);
      searchActions.updateInactiveOrder(inactiveIds);
    } else if (toEl === availableEnginesRef.value && fromEl === activeEnginesRef.value) {
      activeIds.splice(evt.oldIndex, 1);
      inactiveIds.splice(evt.newIndex, 0, id);
      if (activeIds.length > 0) {
        searchActions.updateActiveEngines(activeIds);
        searchActions.updateInactiveOrder(inactiveIds);
      }
    }
  }
}

const addCustomEngine = () => {
  if (!newEngineName.value.trim() || !newEngineUrl.value.trim()) {
    engineError.value = '请填写完整的引擎信息'
    return
  }
  if (!newEngineUrl.value.includes('%s')) {
    engineError.value = 'URL 必须包含 %s 占位符'
    return
  }
  engineError.value = ''
  searchActions.addCustomEngine(newEngineName.value.trim(), newEngineUrl.value.trim())
  newEngineName.value = ''
  newEngineUrl.value = ''
}

const exportSettings = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userSettings, null, 2))
  const downloadAnchorNode = document.createElement('a')
  downloadAnchorNode.setAttribute("href", dataStr)
  downloadAnchorNode.setAttribute("download", "metis-settings-backup.json")
  document.body.appendChild(downloadAnchorNode)
  downloadAnchorNode.click()
  downloadAnchorNode.remove()
}

const importSettings = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result)
      if (parsed.schemaVersion === DEFAULT_SETTINGS.schemaVersion) {
        Object.assign(userSettings, parsed)
      } else {
        alert('配置文件版本不匹配！')
      }
    } catch (err) {
      alert('解析文件失败！')
    }
  }
  reader.readAsText(file)
  event.target.value = null
}

const resetSettings = () => {
  if (confirm('确定要恢复默认设置吗？这会清除所有的待办事项和快捷链接！')) {
    Object.assign(userSettings, DEFAULT_SETTINGS)
  }
}

import { saveWallpaperToDB } from '../utils/db.js'

const wallpaperFileInput = ref(null)

const handleWallpaperUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      await saveWallpaperToDB('local_wallpaper', { url: e.target.result })
      userSettings.bgSource = 'local'
    } catch (err) {
      alert('保存本地壁纸失败！')
    }
  }
  reader.readAsDataURL(file)
  event.target.value = null
}

defineExpose({
  openDialog,
  closeDialog
})
</script>



<template>
  <dialog id="settings-modal" class="premium-modal" ref="dialogRef" :aria-labelledby="$t('settings.title')">
    <div class="premium-modal-layout">
      <!-- Close Button (Absolute Top Right) -->
      <button id="settings-close" @click="closeDialog" class="close-button" type="button" :aria-label="$t('settings.close')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
      </button>

      <!-- Sidebar Navigation -->
      <aside class="premium-sidebar">
        <header class="sidebar-header">
          <p class="section-kicker">METIS</p>
          <h2>{{ $t('settings.title') }}</h2>
        </header>
        <nav role="tablist" aria-label="设置分类">
          <button class="nav-pill" :class="{ active: activeTab === 'appearance' }" type="button" role="tab" @click="switchTab('appearance')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>外观设计
          </button>
          <button class="nav-pill" :class="{ active: activeTab === 'clock' }" type="button" role="tab" @click="switchTab('clock')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>时钟组件
          </button>
          <button class="nav-pill" :class="{ active: activeTab === 'widgets' }" type="button" role="tab" @click="switchTab('widgets')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>桌面组件
          </button>
          <button class="nav-pill" :class="{ active: activeTab === 'engines' }" type="button" role="tab" @click="switchTab('engines')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>搜索引擎
          </button>
          <button class="nav-pill" :class="{ active: activeTab === 'data' }" type="button" role="tab" @click="switchTab('data')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>{{ $t('settings.data') }}
          </button>
          <button class="nav-pill" :class="{ active: activeTab === 'about' }" type="button" role="tab" @click="switchTab('about')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>{{ $t('settings.about') }}
          </button>
        </nav>
      </aside>

      <!-- Main Panels -->
      <main class="premium-panels">
        <div class="panels-container">
          <!-- Appearance Panel -->
          <section class="panel-content" v-show="activeTab === 'appearance'">
            <h3 class="panel-title">主题模式</h3>
            <div class="setting-group">
              <CustomSelect v-model="userSettings.theme" :options="themeOptions" />
            </div>

            <h3 class="panel-title" style="margin-top:2.5rem;">背景壁纸</h3>
            <div class="setting-group">
              <label class="setting-label">图源设置</label>
              <CustomSelect v-model="userSettings.bgSource" :options="bgOptions" />
              
              <div class="conditional-field" v-show="userSettings.bgSource === 'custom'" style="margin-top:1rem;">
                <input type="url" class="premium-input" placeholder="输入自定义图片 URL" v-model="userSettings.bgCustomUrl" autocomplete="url">
              </div>

              <div class="conditional-field" v-show="userSettings.bgSource === 'local'" style="margin-top:1rem;">
                <button class="secondary-button" style="width: 100%" type="button" @click="wallpaperFileInput.click()">选择本地图片...</button>
                <input type="file" accept="image/*" hidden ref="wallpaperFileInput" @change="handleWallpaperUpload">
              </div>
            </div>

            <h3 class="panel-title" style="margin-top:2.5rem;">视觉滤镜</h3>
            <div class="setting-group">
              <label class="setting-label">遮罩不透明度</label>
              <CustomRange v-model="userSettings.overlayStrength" :min="0" :max="75" :format="v => v + '%'" style="margin-bottom:1.5rem;" />
              
              <label class="setting-label">背景模糊强度</label>
              <CustomRange v-model="userSettings.blurStrength" :min="0" :max="20" :format="v => v + 'px'" />
            </div>
          </section>

          <!-- Clock Panel -->
          <section class="panel-content" v-show="activeTab === 'clock'">
            <h3 class="panel-title">外观设置</h3>
            <div class="setting-group">
              <div class="clock-preview-box" :class="[`clock-style-${userSettings.clockStyle}`]">
                <HeroClock />
              </div>
              
              <label class="setting-label">时钟字形</label>
              <CustomSelect v-model="userSettings.clockStyle" :options="clockStyleOptions" style="margin-bottom: 1.25rem;" />

              <label class="setting-label">时钟缩放比例</label>
              <CustomRange v-model="userSettings.clockSize" :min="50" :max="150" :format="v => v + '%'" style="margin-bottom: 1.5rem;" />
              
              <label class="setting-label">整体垂直位置偏移</label>
              <CustomRange v-model="userSettings.clockPosition" :min="-20" :max="20" :format="v => v + '%'" />
            </div>

            <h3 class="panel-title" style="margin-top:3rem;">时间格式</h3>
            <div class="setting-group">
              <CustomToggle v-model="userSettings.showDate" label="显示今日日期" style="margin-bottom: 1rem;" />
              <CustomToggle v-model="userSettings.showSeconds" label="显示秒数跳动" style="margin-bottom: 1rem;" />
              <CustomToggle v-model="userSettings.clock24h" label="开启 24 小时制" />
            </div>
          </section>

          <!-- Widgets Panel -->
          <section class="panel-content" v-show="activeTab === 'widgets'">
            <h3 class="panel-title">功能开关</h3>
            <div class="setting-group">
              <CustomToggle v-model="userSettings.showQuickLinks" label="显示首页快捷链接栏" />
            </div>
          </section>

          <!-- Engines Panel -->
          <section class="panel-content" v-show="activeTab === 'engines'">
            <h3 class="panel-title">主搜引擎</h3>
            <div class="setting-group">
              <CustomSelect v-model="userSettings.defaultEngineId" :options="defaultEngineOptions" style="margin-bottom: 2rem;" />
            </div>

            <h3 class="panel-title">活跃引擎 (支持拖拽排序)</h3>
            <div class="setting-group">
              <ul class="engine-list" ref="activeEnginesRef">
                <li v-for="engineId in userSettings.activeEngineIds" :key="engineId" :data-id="engineId">
                  <div class="engine-item">
                    <span class="engine-drag-handle"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line></svg></span>
                    <span class="engine-icon" v-html="getEngineDictionary()[engineId]?.icon"></span>
                    <span class="engine-name">{{ getEngineDictionary()[engineId]?.name }}</span>
                    <button v-if="engineId.startsWith('custom-')" class="engine-action-btn" type="button" @click="searchActions.deleteCustomEngine(engineId)">删除</button>
                  </div>
                </li>
              </ul>
            </div>

            <h3 class="panel-title" style="margin-top:2rem;">全部引擎</h3>
            <div class="setting-group">
              <ul class="engine-list" ref="availableEnginesRef">
                <li v-for="engine in availableEngines" :key="engine.id" :data-id="engine.id">
                  <div class="engine-item">
                    <span class="engine-drag-handle"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line></svg></span>
                    <span class="engine-icon" v-html="engine.icon"></span>
                    <span class="engine-name">{{ engine.name }}</span>
                  </div>
                </li>
              </ul>
            </div>

            <h3 class="panel-title" style="margin-top:2rem;">新增自定义</h3>
            <form class="setting-group" @submit.prevent="addCustomEngine">
              <input type="text" class="premium-input" placeholder="搜索引擎名称" maxlength="40" autocomplete="off" v-model="newEngineName" style="margin-bottom:0.75rem;">
              <input type="url" class="premium-input" placeholder="搜索 URL (必须包含 %s 占位符)" autocomplete="off" v-model="newEngineUrl" style="margin-bottom:1rem;">
              <button class="primary-button" type="submit" style="width:100%;">确认添加</button>
              <p class="field-error" role="alert" v-if="engineError">{{ engineError }}</p>
            </form>
          </section>

          <!-- Data Panel -->
          <section class="panel-content" v-show="activeTab === 'data'">
            <h3 class="panel-title">迁移与恢复</h3>
            <div class="setting-group">
              <div class="data-actions">
                <button class="secondary-button" type="button" @click="exportSettings">导出当前配置 (.json)</button>
                <button class="secondary-button" type="button" @click="importFileInput.click()">导入现有配置</button>
                <input type="file" accept="application/json,.json" hidden ref="importFileInput" @change="importSettings">
              </div>
            </div>

            <h3 class="panel-title danger-title" style="margin-top:3rem;">{{ $t('settings.dangerZone') }}</h3>
            <div class="setting-group danger-zone">
              <button class="danger-button" style="width: 100%" type="button" @click="resetSettings">{{ $t('settings.reset') }}</button>
            </div>
          </section>

          <!-- About Panel -->
          <section class="panel-content" v-show="activeTab === 'about'">
            <template v-if="!showLicenses">
              <div class="about-header" style="border-bottom: none; padding-bottom: 1rem;">
                <MetisLogo class="about-logo-img" />
                <p class="about-version">Version 1.0.0</p>
                <p class="about-desc">{{ $t('settings.aboutDesc') }}</p>
              </div>

              <div class="setting-group" style="margin-top: 1.5rem;">
                <button class="nav-pill" style="justify-content: space-between;" @click="showLicenses = true">
                  <span>{{ $t('settings.ossLicenses') }}</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0;"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </template>

            <template v-else>
              <button class="nav-pill" style="margin-bottom: 1.5rem; width: auto; display: inline-flex;" @click="showLicenses = false">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:0.5rem"><polyline points="15 18 9 12 15 6"></polyline></svg>
                返回关于
              </button>

              <h3 class="panel-title">{{ $t('settings.ossLicenses') }}</h3>
              <div class="setting-group oss-licenses">
                <div class="license-item">
                  <h4>Vue.js</h4>
                  <p>MIT License - Copyright (c) 2013-present, Yuxi (Evan) You</p>
                </div>
                <div class="license-item">
                  <h4>GSAP</h4>
                  <p>Standard "No Charge" License - Copyright (c) 2008-present, GreenSock.</p>
                </div>
                <div class="license-item">
                  <h4>SortableJS</h4>
                  <p>MIT License - Copyright (c) 2013-present, Lebedev Konstantin.</p>
                </div>
                <div class="license-item">
                  <h4>Vite</h4>
                  <p>MIT License - Copyright (c) 2019-present, Evan You and Vite contributors.</p>
                </div>
                <div class="license-item">
                  <h4>Vue I18n</h4>
                  <p>MIT License - Copyright (c) 2016-present, Kazuya Kawaguchi.</p>
                </div>
              </div>
            </template>
          </section>

        </div>
      </main>
    </div>
  </dialog>
</template>

<style>
/* --- Premium Modal Base --- */
.premium-modal {
  width: 90vw;
  max-width: 960px;
  height: 80vh;
  max-height: 720px;
  margin: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  overflow: hidden;
  background: var(--modal-bg);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  backdrop-filter: blur(40px) saturate(180%);
  padding: 0;
  
  /* Animations */
  opacity: 0;
  transform: scale(0.96);
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.premium-modal[open] {
  opacity: 1;
  transform: scale(1);
}

.premium-modal::backdrop {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  transition: opacity 0.3s ease;
}

[data-theme="light"] .premium-modal {
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.7);
}

/* --- Layout --- */
.premium-modal-layout {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
}

/* --- Sidebar --- */
.premium-sidebar {
  width: 260px;
  flex: 0 0 260px;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  background: rgba(0, 0, 0, 0.02);
  /* NO right border for borderless design! */
}

[data-theme="dark"] .premium-sidebar {
  background: rgba(255, 255, 255, 0.02);
}

.sidebar-header {
  margin-bottom: 2rem;
  padding-left: 0.5rem;
}

.sidebar-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.section-kicker {
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  margin-bottom: 0.25rem;
}

/* Nav Pills */
.nav-pill {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.85rem 1rem;
  margin-bottom: 0.25rem;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-pill svg {
  margin-right: 0.75rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.nav-pill:hover {
  background: var(--surface-soft);
  color: var(--text-primary);
}

.nav-pill.active {
  background: var(--text-primary);
  color: var(--bg-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-pill.active svg {
  opacity: 1;
}

[data-theme="dark"] .nav-pill.active {
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

/* --- Main Panels --- */
.premium-panels {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.close-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.close-button:hover {
  background: var(--surface);
  color: var(--text-primary);
  transform: rotate(90deg);
}

.panels-container {
  flex: 1;
  overflow-y: auto;
  padding: 2.5rem 3.5rem 4rem;
}

/* Premium Scrollbar */
.panels-container::-webkit-scrollbar {
  width: 8px;
}
.panels-container::-webkit-scrollbar-track {
  background: transparent;
}
.panels-container::-webkit-scrollbar-thumb {
  background-color: var(--surface);
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.panels-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-secondary);
}

/* --- Panel Content --- */
.panel-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  letter-spacing: -0.01em;
}

.danger-title {
  color: #ff4757;
}

/* Shared Controls */
.setting-group {
  display: flex;
  flex-direction: column;
}

.setting-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clock-preview-box {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  padding: 1.75rem 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 110px;
}

[data-theme="light"] .clock-preview-box {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.clock-preview-box .time-block {
  transform: none;
  margin-bottom: 0;
}

.engine-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.engine-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--surface-soft);
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.engine-item:hover {
  background: var(--surface);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme="light"] .engine-item:hover {
  border-color: rgba(0, 0, 0, 0.08);
}

.sortable-fallback {
  opacity: 0.9 !important;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3) !important;
  background: var(--surface) !important;
  cursor: grabbing !important;
  transform: scale(1.02);
  z-index: 1000;
}

[data-theme="light"] .sortable-fallback {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1) !important;
}

.engine-drag-handle {
  cursor: grab;
  color: var(--text-tertiary);
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
}

.engine-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--surface-soft);
}

.engine-icon img, .engine-icon svg {
  width: 16px;
  height: 16px;
  object-fit: contain;
  -webkit-user-drag: none;
  user-drag: none;
}

.engine-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.engine-action-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.engine-action-btn:hover {
  color: #fff;
  background: #ff4757;
}

.data-actions {
  display: flex;
  gap: 1rem;
}
.data-actions button {
  flex: 1;
}

/* --- About Panel --- */
.about-header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.about-logo-img {
  width: 240px;
  height: auto;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.about-version {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 1rem;
}

.about-desc {
  color: var(--text-secondary);
  font-size: 1rem;
}

.oss-licenses {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.license-item {
  background: var(--surface-soft);
  padding: 1rem 1.2rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.license-item:hover {
  background: var(--surface);
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.license-item h4 {
  margin: 0 0 0.4rem 0;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.license-item p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Responsive tweaks for smaller screens */
@media (max-width: 768px) {
  .premium-modal-layout {
    flex-direction: column;
  }
  .premium-sidebar {
    width: 100%;
    flex: 0 0 auto;
    padding: 1.5rem 1.5rem 0.5rem;
    border-right: none;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .premium-sidebar nav {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
    scrollbar-width: none; /* Firefox */
  }
  .premium-sidebar nav::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
  .nav-pill {
    width: auto;
    white-space: nowrap;
    padding: 0.6rem 1rem;
    margin-bottom: 0;
  }
  .panels-container {
    padding: 1rem 1.5rem 2.5rem;
  }
  .clock-preview-box .hero-heading {
    font-size: 2rem !important;
  }
}

@media (max-width: 480px) {
  .premium-modal {
    width: 95vw;
    height: 90vh;
  }
  .premium-sidebar {
    padding: 1rem 1rem 0.5rem;
  }
  .panels-container {
    padding: 0.5rem 1rem 2.5rem;
  }
  .data-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
