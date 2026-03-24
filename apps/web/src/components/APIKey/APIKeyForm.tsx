import { useState } from 'react'
import { BoxesIcon, FolderPlusIcon } from 'lucide-react'
import { ModelTable } from '../Model/ModelTable'
import { Drawer } from '@openproxy/ui/Drawer'
import { Form, FormField, type FormInstance } from '@openproxy/ui/Form'
import { Input } from '@openproxy/ui/Input'
import { NumberInput } from '@openproxy/ui/NumberInput'
import { Select } from '@openproxy/ui/Select'
import { Button } from '@openproxy/ui/Button'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useApiKeyFoldersQuery } from '@/apps/tenant/hooks/queries/useApiKeyFoldersQuery'

interface APIKeyFormProps {
  form: FormInstance
}

export const APIKeyForm: React.FC<APIKeyFormProps> = ({ form }) => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [modelsOpen, setModelsOpen] = useState(false)
  const modelIds = form.values.modelIds || []
  const foldersQuery = useApiKeyFoldersQuery()
  const hasFolders = (foldersQuery.data || []).length > 0
  const folderOptions = (foldersQuery.data || []).map((f: any) => ({
    value: f.id,
    label: f.isDefault ? `${f.name} (${t('folders.default')})` : f.name,
  }))
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

        <FormField name="folderId" label={t('apiKeys.folder')}>
          {hasFolders ? (
            <Select
              placeholder={t('common.selectPlaceholder')}
              options={[
                { value: '', label: t('apiKeys.noFolder') },
                ...folderOptions,
              ]}
            />
          ) : (
            <Button
              variant="outline"
              type="button"
              className="w-full justify-start text-muted-foreground"
              onClick={() => navigate('/folders')}
            >
              <FolderPlusIcon className="w-4 h-4" />
              {t('apiKeys.createFolderFirst')}
            </Button>
          )}
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
