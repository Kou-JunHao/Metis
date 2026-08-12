<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { userSettings, DEFAULT_ENGINES, getEngineDictionary } from './store/index.js'
import HeroClock from './components/HeroClock.vue'
import SearchBar from './components/SearchBar.vue'
import QuickLinks from './components/QuickLinks.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import gsap from 'gsap'
import { resolveWallpaper, preloadImage } from './utils/wallpaper.js'

const settingsDialogRef = ref(null)
const bgImageUrl = ref('')
const bgCredit = ref('')
const bgLink = ref('')
const isWallpaperLoading = ref(false)

const currentEngine = computed(() => {
  const activeEngines = userSettings.activeEngineIds
  if (activeEngines.length > 0) {
    const defaultEng = activeEngines.includes(userSettings.defaultEngineId) ? userSettings.defaultEngineId : activeEngines[0]
    return getEngineDictionary()[defaultEng]
  }
  return DEFAULT_ENGINES[0]
})



const openSettings = () => {
  if (settingsDialogRef.value) {
    settingsDialogRef.value.openDialog()
  }
}

let mediaQueryList = null

const applyTheme = (themeStr) => {
  if (mediaQueryList) {
    mediaQueryList.removeEventListener('change', handleSystemThemeChange)
  }
  
  if (themeStr === 'auto') {
    mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQueryList.addEventListener('change', handleSystemThemeChange)
    const isDark = mediaQueryList.matches
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  } else {
    document.documentElement.dataset.theme = themeStr
  }
}

const handleSystemThemeChange = (e) => {
  if (userSettings.theme === 'auto') {
    document.documentElement.dataset.theme = e.matches ? 'dark' : 'light'
  }
}

watch(() => userSettings.theme, (val) => {
  applyTheme(val)
}, { immediate: true })

onMounted(() => {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (userSettings.theme === 'auto') {
      applyTheme('auto')
    }
  })
})

watch(() => userSettings.overlayStrength, (val) => {
  const safeOpacity = Math.min(Math.max(val, 0), 75) / 100
  document.documentElement.style.setProperty('--overlay-opacity', String(safeOpacity))
  document.documentElement.dataset.overlayActive = val >= 15 ? 'true' : 'false'
}, { immediate: true })

watch(() => userSettings.blurStrength, (val) => {
  document.documentElement.style.setProperty('--background-blur', `${val}px`)
}, { immediate: true })

watch(() => userSettings.clockSize, (val) => {
  document.documentElement.style.setProperty('--clock-scale', String(val / 100))
}, { immediate: true })

watch(() => userSettings.clockPosition, (val) => {
  document.documentElement.style.setProperty('--clock-offset', `${val}vh`)
}, { immediate: true })

watch(() => userSettings.clockStyle, (val) => {
  document.body.dataset.clockStyle = val
}, { immediate: true })


const fetchAndApplyWallpaper = async (force = false) => {
  isWallpaperLoading.value = true
  try {
    const wallpaper = await resolveWallpaper(force)
    await preloadImage(wallpaper.url)
    bgImageUrl.value = wallpaper.url
    bgCredit.value = wallpaper.credit
    bgLink.value = wallpaper.link
    
    gsap.fromTo('#bg-image', 
      { opacity: 0.6, scale: 1.02 }, 
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }
    )
  } catch (error) {
    console.error('Failed to load wallpaper', error)
  } finally {
    isWallpaperLoading.value = false
  }
}

const playInitialAnimations = () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    gsap.set('.time-block, .search-wrapper, .quick-links-track', { opacity: 1, y: 0 })
    return
  }
  
  // Fade in the entire app container to preserve backdrop-filter during opacity transition
  // (Chromium bug: opacity on parent breaks backdrop-filter if background is outside stacking context)
  gsap.fromTo('#app', 
    { opacity: 0 }, 
    { opacity: 1, duration: 1.2, ease: 'power2.out', clearProps: 'all' }
  )

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.fromTo('.time-block',
    { y: 30 },
    { y: 0, duration: 0.9, clearProps: 'all' }
  ).fromTo('.search-wrapper',
    { y: 20 },
    { y: 0, duration: 0.8, clearProps: 'all' },
    '-=0.7'
  ).fromTo('.quick-links-track',
    { y: 15 },
    { y: 0, duration: 0.7, clearProps: 'all' },
    '-=0.6'
  )

  // Interactive Parallax
  const heroX = gsap.quickTo('.hero-content', 'x', { duration: 0.7, ease: 'power2.out' })
  const heroY = gsap.quickTo('.hero-content', 'y', { duration: 0.7, ease: 'power2.out' })
  const backgroundX = gsap.quickTo('#bg-image', 'x', { duration: 1.1, ease: 'power2.out' })
  const backgroundY = gsap.quickTo('#bg-image', 'y', { duration: 1.1, ease: 'power2.out' })

  document.addEventListener('mousemove', event => {
    // Disable if any dialog is open
    if (document.querySelector('dialog[open]')) return;
    
    const x = (event.clientX / window.innerWidth - 0.5) * 10;
    const y = (event.clientY / window.innerHeight - 0.5) * 10;
    
    heroX(x);
    heroY(y);
    backgroundX(-x * 1.5);
    backgroundY(-y * 1.5);
  }, { passive: true })
}

