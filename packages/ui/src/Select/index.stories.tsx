import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Select } from './index'
import { GlobeIcon, ZapIcon, ShieldIcon } from 'lucide-react'

const meta = {
  title: 'Components/Select',
  component: Select,
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
    ],
    placeholder: 'Select a fruit',
    onChange: fn(),
  },
}

export const WithValue: Story = {
  args: {
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
    ],
    value: 'banana',
    onChange: fn(),
  },
}

export const WithIcons: Story = {
  args: {
    options: [
      {
        value: 'global',
        label: 'Global',
        icon: <GlobeIcon className="w-4 h-4" />,
      },
      { value: 'fast', label: 'Fast', icon: <ZapIcon className="w-4 h-4" /> },
      {
        value: 'secure',
        label: 'Secure',
        icon: <ShieldIcon className="w-4 h-4" />,
      },
    ],
    placeholder: 'Select a mode',
    onChange: fn(),
  },
}

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'active', label: 'Active' },
      { value: 'disabled', label: 'Disabled Option', disabled: true },
      { value: 'other', label: 'Other' },
    ],
    placeholder: 'Choose...',
    onChange: fn(),
  },
}

export const Disabled: Story = {
  args: {
    options: [{ value: 'apple', label: 'Apple' }],
    value: 'apple',
    disabled: true,
    onChange: fn(),
  },
}
