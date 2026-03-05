import { ModelFormSchema } from '@openproxy/schema/model'
import { Settings2Icon, SettingsIcon, StoreIcon } from 'lucide-react'
import { useRequest } from '@/contexts/ApiContext'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useMemo, useState } from 'react'
import useUpdateEffect from '@/hooks/useUpdateEffect'
import { ModelDeleteModal } from './ModelDeleteModel'
import { ModelForm } from './ModelForm'
import { AIProviderSelector } from '../AIProvider/AIProviderSelector'
import { Card } from '../Card'
import { Button } from '../ui/Button'
import { useForm } from '../ui/Form'
import { Tabs } from '../ui/Tabs'
import { useTranslation } from 'react-i18next'

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
  const [searchParams] = useSearchParams()

  const type = useMemo<ModelEditorType>(() => {
    const type = searchParams.get('type')
    if (modelEditorTypes.includes(type as any)) {
      return type as ModelEditorType
    }
    return modelEditorTypes[0]
  }, [searchParams])

  useUpdateEffect(() => {
    form.setValues(defaultValues)
  }, [defaultValues])

  return (
    <>
      <div className="sticky z-10 top-0 bg-background">
        <Tabs
          value={type}
          onValueChange={(value) => {
            navigate(`/models/${modelId}?type=${value}`)
          }}
          items={[
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
          ]}
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

                    return resp
                      .then(({ data, error }) => {
                        if (error) {
                          toast.error(
                            t('common.operationFailedWithStatus', {
                              defaultValue: `Operation failed: ${error.status}`,
                              status: error.status,
                            })
                          )
                          return
                        }
                        toast.success(
                          t('common.operationSuccess', {
                            defaultValue: 'Success',
                          })
                        )

                        // Create a model
                        if (!isEdit) {
                          if (Array.isArray(data) && data[0]) {
                            navigate(`/models/${data[0].id}`, { replace: true })
                          }
                        }
                      })
                      .catch((error) => {
                        toast.error(
                          t('common.operationFailedWithMessage', {
                            defaultValue: `Operation failed: ${error.message}`,
                            message: error.message,
                          })
                        )
                      })
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

      {type === 'provider' && (
        <AIProviderSelector
          id={modelId}
          providers={defaultValues.providers || []}
          onSuccess={() => {
            onRefresh?.()
          }}
        />
      )}

      {type === 'setting' && (
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
