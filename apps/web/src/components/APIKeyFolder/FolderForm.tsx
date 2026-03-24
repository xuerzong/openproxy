import { Form, FormField, type FormInstance } from '@openproxy/ui/Form'
import { Input } from '@openproxy/ui/Input'
import { Switch } from '@openproxy/ui/Switch'
import { useTranslation } from 'react-i18next'

interface FolderFormProps {
  form: FormInstance
}

export const FolderForm: React.FC<FolderFormProps> = ({ form }) => {
  const { t } = useTranslation('common')

  return (
    <Form form={form}>
      <FormField name="name" label={t('folders.nameLabel')}>
        <Input placeholder={t('folders.namePlaceholder')} maxLength={32} />
      </FormField>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{t('folders.setDefault')}</label>
        <Switch
          checked={form.values.isDefault ?? false}
          onCheckedChange={(v) => form.onFieldChange('isDefault', v)}
        />
      </div>
    </Form>
  )
}
