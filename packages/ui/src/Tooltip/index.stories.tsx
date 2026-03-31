import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip } from './index'
import { Button } from '../Button'

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button variant="outline">Hover me</Button>,
  },
}

export const LongContent: Story = {
  args: {
    content:
      'This is a tooltip with a longer description that wraps to multiple lines for demonstration purposes.',
    children: <Button variant="outline">Long tooltip</Button>,
  },
}
