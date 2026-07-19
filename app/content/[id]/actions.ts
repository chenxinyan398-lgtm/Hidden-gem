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

  const updatePayload: any = {
    title,
    body,
    address,
    latitude: latitude !== null && !isNaN(latitude) ? latitude : null,
    longitude: longitude !== null && !isNaN(longitude) ? longitude : null,
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
