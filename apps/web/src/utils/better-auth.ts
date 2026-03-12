import { createAuthClient } from 'better-auth/react'
import { magicLinkClient, phoneNumberClient } from 'better-auth/client/plugins'

console.log(window.location.origin)

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: '/api/auth/',
  fetchOptions: {
    onError: (context) => {
      const response = context.response
      if (response.status === 429) {
        const retryAfter = response.headers.get('X-Retry-After')
        if (process.env.NODE_ENV === 'development') {
          console.log('Rate limit exceeded, retry after:', retryAfter)
        }
      }
    },
  },
  plugins: [magicLinkClient(), phoneNumberClient()],
})

export const changeActiveTeam = async (teamId: string) => {
  const response = await fetch('/api/auth/change-team', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ teamId }),
  })

  if (!response.ok) {
    throw new Error(`Failed to switch team: ${response.status}`)
  }

  return await response.json()
}
