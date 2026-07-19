'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/auth?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/auth?error=' + encodeURIComponent(error.message))
  }

  if (authData.user && !authData.session) {
    redirect('/auth?message=' + encodeURIComponent('註冊成功！請至 Email 收取驗證信完成開通（或可於 Supabase 後台關閉 Confirm email 直接登入）'))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
