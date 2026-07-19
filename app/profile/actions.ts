'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const username = formData.get('username') as string

  const { error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      username: username,
    })

  if (error) {
    redirect('/profile?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/profile')
  redirect('/profile?message=' + encodeURIComponent('個人資料已更新！'))
}

export async function revokeUserGrant(grantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { error } = await supabase
    .from('user_grants')
    .delete()
    .eq('id', grantId);

  if (error) {
    console.error('Revoke grant error:', error);
    redirect('/profile?error=' + encodeURIComponent('撤銷授權失敗'));
  }

  revalidatePath('/profile')
  revalidatePath('/')
  redirect('/profile?message=' + encodeURIComponent('已成功撤銷授權！'))
}

export async function seedTestData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Ensure user exists in public.users to prevent foreign key violation
  await supabase.from('users').upsert({
    id: user.id,
    username: user.email?.split('@')[0] || '使用者',
  }, { onConflict: 'id' });

  const demoItems = [
    {
      user_id: user.id,
      title: '陽明山夢幻湖秘境',
      type: 'SPOT',
      body: '夢幻湖位於陽明山國家公園內，雨季時水面宛如鏡面反照天空，空氣清新。',
      address: '台北市士林區竹子湖路',
      latitude: 25.166,
      longitude: 121.561,
      photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'],
      recommendation: '清晨霧氣繚繞時最美，建議穿著防水鞋與防風外衣。',
      is_locked: true,
    },
    {
      user_id: user.id,
      title: '隱爵士深夜 Bistro',
      type: 'DISH',
      body: '位於東區巷弄內的暗門餐酒館，爵士樂曲與職人特調，適合深宵小酌。',
      address: '台北市大安區敦化南路一段',
      latitude: 25.041,
      longitude: 121.548,
      booking_url: 'https://inline.app/booking/demo',
      recommended_dishes: '海膽干貝燉飯、招牌黑松露提拉米蘇、煙燻獵人排骨',
      price_range: 'NT$ 800 - 1200 / 人',
      dining_review: '氣氛極佳適合約會，暗門開關非常驚豔！建議提早 3 天訂位。',
      photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'],
      is_locked: true,
    },
  ];

  let seedError: string | null = null;

  for (const item of demoItems) {
    const { error } = await supabase.from('contents').insert(item as any);
    if (error) {
      console.error('Seed full item error:', error.message);
      // Fallback: insert basic fields with type 'LIST' if schema columns or 'SPOT'/'DISH' type check haven't been updated in Supabase DB yet
      const basicItem = {
        user_id: item.user_id,
        title: item.title,
        type: 'LIST',
        body: `【${item.title}】\n${item.body}\n\n📍 地點：${item.address}\n⭐ 評價建議：${item.recommendation || item.dining_review || item.recommended_dishes || ''}`,
        is_locked: item.is_locked,
      };
      const { error: basicError } = await supabase.from('contents').insert(basicItem);
      if (basicError) {
        seedError = basicError.message;
      }
    }
  }

  revalidatePath('/');
  revalidatePath('/map');

  if (seedError) {
    redirect('/profile?error=' + encodeURIComponent('匯入失敗：' + seedError));
  }

  redirect('/?message=' + encodeURIComponent('🎉 已為您成功匯入 2 筆實測手帳展示資料！'));
}
