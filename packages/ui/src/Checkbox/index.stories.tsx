import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Checkbox, CheckboxGroup } from './index'

const checkboxMeta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  argTypes: {
    label: { control: 'text' },
    checked: {
      control: 'select',
      options: [true, false, 'indeterminate'],
    },
  },
} satisfies Meta<typeof Checkbox>

export default checkboxMeta
type Story = StoryObj<typeof checkboxMeta>

export const Default: Story = {
  args: {
    label: 'Accept terms',
  },
}

export const Checked: Story = {
  args: {
    label: 'Checked',
    checked: true,
  },
}

export const Indeterminate: Story = {
  args: {
    label: 'Indeterminate',
    checked: 'indeterminate',
  },
}

export const Group: StoryObj<typeof CheckboxGroup> = {
  render: (args) => <CheckboxGroup {...args} />,
  args: {
    options: [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' },
    ],
    value: ['apple'],
    onChange: fn(),
  },
}
