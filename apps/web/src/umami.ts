const id = window.__APP_CONFIG__?.UMAMI_WEBSITE_ID?.trim()
if (
  id &&
  location.hostname !== 'localhost' &&
  location.hostname !== '127.0.0.1'
) {
  const s = document.createElement('script')
  s.defer = true
  s.src = 'https://cloud.umami.is/script.js'
  s.dataset.websiteId = id
  document.head.appendChild(s)
}
