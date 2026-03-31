import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Dialog, DialogFooter } from './index'
import { Button } from '../Button'

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    width: { control: 'number' },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog {...args} open={open} onOpenChange={setOpen}>
          <p>This is the dialog content.</p>
        </Dialog>
      </>
    )
  },
  args: {
    title: 'Dialog Title',
    description: 'This is a description of the dialog.',
  },
}

export const WithFooter: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          footer={
            <DialogFooter
              okText="Confirm"
              cancelText="Cancel"
              onOk={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          }
        >
          <p>Are you sure you want to proceed?</p>
        </Dialog>
      </>
    )
  },
  args: {
    title: 'Confirmation',
  },
}

export const CustomWidth: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Wide Dialog</Button>
        <Dialog {...args} open={open} onOpenChange={setOpen}>
          <p>This dialog has a custom width.</p>
        </Dialog>
      </>
    )
  },
  args: {
    title: 'Wide Dialog',
    width: 800,
  },
}
