<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { userSettings } from '../store/index.js'
import { useI18n } from 'vue-i18n'

const now = ref(new Date())
const timeHtml = ref('')
const dateText = ref('')
let animationFrameId = null

const { t, locale } = useI18n()

const updateClock = () => {
  now.value = new Date()
  
  const timeFormatter = new Intl.DateTimeFormat(locale.value, {
    hour: 'numeric',
    minute: '2-digit',
    second: userSettings.showSeconds ? '2-digit' : undefined,
    hour12: !userSettings.clock24h
  })
  
  const dateFormatter = new Intl.DateTimeFormat(locale.value, {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const parts = timeFormatter.formatToParts(now.value)
  let html = ''

  parts.forEach(part => {
    if (part.type === 'literal') {
      html += `<span class="clock-colon">${part.value}</span>`
    } else if (part.type === 'dayPeriod') {
      const ampm = (part.value.toLowerCase().includes('am') || part.value.includes('上午')) ? t('clock.am') : t('clock.pm')
      html += `<span class="clock-ampm">${ampm}</span>`
    } else {
      html += part.value
    }
  })

  timeHtml.value = html
  dateText.value = dateFormatter.format(now.value)
  
  animationFrameId = requestAnimationFrame(updateClock)
}

watch([() => userSettings.showSeconds, () => userSettings.clock24h, locale], () => {
  updateClock()
})

onMounted(() => {
  animationFrameId = requestAnimationFrame(updateClock)
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div class="time-block">
    <time id="clock" class="hero-heading" :aria-label="$t('clock.currentTime')" :datetime="now.toISOString()" v-html="timeHtml"></time>
    <time v-show="userSettings.showDate" id="date" class="date-line" :datetime="now.toISOString().slice(0, 10)">
      {{ dateText }}
    </time>
  </div>
</template>

<style>
.time-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2.5rem;
  text-align: center;
  z-index: 10;
}

.hero-heading {
  display: block;
  padding-right: 0.2em;
  font-size: calc(clamp(4rem, 15vw, 10rem) * var(--clock-scale, 1));
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
  transition: font-weight 0.3s ease, letter-spacing 0.3s ease;

  /*
   * Glass texture — matches SearchBar's frosted glass material.
   * Uses the same surface/border variables so it adapts to dark/light modes.
   * The text fill is semi-transparent (surface), with a bright edge highlight
   * (border-strong) creating the illusion of light refracting through glass.
   */
  background: var(--surface);
  -webkit-background-clip: text;
  background-clip: text;
  color: var(--border-strong);
  -webkit-text-fill-color: var(--border-strong);
  text-shadow: 1px 1px 0 var(--surface-soft),
              -1px -1px 0 rgba(0, 0, 0, 0.4),
               0 10px 30px rgba(0, 0, 0, 0.5);
}

/* --- Default --- */
body[data-clock-style="default"] .hero-heading,
.clock-preview-box.clock-style-default .hero-heading {
  font-family: inherit;
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* --- Minimal: ultra-thin, pure elegance --- */
body[data-clock-style="minimal"] .hero-heading,
.clock-preview-box.clock-style-minimal .hero-heading {
  font-weight: 200;
  letter-spacing: -0.05em;
}

/* --- Editorial: serif, magazine cover --- */
body[data-clock-style="editorial"] .hero-heading,
.clock-preview-box.clock-style-editorial .hero-heading {
  font-family: "Didot", "Bodoni MT", "Playfair Display", "Georgia", serif;
  font-weight: 400;
  letter-spacing: 0;
}

/* --- Mono: developer terminal --- */
body[data-clock-style="mono"] .hero-heading,
.clock-preview-box.clock-style-mono .hero-heading {
  font-family: "SF Mono", "Fira Code", "Consolas", "Courier New", monospace;
  font-weight: 500;
  letter-spacing: -0.05em;
}

/* --- Neon: cyberpunk glow --- */
body[data-clock-style="neon"] .hero-heading,
.clock-preview-box.clock-style-neon .hero-heading {
  font-weight: 800;
  color: var(--desktop-text) !important;
  -webkit-text-fill-color: var(--desktop-text) !important;
  background: var(--desktop-text);
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8),
               0 0 20px rgba(255, 255, 255, 0.8),
               0 0 30px rgba(0, 150, 255, 0.6),
               0 0 40px rgba(0, 150, 255, 0.6);
}

/* --- Outline: hollow stroke --- */
body[data-clock-style="outline"] .hero-heading,
.clock-preview-box.clock-style-outline .hero-heading {
  font-weight: 800;
  background: transparent;
  -webkit-background-clip: border-box;
  background-clip: border-box;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  -webkit-text-stroke: 2px var(--border-strong);
  text-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* --- Chroma: animated rainbow gradient --- */
body[data-clock-style="chroma"] .hero-heading,
.clock-preview-box.clock-style-chroma .hero-heading {
  font-weight: 900;
  background: linear-gradient(120deg, #ff007f, #7928ca, #00dfd8, #ff007f);
  background-size: 250% 250%;
  animation: chromaGradient 6s ease infinite;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  text-shadow: none;
}

@keyframes chromaGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* --- Glitch: cyberpunk RGB split --- */
body[data-clock-style="glitch"] .hero-heading,
.clock-preview-box.clock-style-glitch .hero-heading {
  font-weight: 900;
  letter-spacing: 0.02em;
  text-shadow: 3px 0 0 rgba(255, 0, 0, 0.7),
              -3px 0 0 rgba(0, 255, 255, 0.7),
               0 10px 30px rgba(0, 0, 0, 0.5);
}

/* --- Gradient Gold: warm sunrise --- */
body[data-clock-style="gradient-gold"] .hero-heading,
.clock-preview-box.clock-style-gradient-gold .hero-heading {
  font-weight: 800;
  background: linear-gradient(135deg, #ffe066 0%, #f59f00 50%, #e67700 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  text-shadow: none;
}

/* --- Gradient Aurora: dreamy pastel --- */
body[data-clock-style="gradient-aurora"] .hero-heading,
.clock-preview-box.clock-style-gradient-aurora .hero-heading {
  font-weight: 800;
  background: linear-gradient(135deg, #74c0fc 0%, #b197fc 50%, #f783ac 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  text-shadow: none;
}

.clock-ampm {
  font-size: 0.35em;
  margin-left: 0.1em;
  opacity: 0.8;
  font-weight: 400;
  vertical-align: super;
}

.date-line {
  min-height: 1.5rem;
  margin-top: 0.75rem;
  color: var(--border-strong);
  font-size: 1rem;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
}

.clock-preview-box .hero-heading {
  font-size: 2.75rem !important;
  line-height: 1.1;
  margin: 0;
  padding: 0;
}

.clock-preview-box .time-block {
  transform: none !important;
  margin-bottom: 0 !important;
}

.clock-preview-box .date-line {
  font-size: 0.9rem !important;
  margin-top: 0.25rem !important;
}

@media (max-width: 768px) {
  .hero-heading { font-size: clamp(3rem, 15vw, 5.5rem); }
  .time-block { margin-bottom: 1.75rem; }
}

@media (max-width: 480px) {
  .hero-heading { font-size: 4.25rem; }
  .date-line { font-size: 0.88rem; }
}

@media (max-width: 360px) {
  .hero-heading { font-size: 3.5rem; }
}
</style>
