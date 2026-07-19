'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteContent(contentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Delete only if user is the owner
  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('id', contentId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete content error:', error);
    redirect(`/content/${contentId}?error=` + encodeURIComponent('刪除失敗'));
  }

  revalidatePath('/');
  revalidatePath('/map');
  redirect('/?tab=my&deleted=1');
}

export async function updateContent(contentId: string, formData: FormData) {
  const title = formData.get('title') as string;
  const body = (formData.get('content') as string) || '';
  
  const address = formData.get('address') as string || null;
  const latStr = formData.get('latitude') as string;
  const lngStr = formData.get('longitude') as string;
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;
  const photos = formData.getAll('photos').filter(Boolean) as string[];
  const recommendation = formData.get('recommendation') as string || null;

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

        // 使用 Google Maps API
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`, {
          headers: {
            'Referer': currentReferer
          }
        });
        const data = await res.json();
        if (data.status === 'OK' && data.results.length > 0) {
          finalLat = data.results[0].geometry.location.lat;
          finalLng = data.results[0].geometry.location.lng;
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
        }
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  }

  const updatePayload: any = {
    title,
    body,
    address,
    latitude: finalLat !== null && !isNaN(finalLat) ? finalLat : null,
    longitude: finalLng !== null && !isNaN(finalLng) ? finalLng : null,
    photos,
    recommendation,
    booking_url,
    recommended_dishes,
    price_range,
    dining_review,
    is_private,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('contents')
    .update(updatePayload)
    .eq('id', contentId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Update content error:', error);
    redirect(`/content/${contentId}/edit?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/content/${contentId}`);
  revalidatePath('/');
  revalidatePath('/map');
  redirect(`/content/${contentId}?message=` + encodeURIComponent('手帳內容已更新！'));
}

export async function addComment(contentId: string, formData: FormData) {
  const commentText = formData.get('comment') as string;
  if (!commentText || !commentText.trim()) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  await supabase.from('comments').insert({
    content_id: contentId,
    user_id: user.id,
    comment_text: commentText.trim(),
  });

  revalidatePath(`/content/${contentId}`);
}

export async function toggleBookmark(contentId: string, isBookmarked: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  if (isBookmarked) {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('content_id', contentId)
      .eq('user_id', user.id);
  } else {
    await supabase.from('bookmarks').insert({
      content_id: contentId,
      user_id: user.id,
    });
  }

  revalidatePath(`/content/${contentId}`);
  revalidatePath('/');
}

export async function generateShareToken(contentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // token is just a random UUID
  const token = crypto.randomUUID();
  // 15 minutes from now
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Create an invitation row basically
  const { error } = await supabase.from('access_grants').insert({
    content_id: contentId,
    access_token: token,
    expires_at: expiresAt,
  });

  if (error) {
    console.error('generateShareToken error:', error);
    return null;
  }

  return token;
}
