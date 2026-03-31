import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Form, FormField, useForm } from './index'
import { Input } from '../Input'
import { Button } from '../Button'

const meta = {
  title: 'Components/Form',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const BasicFormExample = () => {
  const [form] = useForm({
    defaultValues: { name: '', email: '' },
  })

  return (
    <Form
      form={form}
      onSubmit={async (e) => {
        e.preventDefault()
        await form.onSubmit(() => {
          alert(JSON.stringify(form.values))
        })
      }}
    >
      <FormField label="Name" name="name" requiredMask>
        <Input placeholder="Enter your name" />
      </FormField>
      <FormField label="Email" name="email">
        <Input placeholder="Enter your email" type="email" />
      </FormField>
      <Button type="submit">Submit</Button>
    </Form>
  )
}

export const Default: Story = {
  render: () => <BasicFormExample />,
}

const FormWithErrorExample = () => {
  const [form] = useForm({
    defaultValues: { username: '' },
    validators: {
      username: async (value) => {
        if (!value) return { success: false, message: 'Username is required' }
        return { success: true }
      },
    },
  })

  return (
    <Form
      form={form}
      onSubmit={async (e) => {
        e.preventDefault()
        await form.onSubmit(() => {
          alert('Success!')
        })
      }}
    >
      <FormField label="Username" name="username" requiredMask>
        <Input placeholder="Enter username" />
      </FormField>
      <Button type="submit">Submit</Button>
    </Form>
  )
}

export const WithValidation: Story = {
  render: () => <FormWithErrorExample />,
}
