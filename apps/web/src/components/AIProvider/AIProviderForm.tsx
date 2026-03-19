import { Form, FormField, type FormInstance } from '@openproxy/ui/Form'
import { Input, Textarea } from '@openproxy/ui/Input'
import { useTranslation } from 'react-i18next'
import { Select } from '@openproxy/ui/Select'
import { ICON_SVG_MAP } from '@/constants/icons'
import { ModelIcon } from '../ModelIcon'

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
      <FormField name="icon" label={t('common.icon', { defaultValue: 'Icon' })}>
        <Select
          options={Object.keys(ICON_SVG_MAP).map((key) => ({
            label: key,
            value: key,
            icon: <ModelIcon model={key} />,
          }))}
          placeholder={t('common.selectPlaceholder', {
            defaultValue: 'Please select',
          })}
        />
      </FormField>
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

      {!isEdit && (
        <FormField
          name="apiKeysText"
          label={t('aiProviders.apiKeys', { defaultValue: 'API Keys' })}
          help={t('aiProviders.apiKeysHelp', {
            defaultValue: 'Enter one API key per line',
          })}
        >
          <Textarea
            placeholder={t('aiProviders.apiKeysPlaceholder', {
              defaultValue: 'sk-xxx\nsk-yyy',
            })}
          />
        </FormField>
      )}
    </Form>
  )
}
