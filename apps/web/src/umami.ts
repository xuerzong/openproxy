const id = import.meta.env.VITE_UMAMI_WEBSITE_ID
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
