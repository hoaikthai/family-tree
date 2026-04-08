import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) throw redirect({ to: '/dashboard' })
  },
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const action = mode === 'signin' ? signIn : signUp
    const { error } = await action(email, password)
    setIsSubmitting(false)
    if (error) { setError(error.message); return }
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold text-center">
          {mode === 'signin' ? t('login.signIn') : t('login.createAccount')}
        </h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Input
          type="email" placeholder={t('login.email')} value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          type="password" placeholder={t('login.password')} value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t('login.pleaseWait') : mode === 'signin' ? t('login.signIn') : t('login.signUp')}
        </Button>
        <Button
          type="button"
          variant="link"
          disabled={isSubmitting}
          className="text-sm"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? t('login.noAccount') : t('login.haveAccount')}
        </Button>
      </form>
    </div>
  )
}
