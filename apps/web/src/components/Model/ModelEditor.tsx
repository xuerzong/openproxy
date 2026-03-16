import { ModelFormSchema } from '@openproxy/schema/model'
import { Settings2Icon, SettingsIcon, StoreIcon } from 'lucide-react'
import { useRequest } from '@/contexts/ApiContext'
import { useNavigate, useSearchParams } from 'react-router'
import { useMemo, useState } from 'react'
import useUpdateEffect from '@/hooks/useUpdateEffect'
import { ModelDeleteModal } from './ModelDeleteModel'
import { ModelForm } from './ModelForm'
import { AIProviderSelector } from '../AIProvider/AIProviderSelector'
import { Card } from '../Card'
import { Button } from '@openproxy/ui/Button'
import { useForm } from '@openproxy/ui/Form'
import { Tabs } from '@openproxy/ui/Tabs'
import { useTranslation } from 'react-i18next'
import {
  getToastRequestStatus,
  toastPromise,
  ToastRequestError,
} from '@/utils/toast'

type ModelFormData = any

const modelEditorTypes = ['base', 'provider', 'setting'] as const

type ModelEditorType = (typeof modelEditorTypes)[number]

interface ModelEditorProps {
  defaultValues: ModelFormData
  isEdit?: boolean
  onRefresh?: () => void
}

export const ModelEditor = ({
  defaultValues,
  isEdit,
  onRefresh,
}: ModelEditorProps) => {
  const { t } = useTranslation('common')
  const [form] = useForm({
    defaultValues: defaultValues,
    zodResolver: ModelFormSchema,
  })
  const navigate = useNavigate()
  const request = useRequest()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const modelId = defaultValues.id
  const isNewModel = !modelId
  const [searchParams] = useSearchParams()

  const type = useMemo<ModelEditorType>(() => {
    if (isNewModel) return 'base' as ModelEditorType
    const type = searchParams.get('type')
    if (modelEditorTypes.includes(type as any)) {
      return type as ModelEditorType
    }
    return modelEditorTypes[0]
  }, [searchParams, isNewModel])

  useUpdateEffect(() => {
    form.setValues(defaultValues)
  }, [defaultValues])

  const tabItems = useMemo(() => {
    if (isNewModel) {
      return [
        {
          key: 'base',
          label: t('models.tabs.basic', { defaultValue: 'Basic' }),
          icon: <Settings2Icon />,
        },
      ]
    }

    return [
      {
        key: 'base',
        label: t('models.tabs.basic', { defaultValue: 'Basic' }),
        icon: <Settings2Icon />,
      },
      {
        key: 'provider',
        label: t('models.tabs.providers', { defaultValue: 'Providers' }),
        icon: <StoreIcon />,
      },
      {
        key: 'setting',
        label: t('models.tabs.settings', { defaultValue: 'Settings' }),
        icon: <SettingsIcon />,
      },
    ]
  }, [isNewModel])

  return (
    <>
      <div className="sticky z-10 top-0 bg-background">
        <Tabs
          value={type}
          onValueChange={(value) => {
            navigate(`/models/${modelId}?type=${value}`)
          }}
          items={tabItems}
        />
      </div>
      {type === 'base' && (
        <>
          <ModelForm form={form} isEdit={isEdit} />
          <div className="flex p-4 gap-4">
            <div className="flex items-center gap-2 ml-auto">
              <Button
                loading={submitLoading}
                onClick={() => {
                  form.onSubmit(async (values: any) => {
                    setSubmitLoading(true)

                    const requestBody = {
                      id: values.id,
                      name: values.name,
                      description: values.description || '',
                      model: values.model,
                      tags: [],
                      type: values.type,
                      styles: values.styles,
                      ownedBy: values.ownedBy,
                      contextWindow: values.contextWindow,
                      maxTokens: values.maxTokens,
                      isPublic: values.isPublic,
                      pricing: {
                        input: values.pricing?.input
                          ? Number(values.pricing?.input)
                          : 0,
                        output: values.pricing?.output
                          ? Number(values.pricing?.output)
                          : 0,
                        input_cache_read: values.pricing?.input_cache_read
                          ? Number(values.pricing?.input_cache_read)
                          : 0,
                      },
                      metadata: values.metadata,
                    }

                    const resp = isEdit
                      ? request.models.put(requestBody)
                      : request.models.post(requestBody)

                    await toastPromise(
                      resp.then(({ data, error }) => {
                        if (error) {
                          throw new ToastRequestError(error)
                        }

                        return data
                      }),
                      {
                        loading: t('common.processing', {
                          defaultValue: 'Processing...',
                        }),
                        success: t('common.operationSuccess', {
                          defaultValue: 'Success',
                        }),
                        error: (error) => {
                          if (error instanceof ToastRequestError) {
                            return t('common.operationFailedWithStatus', {
                              defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
                              status: getToastRequestStatus(error),
                            })
                          }

                          return t('common.operationFailedWithMessage', {
                            defaultValue: `Operation failed: ${(error as Error).message}`,
                            message:
                              error instanceof Error
                                ? error.message
                                : 'Unknown error',
                          })
                        },
                        onSuccess: (data) => {
                          if (!isEdit && Array.isArray(data) && data[0]) {
                            navigate(`/models/${data[0].id}`, { replace: true })
                          }
                        },
                      }
                    )
                      .catch(() => undefined)
                      .finally(() => {
                        setSubmitLoading(false)
                      })
                  })
                }}
              >
                {isEdit
                  ? t('actions.save', { defaultValue: 'Save' })
                  : t('actions.create', { defaultValue: 'Create' })}
              </Button>
            </div>
          </div>
        </>
      )}

      {type === 'provider' && !isNewModel && (
        <AIProviderSelector
          id={modelId}
          providers={defaultValues.providers || []}
          onSuccess={() => {
            onRefresh?.()
          }}
        />
      )}

      {type === 'setting' && !isNewModel && (
        <Card>
          <div className="text-lg font-bold mb-2">
            {t('models.deleteModel', { defaultValue: 'Delete Model' })}
          </div>
          <div className="text-right">
            <Button variant="danger" onClick={() => setDelOpen(true)}>
              {t('actions.delete', { defaultValue: 'Delete' })}
            </Button>
          </div>
        </Card>
      )}

      <ModelDeleteModal
        id={defaultValues.id}
        open={delOpen}
        onOpenChange={setDelOpen}
        onSuccess={() => {
          navigate('/models', { replace: true })
        }}
      />
    </>
  )
}
