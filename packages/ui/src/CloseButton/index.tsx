import { XIcon } from 'lucide-react'
import { Button, type ButtonProps } from '../Button'

export const CloseButton: React.FC<ButtonProps> = (props) => {
  return (
    <Button size="icon" variant="ghost" {...props}>
      <XIcon />
    </Button>
  )
}
