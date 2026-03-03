// auth-types.d.ts
import 'better-auth'

declare module 'better-auth' {
  interface User {
    id: string
    createdAt: Date
    updatedAt: Date
    email: string
    emailVerified: boolean
    name: string
    image?: string | null | undefined
    phoneNumber?: string | null | undefined
    phoneNumberVerified?: boolean | null | undefined
  }
}
