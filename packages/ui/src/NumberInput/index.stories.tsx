import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { NumberInput } from './index'

const meta = {
  title: 'Components/NumberInput',
  component: NumberInput,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    status: {
      control: 'select',
      options: ['default', 'danger'],
    },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    precision: { control: 'number' },
  },
} satisfies Meta<typeof NumberInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 0,
    onChange: fn(),
  },
}

export const WithRange: Story = {
  args: {
    value: 50,
    min: 0,
    max: 100,
    onChange: fn(),
  },
}

export const Decimal: Story = {
  args: {
    value: 3.14,
    precision: 2,
    step: 0.01,
    onChange: fn(),
  },
}

export const Small: Story = {
  args: {
    value: 10,
    size: 'sm',
    onChange: fn(),
  },
}

export const DangerStatus: Story = {
  args: {
    value: 0,
    status: 'danger',
    onChange: fn(),
  },
}

export const Disabled: Story = {
  args: {
    value: 42,
    disabled: true,
    onChange: fn(),
  },
}
