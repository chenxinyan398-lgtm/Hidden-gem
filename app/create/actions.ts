'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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
  let finalLat = latitude;
  let finalLng = longitude;

  // 嘗試自動進行地址轉座標
  if ((finalLat === null || finalLng === null || isNaN(finalLat) || isNaN(finalLng)) && address) {
    try {
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      
      if (googleApiKey) {
        // 動態取得目前的網域 (解決 localhost 與 Vercel 部署環境差異)
        const headersList = await import('next/headers').then(m => m.headers());
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const currentReferer = `${protocol}://${host}/`;

        // 使用 Google Maps API (加上動態 Referer 避免被金鑰的網站限制擋下)
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`, {
          headers: {
            'Referer': currentReferer
          }
        });
        const data = await res.json();
        if (data.status === 'OK' && data.results.length > 0) {
          finalLat = data.results[0].geometry.location.lat;
          finalLng = data.results[0].geometry.location.lng;
          console.log('Geocoded address (Google):', address, 'to', finalLat, finalLng);
        } else {
          console.error('Google Maps Geocoding failed:', data.status);
        }
      } else {
        // 備案：使用免費的 OpenStreetMap (Nominatim)
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
          headers: { 'User-Agent': 'HiddenGemApp/1.0' }
        });
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          finalLat = parseFloat(geoData[0].lat);
          finalLng = parseFloat(geoData[0].lon);
          console.log('Geocoded address (OSM):', address, 'to', finalLat, finalLng);
        }
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  }

  const insertPayload: any = {
    user_id: user.id,
    title,
    body,
    type,
    is_locked: true,
  };

  if (address) insertPayload.address = address;
  if (finalLat !== null && !isNaN(finalLat)) insertPayload.latitude = finalLat;
  if (finalLng !== null && !isNaN(finalLng)) insertPayload.longitude = finalLng;
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

  revalidatePath('/map');
  revalidatePath('/');
  redirect(`/content/${data.id}`);
}
