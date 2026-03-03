import { useState } from 'react'
import { BoxesIcon } from 'lucide-react'
import { ModelTable } from '../Model/ModelTable'
import { Drawer } from '../ui/Drawer'
import { Form, FormField, type FormInstance } from '../ui/Form'
import { Input } from '../ui/Input'
import { NumberInput } from '../ui/NumberInput'
import { Button } from '../ui/Button'
import { useTranslation } from 'react-i18next'

interface APIKeyFormProps {
  form: FormInstance
}

export const APIKeyForm: React.FC<APIKeyFormProps> = ({ form }) => {
  const { t } = useTranslation('common')
  const [modelsOpen, setModelsOpen] = useState(false)
  const modelIds = form.values.modelIds || []
  return (
    <>
      <Form form={form}>
        <FormField
          name="name"
          label={t('apiKeys.nameRequired', { defaultValue: 'Name (required)' })}
        >
          <Input
            placeholder={t('apiKeys.namePlaceholder', {
              defaultValue: 'Please input name',
            })}
            maxLength={32}
          />
        </FormField>

        <FormField
          name="modelsId"
          label={t('apiKeys.modelList', { defaultValue: 'Model List' })}
        >
          <div>
            <Button
              onClick={() => {
                setModelsOpen(true)
              }}
            >
              <BoxesIcon />
              {t('models.addModel', { defaultValue: 'Add Model' })}
              <span>{modelIds.length || 0}</span>
            </Button>
          </div>
        </FormField>

        <FormField
          name="maxRequests"
          label={t('apiKeys.maxRequestsOptional', {
            defaultValue: 'Max Requests (optional)',
          })}
        >
          <NumberInput
            inputProps={{
              placeholder: t('common.pleaseInput', {
                defaultValue: 'Please input',
              }),
            }}
          />
        </FormField>

        <FormField
          name="maxQuota"
          label={t('apiKeys.maxQuotaOptional', {
            defaultValue: 'Max Quota (optional)',
          })}
        >
          <NumberInput
            inputProps={{
              placeholder: t('common.pleaseInput', {
                defaultValue: 'Please input',
              }),
            }}
            precision={2}
          />
        </FormField>

        <FormField
          name="expiresAt"
          label={t('apiKeys.expiresAtOptional', {
            defaultValue: 'Expiration Time (optional)',
          })}
        >
          <Input type="datetime-local" />
        </FormField>
      </Form>

      <Drawer
        open={modelsOpen}
        onOpenChange={setModelsOpen}
        contentProps={{ className: 'h-[90vh]' }}
      >
        <ModelTable
          selectedIds={modelIds}
          onSelectedIdsChange={(modelIds) => {
            form.onFieldChange('modelIds', modelIds)
          }}
          selectable
        />
      </Drawer>
    </>
  )
}
