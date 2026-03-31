import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './index'

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  argTypes: {
    src: { control: 'text' },
    className: { control: 'text' },
    iconClassName: { control: 'text' },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=3',
  },
}

export const CustomSize: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=5',
    className: 'w-16 h-16',
  },
}

export const Fallback: Story = {
  args: {
    src: null,
  },
}
