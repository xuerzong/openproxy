import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Switch } from './index'

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onCheckedChange: fn(),
  },
}

export const Checked: Story = {
  args: {
    checked: true,
    onCheckedChange: fn(),
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    onCheckedChange: fn(),
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    onCheckedChange: fn(),
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    onCheckedChange: fn(),
  },
}
