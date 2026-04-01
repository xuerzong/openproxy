import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnnouncementQuery } from '@/hooks/queries/useAnnouncementQuery'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { XIcon, MegaphoneIcon } from 'lucide-react'

const MODAL_DISMISSED_KEY = 'announcement-modal-dismissed'
const ALERT_DISMISSED_KEY = 'announcement-alert-dismissed'

const getDismissedTimestamp = (key: string): number => {
  try {
    return Number(localStorage.getItem(key)) || 0
  } catch {
    return 0
  }
}

const setDismissedTimestamp = (key: string, ts: number) => {
  try {
    localStorage.setItem(key, String(ts))
  } catch {
    // ignore
  }
}

const getTimestamp = (value: unknown): number => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string' || typeof value === 'number')
    return new Date(value).getTime()
  return 0
}

export const AnnouncementAlert = () => {
  const announcementQuery = useAnnouncementQuery()
  const announcement = announcementQuery.data
  const [alertVisible, setAlertVisible] = useState(false)
  const updatedTs = getTimestamp(announcement?.updatedAt)

  useEffect(() => {
    if (!updatedTs) return

    if (getDismissedTimestamp(ALERT_DISMISSED_KEY) < updatedTs) {
      setAlertVisible(true)
    }
  }, [updatedTs])

  if (!announcement || !alertVisible) return null

  const handleAlertClose = () => {
    setAlertVisible(false)
    setDismissedTimestamp(ALERT_DISMISSED_KEY, updatedTs)
  }

  return (
    <div className="w-full flex items-center gap-2 bg-yellow-300 text-yellow-900 px-4 py-1 text-xs">
      <MegaphoneIcon className="w-4 h-4 shrink-0" />
      <span className="truncate font-bold">{announcement.title}</span>
      <span className="truncate">{announcement.description}</span>
      <button
        onClick={handleAlertClose}
        className="shrink-0 rounded p-0.5 hover:bg-yellow-300 transition-colors ml-auto"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

export const AnnouncementBanner = () => {
  const { t } = useTranslation('common')
  const announcementQuery = useAnnouncementQuery()
  const announcement = announcementQuery.data

  const [modalOpen, setModalOpen] = useState(false)
  const updatedTs = getTimestamp(announcement?.updatedAt)

  useEffect(() => {
    if (!updatedTs) return

    if (getDismissedTimestamp(MODAL_DISMISSED_KEY) < updatedTs) {
      setModalOpen(true)
    }
  }, [updatedTs])

  if (!announcement) return null

  const handleModalClose = () => {
    setModalOpen(false)
    setDismissedTimestamp(MODAL_DISMISSED_KEY, updatedTs)
  }

  return (
    <Dialog
      open={modalOpen}
      onOpenChange={(open) => {
        if (!open) handleModalClose()
      }}
      title={announcement.title}
      footer={
        <DialogFooter
          okText={t('actions.confirm', { defaultValue: 'Confirm' })}
          onOk={handleModalClose}
          onCancel={handleModalClose}
          cancelText={t('actions.close', { defaultValue: 'Close' })}
        />
      }
    >
      <span>{announcement.description}</span>
    </Dialog>
  )
}
