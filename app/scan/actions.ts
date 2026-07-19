'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function grantAccessAndRedirect(targetId: string, isFullUser: boolean = false, isToken: boolean = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  if (isFullUser) {
    // Grant full user notebook access (user_grants)
    if (targetId !== user.id) {
      await supabase
        .from('user_grants')
        .insert({
          owner_user_id: targetId,
          grantee_user_id: user.id,
        });
    }
    redirect('/?tab=friends&success=1');
  } else if (isToken) {
    // We are redeeming a token
    const { data: grant, error } = await supabase
      .from('access_grants')
      .select('*')
      .eq('access_token', targetId)
      .single();

    if (error || !grant) {
      throw new Error('無效的解鎖連結');
    }

    if (grant.expires_at && new Date(grant.expires_at).getTime() < Date.now()) {
      throw new Error('該解鎖 QR Code 已過期（時效15分鐘）');
    }

    if (grant.grantee_user_id) {
      if (grant.grantee_user_id !== user.id) {
         throw new Error('此解鎖 QR Code 已被其他人使用過了');
      }
      // If it's already them, just redirect
      redirect(`/content/${grant.content_id}`);
    }

    // Claim the token
    await supabase
      .from('access_grants')
      .update({ grantee_user_id: user.id })
      .eq('id', grant.id);

    redirect(`/content/${grant.content_id}`);
  } else {
    // Legacy support for direct content ID 
    await supabase
      .from('access_grants')
      .insert({
        content_id: targetId,
        grantee_user_id: user.id,
        access_token: `${targetId}_${user.id}_${Date.now()}`, // Add timestamp to avoid unique constraint
      });
    redirect(`/content/${targetId}`);
  }
}
