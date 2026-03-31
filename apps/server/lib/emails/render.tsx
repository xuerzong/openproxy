import VerifyEmail from './VerifyEmail'
import { render } from '@react-email/render'

type EmailName = 'Verify' | 'MagicLink'

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
