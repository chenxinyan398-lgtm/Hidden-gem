import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import EditForm from './EditForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function EditContentPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: content, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !content || content.user_id !== user.id) {
    redirect('/');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 text-emerald-400">
        <Link href={`/content/${params.id}`} className="hover:text-emerald-300 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold text-white">編輯私房筆記</h1>
      </div>
      <EditForm content={content} />
    </div>
  );
}
