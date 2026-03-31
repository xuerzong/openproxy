import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { DropdownMenu } from './index'
import { Button } from '../Button'
import { Trash2Icon, CopyIcon, PencilIcon } from 'lucide-react'

const meta = {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    menus: [
      {
        type: 'item',
        key: 'edit',
        label: 'Edit',
        icon: <PencilIcon />,
        onClick: fn(),
      },
      {
        type: 'item',
        key: 'copy',
        label: 'Copy',
        icon: <CopyIcon />,
        onClick: fn(),
      },
      { type: 'separator' },
      {
        type: 'item',
        key: 'delete',
        label: 'Delete',
        icon: <Trash2Icon />,
        color: 'danger',
        onClick: fn(),
      },
    ],
    children: <Button variant="outline">Actions</Button>,
  },
}

export const WithDisabledItem: Story = {
  args: {
    menus: [
      { type: 'item', key: 'edit', label: 'Edit', onClick: fn() },
      {
        type: 'item',
        key: 'copy',
        label: 'Copy',
        onClick: fn(),
        disabled: true,
      },
      { type: 'separator' },
      {
        type: 'item',
        key: 'delete',
        label: 'Delete',
        color: 'danger',
        onClick: fn(),
      },
    ],
    children: <Button variant="outline">Actions</Button>,
  },
}
