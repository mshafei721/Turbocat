import { AuthPage } from '@/components/turbocat/AuthPage'

export const metadata = {
  title: 'Sign Up - Turbocat',
  description: 'Create your Turbocat account and start building apps with AI',
}

export default function SignUpPage() {
  return <AuthPage mode="signup" />
}
