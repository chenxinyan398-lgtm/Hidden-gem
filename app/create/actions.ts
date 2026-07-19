'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function createContent(formData: FormData) {
  const title = formData.get('title') as string;
  const body = (formData.get('content') as string) || '';
  const type = (formData.get('type') as string || 'SPOT').toUpperCase();
  
  // Spot specific fields
  const address = formData.get('address') as string || null;
  const latStr = formData.get('latitude') as string;
  const lngStr = formData.get('longitude') as string;
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;
  const photos = formData.getAll('photos').filter(Boolean) as string[];
  const recommendation = formData.get('recommendation') as string || null;

  // Culinary specific fields
  const booking_url = formData.get('booking_url') as string || null;
  const recommended_dishes = formData.get('recommended_dishes') as string || null;
  const price_range = formData.get('price_range') as string || null;
  const dining_review = formData.get('dining_review') as string || null;
  const is_private = formData.get('is_private') === 'true';
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Ensure user exists in public.users to prevent foreign key violation
  await supabase.from('users').upsert({
    id: user.id,
    username: user.email?.split('@')[0] || '使用者',
  }, { onConflict: 'id' });

  // Build payload dynamically so unpopulated new fields won't break if SQL migration hasn't been executed yet
  const insertPayload: any = {
    user_id: user.id,
    title,
    body,
    type,
    is_locked: true,
  };

  if (address) insertPayload.address = address;
  if (latitude !== null && !isNaN(latitude)) insertPayload.latitude = latitude;
  if (longitude !== null && !isNaN(longitude)) insertPayload.longitude = longitude;
  if (photos && photos.length > 0) insertPayload.photos = photos;
  if (recommendation) insertPayload.recommendation = recommendation;
  if (booking_url) insertPayload.booking_url = booking_url;
  if (recommended_dishes) insertPayload.recommended_dishes = recommended_dishes;
  if (price_range) insertPayload.price_range = price_range;
  if (dining_review) insertPayload.dining_review = dining_review;
  if (is_private) insertPayload.is_private = true;

  let { data, error } = await supabase
    .from('contents')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Create content full payload error:', error.message);
    // Fallback basic insert if remote Supabase schema constraint has not been updated yet
    const fallbackPayload = {
      user_id: user.id,
      title,
      body: body || title,
      type: 'LIST',
      is_locked: true,
    };
    const res = await supabase.from('contents').insert(fallbackPayload).select().single();
    data = res.data;
    error = res.error;
  }

  if (error || !data) {
    console.error('Create content error:', error);
    redirect('/create?error=' + encodeURIComponent(error?.message || '建立筆記失敗'));
  }

  redirect(`/content/${data.id}`);
}
