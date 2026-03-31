'use client'

import { logoutAction } from './actions'

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit">Sign out</button>
    </form>
  )
}
