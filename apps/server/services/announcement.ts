import { getRedis } from '@server/lib/redis'

const ANNOUNCEMENT_KEY = 'openproxy:announcement'

export interface Announcement {
  title: string
  description: string
  updatedAt: string
}

export const getAnnouncement = async (): Promise<Announcement | null> => {
  const redis = getRedis()
  if (!redis) return null

  const data = await redis.get(ANNOUNCEMENT_KEY)
  if (!data) return null

  return JSON.parse(data) as Announcement
}

export const setAnnouncement = async (
  title: string,
  description: string
): Promise<Announcement> => {
  const redis = getRedis()
  if (!redis) throw new Error('Redis is not available')

  const announcement: Announcement = {
    title,
    description,
    updatedAt: new Date().toISOString(),
  }

  await redis.set(ANNOUNCEMENT_KEY, JSON.stringify(announcement))
  return announcement
}

export const deleteAnnouncement = async (): Promise<void> => {
  const redis = getRedis()
  if (!redis) throw new Error('Redis is not available')

  await redis.del(ANNOUNCEMENT_KEY)
}
