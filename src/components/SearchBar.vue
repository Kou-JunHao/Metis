<script setup>
import { ref, onMounted, watch } from 'vue'
import { userSettings, currentCycle } from '../store/index.js'
import gsap from 'gsap'

const currentIndex = ref(0)
const searchInput = ref(null)
const engineIconWrapper = ref(null)

const currentEngine = ref(currentCycle.value[0])

watch(() => currentCycle.value, (newCycle) => {
  if (newCycle.length > 0) {
    const defaultIdx = newCycle.findIndex(e => e.id === userSettings.defaultEngineId)
    currentIndex.value = defaultIdx >= 0 ? defaultIdx : 0
    currentEngine.value = newCycle[currentIndex.value]
  }
}, { immediate: true, deep: true })

const switchEngine = () => {
  if (currentCycle.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % currentCycle.value.length
  currentEngine.value = currentCycle.value[currentIndex.value]
  
  // Animation
  gsap.fromTo(engineIconWrapper.value,
    { rotation: -120, scale: 0.65, opacity: 0 },
    { rotation: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.5)', clearProps: 'transform,opacity' }
  )
  
  if (searchInput.value) {
    searchInput.value.focus()
  }
}

const handleSearch = (e) => {
  e.preventDefault()
  if (!searchInput.value || !currentEngine.value) return
  const query = searchInput.value.value.trim()
  if (!query) return
  const destination = currentEngine.value.url.split('%s').join(encodeURIComponent(query))
  window.location.assign(destination)
}
</script>

<template>
  <form id="search-form" class="gsap-search-form" role="search" @submit="handleSearch">
    <button 
      id="engine-switch-btn" 
      class="icon-button engine-button" 
      type="button" 
      :title="$t('search.switchEngine', { engine: currentEngine?.name })"
      :aria-label="$t('search.switchEngine', { engine: currentEngine?.name })"
      @click="switchEngine"
    >
      <span id="engine-icon-wrapper" style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;" ref="engineIconWrapper" v-html="currentEngine?.icon"></span>
    </button>
    <span class="divider" aria-hidden="true"></span>
    <label class="sr-only" for="search-input">{{ $t('search.placeholder') }}</label>
    <input 
      id="search-input" 
      class="search-input" 
      type="search" 
      :placeholder="$t('search.placeholder')" 
      autocomplete="off"
      ref="searchInput"
      autofocus
    />
    <button type="submit" class="search-submit">{{ $t('search.button') }}</button>
  </form>
</template>


<style>
.gsap-search-form {
  display: grid;
  width: 100%;
  min-height: 64px;
  grid-template-columns: 48px 1px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-soft);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  -webkit-backdrop-filter: blur(25px);
  backdrop-filter: blur(25px);
  transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease;
}

.gsap-search-form:focus-within {
  border-color: var(--border-strong, rgba(255, 255, 255, 0.5));
  background: var(--surface, rgba(255, 255, 255, 0.15));
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5), 0 0 20px var(--accent-glow, rgba(255, 255, 255, 0.2));
  transform: translateY(-2px);
}

.icon-button,
.tool-button,
.search-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  outline: none;
}

.engine-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: var(--text-primary);
  transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

.engine-button:focus-visible {
  box-shadow: 0 0 0 2px var(--text-secondary);
}

.engine-button:hover,
.icon-button:hover {
  background: var(--surface-soft);
}

.engine-button:hover {
  transform: scale(1.05);
}

#search-input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 500;
}

#search-input::-webkit-search-cancel-button {
  filter: invert(1);
  opacity: 0.55;
}

#search-input::placeholder,
#todo-input::placeholder,
.premium-input::placeholder {
  color: var(--text-muted);
}

.search-submit {
  min-height: 46px;
  padding: 0.8rem 2rem;
  border-radius: 999px;
  background: var(--search-btn-bg);
  color: var(--search-btn-text);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  transition: all 0.3s ease;
}

.search-submit:hover {
  background: var(--search-btn-hover);
  color: var(--search-btn-text);
  box-shadow: 0 0 15px var(--accent-glow);
  transform: scale(1.05);
}

#engine-icon-wrapper svg {
  width: 100%;
  height: 100%;
}

@media (max-width: 480px) {

  .gsap-search-form {
    min-height: 58px;
    grid-template-columns: 44px 1px minmax(0, 1fr) auto;
    gap: 0.35rem;
    padding: 0.4rem;
  }
}

@media (max-width: 480px) {

  .engine-button {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 480px) {

  #search-input {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {

  .search-submit {
    min-height: 42px;
    padding: 0.7rem 1rem;
  }
}

@media (max-width: 768px) {
  .gsap-search-form { width: 100%; min-height: 50px; }
}
</style>
