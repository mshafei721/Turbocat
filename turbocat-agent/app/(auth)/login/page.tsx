import { AuthPage } from '@/components/turbocat/AuthPage'

export const metadata = {
  title: 'Sign In - Turbocat',
  description: 'Sign in to your Turbocat account',
}

export default function LoginPage() {
  return <AuthPage mode="login" />
}
