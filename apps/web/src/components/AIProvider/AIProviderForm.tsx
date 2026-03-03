import { Form, FormField, useForm, type FormInstance } from '../ui/Form'
import { Input } from '../ui/Input'
import { useTranslation } from 'react-i18next'

interface AIProviderFormProps {
  form: FormInstance
  isEdit?: boolean
}

export const AIProviderForm: React.FC<AIProviderFormProps> = ({
  form,
  isEdit = false,
}) => {
  const { t } = useTranslation('common')
  return (
    <Form form={form}>
      <FormField name="name" label={t('common.name', { defaultValue: 'Name' })}>
        <Input
          placeholder={t('common.pleaseInput', {
            defaultValue: 'Please input',
          })}
        />
      </FormField>

      <FormField
        name="baseUrl"
        label={t('common.baseUrl', { defaultValue: 'Base URL' })}
      >
        <Input
          placeholder={t('common.pleaseInput', {
            defaultValue: 'Please input',
          })}
        />
      </FormField>

      <FormField
        name="apiKey"
        label={t('common.apiKey', { defaultValue: 'API Key' })}
      >
        <Input
          placeholder={t('common.pleaseInput', {
            defaultValue: 'Please input',
          })}
          disabled={isEdit}
        />
      </FormField>
    </Form>
  )
}
