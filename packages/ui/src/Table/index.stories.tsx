import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Table } from './index'

interface User {
  id: string
  name: string
  email: string
  role: string
}

const sampleData: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'User' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'User' },
  { id: '4', name: 'Diana', email: 'diana@example.com', role: 'Moderator' },
]

const meta = {
  title: 'Components/Table',
  component: Table,
  argTypes: {
    loading: { control: 'boolean' },
    selectable: { control: 'boolean' },
  },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    rowKey: (record) => record.id,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
    ],
    data: sampleData,
  },
}

export const WithCustomRender: Story = {
  args: {
    rowKey: (record) => record.id,
    columns: [
      { key: 'name', label: 'Name', width: 120 },
      { key: 'email', label: 'Email' },
      {
        key: 'role',
        label: 'Role',
        render: (value: string) => (
          <span
            className={`px-2 py-0.5 rounded text-xs ${value === 'Admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-secondary'}`}
          >
            {value}
          </span>
        ),
      },
    ],
    data: sampleData,
  },
}

export const Selectable: Story = {
  args: {
    rowKey: (record) => record.id,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
    ],
    data: sampleData,
    selectable: true,
    selectedRowKeys: ['1'],
    onSelectedRowKeysChange: fn(),
  },
}

export const Loading: Story = {
  args: {
    rowKey: (record) => record.id,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
    ],
    data: [],
    loading: true,
  },
}

export const Empty: Story = {
  args: {
    rowKey: (record) => record.id,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
    ],
    data: [],
  },
}
