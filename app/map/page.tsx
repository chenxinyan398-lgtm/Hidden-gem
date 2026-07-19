import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import MapView from './MapView';

export default async function MapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch my contents
  const { data: myContents } = await supabase
    .from('contents')
    .select(`
      *,
      users:user_id (
        username
      )
    `)
    .eq('user_id', user.id);

  // Fetch friends' contents
  const { data: grants } = await supabase
    .from('user_grants')
    .select('owner_user_id')
    .eq('grantee_user_id', user.id);

  const friendIds = grants?.map((g) => g.owner_user_id) || [];

  let friendsContents: any[] = [];
  if (friendIds.length > 0) {
    const { data } = await supabase
      .from('contents')
      .select(`
        *,
        users:user_id (
          username
        )
      `)
      .in('user_id', friendIds);
    friendsContents = data || [];
  }

  const allItems = [...(myContents || []), ...friendsContents];

  return <MapView items={allItems} />;
}