watch(() => userSettings.bgSource, () => {
  fetchAndApplyWallpaper(false)
})

watch(() => userSettings.bgCustomUrl, () => {
  if (userSettings.bgSource === 'custom') {
    fetchAndApplyWallpaper(false)
  }
})

onMounted(() => {
  fetchAndApplyWallpaper(false)
  playInitialAnimations()
})
</script>

<template>
  <div class="wallpaper-container">
    <img id="bg-image" class="bg-image" :src="bgImageUrl" alt="Background" draggable="false" />
    <div id="bg-overlay" class="overlay"></div>
  </div>

  <main class="hero-container">
    <section class="hero-content" aria-label="新标签页">
      <HeroClock />
      <div class="search-wrapper">
        <SearchBar />
        <QuickLinks v-if="userSettings.showQuickLinks" />
      </div>
    </section>
  </main>
  
  <a v-if="bgLink" id="wallpaper-credit" class="wallpaper-credit" target="_blank" rel="noopener noreferrer" :href="bgLink">{{ bgCredit }}</a>
  <span v-else-if="bgCredit" id="wallpaper-credit" class="wallpaper-credit">{{ bgCredit }}</span>

  <nav class="utility-bar" aria-label="页面工具">
    <button id="wallpaper-refresh" class="tool-button" type="button" :title="$t('app.changeWallpaper')" :aria-label="$t('app.changeWallpaper')" @click="fetchAndApplyWallpaper(true)" :disabled="isWallpaperLoading" :aria-busy="isWallpaperLoading">
      <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"></path><path d="M20 4v7h-7"></path></svg>
    </button>
    <button id="settings-toggle" class="tool-button" type="button" :aria-label="$t('settings.title')" aria-haspopup="dialog" @click="openSettings">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
    </button>
  </nav>

  <SettingsDialog ref="settingsDialogRef" />
</template>


<style>
.hero-container {
  position: relative;
  z-index: 10;
  display: flex;
  min-height: 100vh;
  min-height: 100svh;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 15vh 1rem 8rem;
}

.hero-content {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  will-change: transform;
  margin-top: var(--clock-offset, 0vh);
  transition: margin-top 0.3s ease;
}

.search-wrapper {
  width: 100%;
  max-width: 650px;
}

.quick-links-container {
  width: 100%;
  max-width: 900px;
  margin: 4rem auto 0;
  padding: 0 1.5rem;
}

.wallpaper-credit {
  position: fixed;
  z-index: 20;
  bottom: 2rem;
  left: 2rem;
  max-width: min(44vw, 520px);
  overflow: hidden;
  color: var(--desktop-text);
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  text-overflow: ellipsis;
  text-shadow: var(--desktop-text-shadow);
  white-space: nowrap;
  opacity: 0.8;
  transition: opacity 0.3s ease, color 0.3s ease;
}

.wallpaper-credit:hover {
  color: var(--desktop-text);
  opacity: 1;
  text-decoration: underline;
}

.utility-bar {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.tool-button {
  position: relative;
  width: 48px;
  height: 48px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  color: var(--text-primary);
  box-shadow: 0 8px 25px var(--shadow-color, rgba(0,0,0,0.2));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: background 0.3s ease, color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

.tool-button:hover {
  background: var(--surface-strong);
  color: var(--text-primary);
  transform: scale(1.08);
  box-shadow: 0 12px 30px var(--shadow-color, rgba(0,0,0,0.3));
}

#settings-toggle:hover {
  transform: rotate(90deg) scale(1.1);
}

@media (max-width: 768px) {
  .hero-container {
    padding: 4rem 1rem 8rem;
  }
}

@media (max-width: 768px) {

  .search-wrapper {
    width: 100%;
  }
}

@media (max-width: 768px) {

  .quick-links-container {
    margin-top: 3rem;
  }
}

@media (max-width: 480px) {
  .hero-container {
    padding: 2.5rem 0.75rem 8rem;
  }
}

@media (max-width: 480px) {

  .wallpaper-credit {
    right: 1rem;
    bottom: 4.8rem;
    left: 1rem;
    max-width: none;
    text-align: right;
  }
}

@media (max-width: 480px) {

  .utility-bar {
    right: 1rem;
    bottom: 1rem;
  }
}

@media (max-width: 480px) {

  .wallpaper-credit {
    right: 1rem;
    bottom: 4.8rem;
    left: 1rem;
    max-width: none;
    text-align: right;
  }
}

@media (max-width: 480px) {

  .utility-bar {
    right: 1rem;
    bottom: 1rem;
  }
}

@media (max-width: 480px) {

  .tool-button {
    width: 44px;
    height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {

  #bg-image,
  .hero-content {
    will-change: auto;
  }
}

@media (max-width: 768px) {
  .hero-container { padding: 8vh 1rem 4rem; }
}
</style>
