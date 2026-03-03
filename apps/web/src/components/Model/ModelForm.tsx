import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useConstsQuery } from '@/hooks/queries/useConstsQuery'
import { Input, Textarea } from '../ui/Input'
import { NumberInput } from '../ui/NumberInput'
import { Form, FormField, type FormInstance } from '../ui/Form'
import { CheckboxGroup } from '../ui/Checkbox'
import { RadioGroup } from '../ui/Radio'
import { ModelIcon } from '../ModelIcon'
import { useTranslation } from 'react-i18next'

interface ModelFormProps {
  form: FormInstance
  isEdit?: boolean
}

interface PricingInputProps {
  value?: { output: string; input: string }
  onChange?: (value: { output: string; input: string }) => void
}

const PicingInput: React.FC<PricingInputProps> = ({ value, onChange }) => {
  const onTriggerChange = (newValue: Partial<PricingInputProps['value']>) => {
    onChange?.({ ...value!, ...newValue })
  }
  const input = value && value.output ? Number(value.input) : void 0
  const output = value && value.output ? Number(value.output) : void 0
  return (
    <div className="flex items-center gap-2">
      <NumberInput
        inputProps={{
          placeholder: '0.00',
        }}
        value={input}
        onChange={(e) => {
          onTriggerChange({ input: e.toString() })
        }}
        min={0}
        precision={2}
      />
      <NumberInput
        inputProps={{
          placeholder: '0.00',
        }}
        value={output}
        onChange={(e) => {
          onTriggerChange({ output: e.toString() })
        }}
        min={0}
        precision={2}
      />
    </div>
  )
}

export const ModelForm: React.FC<ModelFormProps> = ({
  form,
  isEdit = false,
}) => {
  const { t } = useTranslation('common')
  const constsQuery = useConstsQuery()
  const { isAdmin } = useAuth()
  const supportedModelOwnedByOptions = useMemo(() => {
    return constsQuery.data?.supportedModelOwnedBy.map((d) => ({
      label: (
        <div className="flex flex-row items-center gap-2">
          <ModelIcon model={d} />
          <span className="capitalize">{d}</span>
        </div>
      ) as React.ReactNode,
      value: d,
    }))
  }, [constsQuery])
  return (
    <Form form={form}>
      <FormField
        name="id"
        label={t('models.modelId', { defaultValue: 'Model ID' })}
        help={t('models.modelIdHelp', {
          defaultValue:
            'Model ID is the unique identifier. To ensure uniqueness, the system appends random characters after the name you provide.',
        })}
        requiredMask
      >
        <Input
          placeholder={t('models.modelIdPlaceholder', {
            defaultValue: 'Please input model ID',
          })}
          maxLength={64}
          disabled={isEdit}
        />
      </FormField>

      <FormField
        name="name"
        label={t('models.displayName', { defaultValue: 'Display Name' })}
        requiredMask
      >
        <Input
          placeholder={t('models.displayNamePlaceholder', {
            defaultValue: 'Please input display name',
          })}
          maxLength={64}
        />
      </FormField>

      <FormField
        name="model"
        label={t('models.modelName', { defaultValue: 'Model Name' })}
        help={t('models.modelNameHelp', {
          defaultValue:
            'This name is used when calling provider APIs. Keep it consistent with provider-side configuration.',
        })}
        requiredMask
      >
        <Input
          placeholder={t('models.modelNamePlaceholder', {
            defaultValue: 'Please input model name (e.g. deepseek-chat)',
          })}
          maxLength={64}
        />
      </FormField>

      <FormField
        name="description"
        label={t('models.description', { defaultValue: 'Description' })}
      >
        <Textarea
          placeholder={t('models.descriptionPlaceholder', {
            defaultValue: 'Please input description',
          })}
          maxLength={1024}
        />
      </FormField>

      <FormField
        name="styles"
        label={t('models.styles', { defaultValue: 'Styles' })}
        requiredMask
      >
        <CheckboxGroup
          options={
            constsQuery.data?.supportedModelStyles.map((d) => ({
              label: (
                <div className="flex items-center gap-1 select-none">
                  <ModelIcon className="w-4 h-4" model={d} />
                  <span className="inline-block flex-1 shrink-0 text-md capitalize">
                    {d}
                  </span>
                </div>
              ),
              value: d,
            })) || []
          }
        />
      </FormField>

      <FormField
        name="type"
        label={t('common.type', { defaultValue: 'Type' })}
        requiredMask
      >
        <RadioGroup
          options={[
            {
              label: t('models.type.language', {
                defaultValue: 'Language (language)',
              }),
              value: 'language',
            },
            {
              label: t('models.type.image', { defaultValue: 'Image (image)' }),
              value: 'image',
            },
            {
              label: t('models.type.embedding', {
                defaultValue: 'Embedding (embedding)',
              }),
              value: 'embedding',
            },
          ]}
        />
      </FormField>

      <FormField
        name="ownedBy"
        label={t('models.ownedBy', { defaultValue: 'Owned By' })}
        help={t('models.ownedByHelp', {
          defaultValue: 'Used only for model icon display',
        })}
        requiredMask
      >
        <RadioGroup options={supportedModelOwnedByOptions || []} />
      </FormField>

      <FormField
        name="contextWindow"
        label={t('models.contextWindow', { defaultValue: 'Context Window' })}
      >
        <NumberInput />
      </FormField>

      <FormField
        name="maxTokens"
        label={t('models.maxOutput', { defaultValue: 'Max Output' })}
      >
        <NumberInput />
      </FormField>

      {isAdmin && (
        <FormField
          name="isPublic"
          label={t('models.publicModel', { defaultValue: 'Public Model' })}
        >
          <RadioGroup
            options={[
              {
                label: t('common.yes', { defaultValue: 'Yes' }),
                value: true,
              },
              {
                label: t('common.no', { defaultValue: 'No' }),
                value: false,
              },
            ]}
            valueType="boolean"
          />
        </FormField>
      )}

      <FormField
        name="pricing"
        label={t('models.pricingPerMillion', {
          defaultValue: 'Pricing (per million)',
        })}
      >
        <PicingInput />
      </FormField>
    </Form>
  )
}
