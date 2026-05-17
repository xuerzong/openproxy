import { useEffect, useState } from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Dialog } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { Button } from '@openproxy/ui/Button'
import { CheckboxGroup } from '@openproxy/ui/Checkbox'
import { Select } from '@openproxy/ui/Select'
import { Form, FormField, FormLabel, useForm } from '@openproxy/ui/Form'
import { useRequest } from '@/contexts/ApiContext'
import { useTranslation } from 'react-i18next'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'
import type { AIProviderItem } from '@/hooks/queries/useAIProvidersQuery'

const PROVIDER_STYLES = [
  'openai_chat',
  'anthropic_messages',
  'openai_responses',
  'embeddings',
] as const

type ProviderBaseUrlEntry = { style: string; baseUrl: string }

interface AIProviderEditModalProps {
  provider?: AIProviderItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const buildDefaultValues = (provider?: AIProviderItem | null) => ({
  id: provider?.id ?? '',
  name: provider?.name ?? '',
  baseUrl: provider?.baseUrl ?? '',
  docsUrl: provider?.docsUrl ?? '',
  icon: provider?.icon ?? '',
  supportedStyles: provider?.supportedStyles
    ? Array.from(provider.supportedStyles)
    : [],
  baseUrls: provider?.baseUrls
    ? provider.baseUrls.map((entry) => ({ ...entry }))
    : ([] as ProviderBaseUrlEntry[]),
})

export const AIProviderEditModal: React.FC<AIProviderEditModalProps> = ({
  provider,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const isEdit = Boolean(provider)
  const [submitting, setSubmitting] = useState(false)
  const [form] = useForm({
    defaultValues: buildDefaultValues(provider),
  })

  useEffect(() => {
    if (open) {
      form.setValues(buildDefaultValues(provider))
      form.resetErrors()
    }
  }, [open, provider])

  const baseUrls = (form.values.baseUrls as ProviderBaseUrlEntry[]) || []

  const updateBaseUrl = (
    index: number,
    patch: Partial<ProviderBaseUrlEntry>
  ) => {
    const next = baseUrls.map((entry, i) =>
      i === index ? { ...entry, ...patch } : entry
    )
    form.onFieldChange('baseUrls', next)
  }

  const addBaseUrl = () => {
    form.onFieldChange('baseUrls', [
      ...baseUrls,
      { style: PROVIDER_STYLES[0], baseUrl: '' },
    ])
  }

  const removeBaseUrl = (index: number) => {
    form.onFieldChange(
      'baseUrls',
      baseUrls.filter((_, i) => i !== index)
    )
  }

  const handleSubmit = () => {
    const values = form.values
    const name = (values.name || '').trim()
    const baseUrl = (values.baseUrl || '').trim()

    if (!name) {
      form.setFieldError('name', t('aiProviders.errors.nameRequired'))
      return
    }
    if (!baseUrl) {
      form.setFieldError('baseUrl', t('aiProviders.errors.baseUrlRequired'))
      return
    }

    const payload = {
      name,
      baseUrl,
      docsUrl: (values.docsUrl || '').trim(),
      icon: (values.icon || '').trim(),
      supportedStyles: (values.supportedStyles as string[]) || [],
      baseUrls: ((values.baseUrls as ProviderBaseUrlEntry[]) || [])
        .map((entry) => ({
          style: entry.style.trim(),
          baseUrl: entry.baseUrl.trim(),
        }))
        .filter((entry) => entry.style && entry.baseUrl),
    }

    setSubmitting(true)

    const promise = isEdit
      ? request.aiProviders.put({ id: provider!.id, ...payload })
      : request.aiProviders.post({
          ...(values.id ? { id: (values.id as string).trim() } : {}),
          ...payload,
        })

    toastApiPromise(promise, {
      loading: t('common.processing'),
      success: t('common.operationSuccess'),
      error: (error) =>
        t('common.operationFailedWithStatus', {
          status: getToastRequestStatus(error),
        }),
      onSuccess: () => {
        onSuccess?.()
        onOpenChange(false)
      },
    }).finally(() => {
      setSubmitting(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('aiProviders.editTitle') : t('aiProviders.createTitle')}
      width={720}
    >
      <Form form={form}>
        {!isEdit && (
          <FormField
            name="id"
            label={t('aiProviders.idLabel')}
            help={t('aiProviders.idHelp')}
          >
            <Input
              placeholder={t('aiProviders.idPlaceholder')}
              maxLength={64}
            />
          </FormField>
        )}

        <FormField name="name" label={t('common.name')} requiredMask>
          <Input
            placeholder={t('aiProviders.namePlaceholder')}
            maxLength={64}
          />
        </FormField>

        <FormField name="baseUrl" label={t('aiProviders.baseUrl')} requiredMask>
          <Input placeholder={t('aiProviders.baseUrlPlaceholder')} />
        </FormField>

        <FormField name="docsUrl" label={t('aiProviders.docsUrl')}>
          <Input placeholder={t('aiProviders.docsUrlPlaceholder')} />
        </FormField>

        <FormField
          name="icon"
          label={t('aiProviders.icon')}
          help={t('aiProviders.iconHelp')}
        >
          <Input maxLength={64} />
        </FormField>

        <FormField
          name="supportedStyles"
          label={t('aiProviders.supportedStyles')}
        >
          <CheckboxGroup
            options={PROVIDER_STYLES.map((style) => ({
              label: style,
              value: style,
            }))}
          />
        </FormField>

        <fieldset>
          <FormLabel help={t('aiProviders.styleBaseUrlsHelp')}>
            {t('aiProviders.styleBaseUrls')}
          </FormLabel>
          <div className="mt-2 space-y-2">
            {baseUrls.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  triggerClassName="w-44"
                  value={entry.style}
                  onChange={(value) =>
                    updateBaseUrl(index, { style: value as string })
                  }
                  options={PROVIDER_STYLES.map((style) => ({
                    label: style,
                    value: style,
                  }))}
                />
                <Input
                  className="flex-1"
                  value={entry.baseUrl}
                  placeholder={t('aiProviders.styleBaseUrlPlaceholder')}
                  onChange={(e) =>
                    updateBaseUrl(index, { baseUrl: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeBaseUrl(index)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBaseUrl}
            >
              <PlusIcon className="size-4" />
              {t('aiProviders.addStyleBaseUrl')}
            </Button>
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('actions.cancel')}
          </Button>
          <Button type="button" loading={submitting} onClick={handleSubmit}>
            {t('actions.save')}
          </Button>
        </div>
      </Form>
    </Dialog>
  )
}
