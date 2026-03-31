import type { Meta, StoryObj } from '@storybook/react'
import { Loader } from './index'

const meta = {
  title: 'Components/Loader',
  component: Loader,
  argTypes: {
    className: { control: 'text' },
  },
} satisfies Meta<typeof Loader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Large: Story = {
  args: {
    className: 'w-10 h-10',
  },
}

export const Colored: Story = {
  args: {
    className: 'w-8 h-8 text-primary',
  },
}
