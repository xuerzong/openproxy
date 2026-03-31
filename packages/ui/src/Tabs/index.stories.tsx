import type { Meta, StoryObj } from '@storybook/react'
import { Tabs } from './index'
import { HomeIcon, SettingsIcon, UserIcon } from 'lucide-react'

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: 'tab1',
    items: [
      { key: 'tab1', label: 'General' },
      { key: 'tab2', label: 'Settings' },
      { key: 'tab3', label: 'Advanced' },
    ],
  },
}

export const WithIcons: Story = {
  args: {
    defaultValue: 'home',
    items: [
      { key: 'home', label: 'Home', icon: <HomeIcon /> },
      { key: 'profile', label: 'Profile', icon: <UserIcon /> },
      { key: 'settings', label: 'Settings', icon: <SettingsIcon /> },
    ],
  },
}
