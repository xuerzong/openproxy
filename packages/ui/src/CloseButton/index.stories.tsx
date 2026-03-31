import type { Meta, StoryObj } from '@storybook/react'
import { CloseButton } from './index'

const meta = {
  title: 'Components/CloseButton',
  component: CloseButton,
  argTypes: {
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof CloseButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}
