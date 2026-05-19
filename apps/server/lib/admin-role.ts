const normalizeEmail = (email: string) => email.trim().toLowerCase()

const parseAdminEmails = (value?: string) => {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean)
}

export const getConfiguredAdminEmails = (
  configuredEmails = process.env.ADMIN_EMAILS
) => parseAdminEmails(configuredEmails)

export const isConfiguredAdminEmail = (
  email: string,
  configuredEmails = process.env.ADMIN_EMAILS
) => {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return false
  }

  return getConfiguredAdminEmails(configuredEmails).includes(normalizedEmail)
}