import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Pagination } from './index'

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  argTypes: {
    total: { control: 'number' },
    current: { control: 'number' },
    pageSize: { control: 'number' },
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    total: 100,
    current: 1,
    pageSize: 10,
    onValueChange: fn(),
  },
}

export const ManyPages: Story = {
  args: {
    total: 500,
    current: 10,
    pageSize: 20,
    onValueChange: fn(),
  },
}

export const FewItems: Story = {
  args: {
    total: 15,
    current: 1,
    pageSize: 10,
    onValueChange: fn(),
  },
}
