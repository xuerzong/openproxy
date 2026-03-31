import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Input, Textarea } from './index'
import { SearchIcon } from 'lucide-react'

const meta = {
  title: 'Components/Input',
  component: Input,
  argTypes: {
    status: {
      control: 'select',
      options: ['default', 'danger'],
    },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const DangerStatus: Story = {
  args: {
    placeholder: 'Error input',
    status: 'danger',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled',
    disabled: true,
  },
}

export const WithSuffix: Story = {
  args: {
    placeholder: 'Search...',
    suffix: <SearchIcon className="w-4 h-4 text-secondary" />,
  },
}

export const TextareaDefault: StoryObj<typeof Textarea> = {
  render: (args) => <Textarea {...args} />,
  args: {
    placeholder: 'Enter long text...',
  },
}
