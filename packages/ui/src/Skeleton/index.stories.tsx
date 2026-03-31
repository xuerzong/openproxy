import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './index'

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  argTypes: {
    loading: { control: 'boolean' },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    className: 'h-4 w-48',
    loading: true,
  },
}

export const Circle: Story = {
  args: {
    className: 'h-12 w-12 rounded-full',
    loading: true,
  },
}

export const Card: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  ),
}

export const Hidden: Story = {
  args: {
    className: 'h-4 w-48',
    loading: false,
  },
}
