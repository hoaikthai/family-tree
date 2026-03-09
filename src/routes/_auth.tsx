import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw redirect({ to: '/login' })
  },
  component: () => <Outlet />,
})
