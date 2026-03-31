import SesameSSO from '@sesamehr/oauth-client'

let sso: InstanceType<typeof SesameSSO> | null = null

export function getSSOClient() {
  if (!process.env.OAUTH_CLIENT_ID || !process.env.OAUTH_CLIENT_SECRET) {
    return null
  }

  if (!sso) {
    if (!process.env.OAUTH_REDIRECT_URI) {
      throw new Error(
        'OAUTH_REDIRECT_URI must be set when OAuth is enabled (OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET are set)',
      )
    }

    sso = new SesameSSO({
      ssoBaseUrl: process.env.SSO_BASE_URL || 'https://sso.sesametime.com',
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      redirectUri: process.env.OAUTH_REDIRECT_URI,
    })
  }

  return sso
}

/** Returns true if OAuth env vars are configured. */
export function isOAuthEnabled(): boolean {
  return !!(process.env.OAUTH_CLIENT_ID && process.env.OAUTH_CLIENT_SECRET)
}
