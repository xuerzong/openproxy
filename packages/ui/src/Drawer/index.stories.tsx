import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Drawer } from './index'
import { Button } from '../Button'

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Drawer</Button>
        <Drawer open={open} onOpenChange={setOpen}>
          <div className="p-4">
            <p>This is the drawer content.</p>
          </div>
        </Drawer>
      </>
    )
  },
}
