import VerifyEmail from './VerifyEmail'
import { render } from '@react-email/render'

const emailNames = ['Verify', 'MagicLink'] as const

type EmailName = (typeof emailNames)[number]

interface EmailOptions {
  url: string
}

export const renderEmail = async (name: EmailName, options: EmailOptions) => {
  switch (name) {
    case 'Verify':
      return render(<VerifyEmail url={options.url} />)
    case 'MagicLink':
      return ''
    default:
      return ''
  }
}
