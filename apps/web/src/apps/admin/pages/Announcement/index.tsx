import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/Card'
import { PageContainer } from '@/components/PageContainer'
import { useAnnouncementQuery } from '@/hooks/queries/useAnnouncementQuery'
import { useRequest } from '@/contexts/ApiContext'
import { queryKeys } from '@/constants/query-keys'
import { Button } from '@openproxy/ui/Button'
import { Input } from '@openproxy/ui/Input'
import { toastApiPromise } from '@/utils/toast'

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const queryClient = useQueryClient()
  const announcementQuery = useAnnouncementQuery()
  const announcement = announcementQuery.data

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const startEditing = () => {
    setTitle(announcement?.title || '')
    setDescription(announcement?.description || '')
    setIsEditing(true)
  }

  const handleSave = () => {
    toastApiPromise(request.admin.announcement.put({ title, description }), {
      loading: t('common.loading'),
      success: t('common.operationSuccess'),
      error: t('common.operationFailed'),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.announcement],
        })
        setIsEditing(false)
      },
    })
  }

  const handleDelete = () => {
    toastApiPromise(request.admin.announcement.delete(), {
      loading: t('common.loading'),
      success: t('common.operationSuccess'),
      error: t('common.operationFailed'),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.announcement],
        })
        setIsEditing(false)
        setTitle('')
        setDescription('')
      },
    })
  }

  return (
    <PageContainer
      title={t('announcement.title', { defaultValue: 'Announcement' })}
    >
      <Card className="flex flex-col gap-4">
        <div className="text-sm text-primary/75">
          {t('announcement.description', {
            defaultValue:
              'Publish an announcement that will be displayed to all users.',
          })}
        </div>

        {announcement && !isEditing ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-border p-4 flex flex-col gap-2">
              <div className="text-base font-semibold">
                {announcement.title}
              </div>
              <div className="text-sm text-primary/75 whitespace-pre-wrap">
                {announcement.description}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('announcement.updatedAt', {
                  defaultValue: 'Updated at',
                })}
                : {new Date(announcement.updatedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={startEditing}>
                {t('actions.edit', { defaultValue: 'Edit' })}
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                {t('actions.delete', { defaultValue: 'Delete' })}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('announcement.titlePlaceholder', {
                defaultValue: 'Announcement title',
              })}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('announcement.descriptionPlaceholder', {
                defaultValue: 'Announcement content',
              })}
              rows={5}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-y"
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={!title.trim() || !description.trim()}
              >
                {t('actions.save', { defaultValue: 'Save' })}
              </Button>
              {isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  )
}

export default Page
