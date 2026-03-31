import type { Meta, StoryObj } from '@storybook/react'
import { Tag } from './index'

const meta = {
  title: 'Components/Tag',
  component: Tag,
  argTypes: {
    color: {
      control: 'select',
      options: ['default', 'gray', 'yellow', 'green'],
    },
  },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default',
  },
}

export const Gray: Story = {
  args: {
    children: 'Gray',
    color: 'gray',
  },
}

export const Yellow: Story = {
  args: {
    children: 'Warning',
    color: 'yellow',
  },
}

export const Green: Story = {
  args: {
    children: 'Success',
    color: 'green',
  },
}

export const AllColors: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Tag color="default">Default</Tag>
      <Tag color="gray">Gray</Tag>
      <Tag color="yellow">Yellow</Tag>
      <Tag color="green">Green</Tag>
    </div>
  ),
}
