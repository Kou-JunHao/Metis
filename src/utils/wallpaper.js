import { userSettings } from '../store/index.js'
import { getWallpaperFromDB, saveWallpaperToDB } from './db.js'

const DAY_MS = 24 * 60 * 60 * 1000

export function normalizeHttpUrl(urlStr, isSearchUrl = false) {
  if (!urlStr) return ''
  let trimmed = urlStr.trim()
  if (!/^https?:\/\//i.test(trimmed)) trimmed = 'https://' + trimmed
  try {
    const url = new URL(trimmed)
    if (isSearchUrl && !url.href.includes('%s')) return ''
    return url.href
  } catch (e) {
    return ''
  }
}

async function resolveBingWallpaper(force) {
  const index = force ? Math.floor(Math.random() * 8) : 0
  const baseUrl = import.meta.env.DEV ? '/bing-api' : 'https://www.bing.com'
  const api = `${baseUrl}/HPImageArchive.aspx?format=js&idx=${index}&n=1&mkt=zh-CN`
  const res = await fetch(api)
  if (!res.ok) throw new Error('Bing API Error')
  const data = await res.json()
  const img = data.images[0]
  if (!img) throw new Error('No image found')
  return {
    source: 'bing',
    url: `https://www.bing.com${img.url.replace('&pid=hp', '')}`,
    credit: img.copyright,
    link: img.copyrightlink
  }
}

async function resolveWikimediaWallpaper() {
  const offset = Math.floor(Math.random() * 80)
  const parameters = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: 'landscape filetype:bitmap',
    gsrnamespace: '6',
    gsrlimit: '20',
    gsroffset: String(offset),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '2560',
    format: 'json',
    origin: '*'
  })
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${parameters.toString()}`)
  if (!res.ok) throw new Error('Wikimedia API Error')
  const data = await res.json()
  const pages = data.query?.pages
  if (!pages) throw new Error('No images found')
  const items = Object.values(pages).filter(p => p.imageinfo?.[0]?.url)
  const img = items[Math.floor(Math.random() * items.length)].imageinfo[0]
  return {
    source: 'wikimedia',
    url: img.url,
    credit: img.extmetadata?.ObjectName?.value || 'Wikimedia Commons',
    link: img.descriptionshorturl
  }
}

async function resolvePicsumWallpaper(force) {
  if (force) {
    const res = await fetch('https://picsum.photos/1920/1080', { method: 'HEAD' })
    const realUrl = res.url
    return { source: 'picsum', url: realUrl, credit: 'Picsum Photos', link: realUrl }
  } else {
    // Determine a "daily" image by using a seed based on the current date
    const dateStr = new Date().toISOString().slice(0, 10)
    let hash = 0
    for (let i = 0; i < dateStr.length; i++) hash = Math.imul(31, hash) + dateStr.charCodeAt(i) | 0
    const seed = Math.abs(hash) % 1000
    const url = `https://picsum.photos/id/${seed}/1920/1080`
    return { source: 'picsum', url, credit: `Picsum Image #${seed}`, link: `https://picsum.photos/id/${seed}` }
  }
}

export async function resolveWallpaper(force) {
  const source = userSettings.bgSource

  if (source === 'local') {
    const localBg = await getWallpaperFromDB('local_wallpaper')
    if (!localBg || !localBg.url) throw new Error('请先在设置中上传本地壁纸')
    return { source, url: localBg.url, credit: 'Local Image', link: '' }
  }

  if (source === 'custom') {
    const url = normalizeHttpUrl(userSettings.bgCustomUrl, false)
    if (!url) throw new Error('请先填写有效的图片 URL')
    return { source, url, credit: new URL(url).hostname, link: url }
  }

  if (!force) {
    const cached = await getWallpaperFromDB(`cache_${source}`)
    if (cached && (Date.now() - cached.timestamp < DAY_MS)) {
      return cached
    }
  }

  let result
  switch (source) {
    case 'bing': result = await resolveBingWallpaper(force); break
    case 'wikimedia': result = await resolveWikimediaWallpaper(); break
    case 'picsum': result = await resolvePicsumWallpaper(force); break
    default: result = await resolveBingWallpaper(force)
  }

  await saveWallpaperToDB(`cache_${source}`, result)
  return result
}

export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        canvas.width = 10
        canvas.height = 10
        const sx = Math.floor(img.width * 0.25)
        const sy = Math.floor(img.height * 0.4)
        const sw = Math.floor(img.width * 0.5)
        const sh = Math.floor(img.height * 0.4)
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 10, 10)
        
        const imageData = ctx.getImageData(0, 0, 10, 10).data
        let totalLuminance = 0
        let count = 0
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i]
          const g = imageData[i + 1]
          const b = imageData[i + 2]
          totalLuminance += (0.299 * r + 0.587 * g + 0.114 * b) / 255
          count++
        }
        const avgLuminance = totalLuminance / count
        const isBright = avgLuminance > 0.55
        document.documentElement.dataset.wallpaperLuminance = isBright ? 'light' : 'dark'
      } catch (e) {
        document.documentElement.dataset.wallpaperLuminance = 'dark'
      }
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}