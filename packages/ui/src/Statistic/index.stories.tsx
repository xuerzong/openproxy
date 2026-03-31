import type { Meta, StoryObj } from '@storybook/react'
import { Statistic } from './index'

const meta = {
  title: 'Components/Statistic',
  component: Statistic,
  argTypes: {
    title: { control: 'text' },
    value: { control: 'text' },
  },
} satisfies Meta<typeof Statistic>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Total Users',
    value: 1234,
  },
}

export const Currency: Story = {
  args: {
    title: 'Revenue',
    value: 56789,
    format: { style: 'currency', currency: 'USD' },
  },
}

export const StringValue: Story = {
  args: {
    title: 'Status',
    value: 'Active',
  },
}

export const LargeNumber: Story = {
  args: {
    title: 'API Calls',
    value: 1234567,
  },
}
