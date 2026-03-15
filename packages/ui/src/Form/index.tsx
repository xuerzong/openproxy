import React, {
  type FormHTMLAttributes,
  type LabelHTMLAttributes,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { CircleQuestionMarkIcon } from 'lucide-react'
import z from '@openproxy/schema/zod'
import { Slot } from 'radix-ui'
import { cn } from '../utils/cn'
import { Tooltip } from '../Tooltip'
import s from './index.module.scss'

type FormErrors = Record<string, string>

type FormValues = any

type FormFieldValidator = (
  formFieldValue: string,
  formValues: string
) => Promise<{ success: true } | { success: false; message: string }>

export const useForm = ({
  defaultValues,
  zodResolver,
  validators,
  errorRenderer,
}: {
  defaultValues?: FormValues
  validators?: Record<string, FormFieldValidator>
  zodResolver?: z.ZodObject<FormValues>
  errorRenderer?: (error: string) => string
}) => {
  const [errors, setErrors] = useState<FormErrors>({})
  const [values, setValues] = useState<FormValues>(defaultValues || {})

  const onFieldChange = useCallback(
    (pathname: string, value: any) => {
      setValues({ ...values, [pathname]: value })
    },
    [values]
  )

  const resetValues = useCallback(() => {
    setValues(defaultValues || {})
  }, [defaultValues])

  const setFieldError = useCallback(
    (pathname: string, message?: string) => {
      setErrors({
        ...errors,
        [pathname]: message
          ? errorRenderer
            ? errorRenderer(message)
            : message
          : '',
      })
    },
    [errors, errorRenderer]
  )

  const clearFieldError = useCallback(
    (pathname: string) => {
      setFieldError(pathname, '')
    },
    [setFieldError]
  )

  const getFieldError = useCallback(
    (pathname: string) => {
      return errors[pathname]
    },
    [errors]
  )

  const checkFields = useCallback(async () => {
    if (zodResolver) {
      const { success, error } = await zodResolver.safeParseAsync(values)
      if (error) {
        console.warn(error)
        const flattenError = z.flattenError(error).fieldErrors
        if (flattenError) {
          Object.keys(flattenError).forEach((key) => {
            const message = flattenError[key]?.[0]
            setErrors((pre) => ({
              ...pre,
              [key]: message
                ? errorRenderer
                  ? errorRenderer(message)
                  : message
                : '',
            }))
          })
        }
      } else {
        setErrors({})
      }

      return success
    }
    if (!validators) return true
    let success = true
    for (const fieldPath in validators) {
      const currentValidator = validators[fieldPath]
      const validResult = await currentValidator(values[fieldPath], values)
      if (!validResult.success) {
        const errorMessage = validResult.message
          ? errorRenderer
            ? errorRenderer(validResult.message)
            : validResult.message
          : ''
        if (errorMessage) {
          success = false
        }
        setErrors((pre) => ({
          ...pre,
          [fieldPath]: errorMessage,
        }))
        return
      }
      setErrors((pre) => ({
        ...pre,
        [fieldPath]: '',
      }))
    }

    return success
  }, [values, errorRenderer])

  const onSubmit = useCallback(
    async (callback: (values: FormValues) => void | Promise<void>) => {
      await checkFields()
        .then(async (success) => {
          if (!success) return
          return await callback(values)
        })
        .catch(console.warn)
    },
    [checkFields]
  )

  return [
    {
      errors,
      values,
      onFieldChange,
      setFieldError,
      clearFieldError,
      getFieldError,
      checkFields,
      onSubmit,
      resetValues,
      resetErrors: () => {
        setErrors({})
      },
      setValues,
    },
  ] as const
}

export type FormInstance = ReturnType<typeof useForm>[0]
interface FormContextState {
  form: FormInstance
}

const FormContext = React.createContext<FormContextState | null>(null)

export const useFormContext = () => {
  const context = React.useContext(FormContext)
  if (!context) {
    throw new Error('useFormContext must be used in <FormProvider />')
  }
  return context
}

interface FormProviderProps<FD extends Record<string, any> = {}> {
  defaultValues?: FD
  form: FormInstance
}

const FormProvider: React.FC<React.PropsWithChildren<FormProviderProps>> = ({
  children,
  form,
}) => {
  const value = useMemo(
    () => ({
      form,
    }),
    [form]
  )
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>
}

interface FormProps
  extends FormHTMLAttributes<HTMLFormElement>, FormProviderProps {}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ defaultValues, form, ...restProps }, ref) => {
    return (
      <FormProvider form={form} defaultValues={defaultValues}>
        <FormRoot ref={ref} {...restProps} />
      </FormProvider>
    )
  }
)

const FormRoot = React.forwardRef<
  HTMLFormElement,
  FormHTMLAttributes<HTMLFormElement>
>(({ action, ...restProps }, ref) => {
  const { form } = useFormContext()
  const rewritedAction = useMemo(() => {
    if (typeof action === 'string') return action
  }, [action])
  return <form ref={ref} action={rewritedAction} {...restProps} />
})

interface FormFieldProps {
  label: React.ReactNode
  help?: string
  name: string
  children: React.ReactNode
  hidden?: boolean
  requiredMask?: boolean
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  help,
  requiredMask,
  name,
  children,
  hidden = false,
}) => {
  const { form } = useFormContext()
  const error = form.getFieldError(name)
  const value = form.values[name]
  return (
    <fieldset
      data-status={Boolean(error) ? 'error' : 'normal'}
      className={cn('FormField', s.FormField)}
      hidden={hidden}
    >
      <FormLabel htmlFor={name} requiredMask={requiredMask} help={help}>
        {label}
      </FormLabel>
      <Slot.Root
        {...({ name, value } as any)}
        status={Boolean(error) ? 'danger' : 'default'}
        onChange={(e) => {
          if (e && typeof e === 'object' && 'target' in e) {
            const target = e.target as any
            const value =
              target.type === 'checkbox' || target.type === 'radio'
                ? target.checked
                : target.value
            form.onFieldChange(name, value)
          } else {
            form.onFieldChange(name, e)
          }
        }}
      >
        {children}
      </Slot.Root>
      {error && <div className={cn('FormError', s.FormError)}>{error}</div>}
    </fieldset>
  )
}

interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  help?: string
  requiredMask?: boolean
}

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  help,
  requiredMask,
  ...restProps
}) => {
  return (
    <label
      className={cn('FormLabel', s.FormLabel, 'inline-flex items-center gap-1')}
      {...restProps}
    >
      {requiredMask && <span className="text-danger">*</span>}
      {children}
      {help && (
        <Tooltip content={help}>
          <CircleQuestionMarkIcon className="w-3 h-3 cursor-pointer" />
        </Tooltip>
      )}
    </label>
  )
}
