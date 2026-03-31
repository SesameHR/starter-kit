declare module '@sesamehr/oauth-client' {
  interface SSOConfig {
    ssoBaseUrl: string
    clientId: string
    clientSecret: string
    redirectUri: string
  }

  interface LoginUrlResult {
    url: string
    state: string
  }

  interface TokenResult {
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    tokenType?: string
    userData?: Record<string, unknown>
    sesameCredentials?: Record<string, unknown>
  }

  interface LoginUrlOptions {
    scope?: string
    extraParams?: Record<string, string>
  }

  interface ExchangeOptions {
    includeUserInfo?: boolean
    includeSesameCredentials?: boolean
  }

  class SesameSSO {
    constructor(config: SSOConfig, options?: Record<string, unknown>)
    getLoginUrl(options?: LoginUrlOptions): LoginUrlResult
    exchangeCodeForToken(code: string, state: string, options?: ExchangeOptions): Promise<TokenResult>
    refreshToken(refreshToken: string): Promise<TokenResult>
    revokeToken(token: string, tokenType?: string): Promise<void>
    destroy(): void
  }

  export default SesameSSO
  export { SesameSSO }
}
