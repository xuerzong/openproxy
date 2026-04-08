import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { RadioGroup } from './index'

const meta = {
  title: 'Components/Radio',
  component: RadioGroup,
  argTypes: {
    valueType: {
      control: 'select',
      options: ['string', 'number', 'boolean'],
    },
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    options: [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
      { label: 'Option C', value: 'c' },
    ],
    value: 'a',
    onChange: fn(),
  },
}

export const WithNumericValues: Story = {
  args: {
    options: [
      { label: 'One', value: '1' },
      { label: 'Two', value: '2' },
      { label: 'Three', value: '3' },
    ],
    value: '1',
    valueType: 'number',
    onChange: fn(),
  },
}
