import type { Meta, StoryObj } from '@storybook/react'
import { DatePicker } from './index'
import { fn } from '@storybook/test'

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    status: {
      control: 'select',
      options: ['default', 'danger'],
    },
    allowClear: { control: 'boolean' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onChange: fn(),
  },
}

export const WithValue: Story = {
  args: {
    value: '2026-03-31T12:00',
    onChange: fn(),
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    onChange: fn(),
  },
}

export const DangerStatus: Story = {
  args: {
    status: 'danger',
    onChange: fn(),
  },
}

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Select a date...',
    onChange: fn(),
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: '2026-03-31T12:00',
    onChange: fn(),
  },
}
