import CreateForm from './CreateForm';

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; url?: string; text?: string; title?: string }>
}) {
  const params = await searchParams;

  // 嘗試從分享參數中尋找 IG 連結 (可能在 url 或 text 欄位中)
  let initialSharedUrl = params?.url || '';
  if (!initialSharedUrl && params?.text) {
    const match = params.text.match(/https?:\/\/[^\s]+/);
    if (match) {
      initialSharedUrl = match[0];
    }
  }

  return (
    <div className="flex flex-col flex-1 p-6 pb-24">
      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">新增私房筆記</h1>
        <p className="text-sm text-zinc-400 mt-1">獨立主題手帳：私房景點與私房料理</p>
      </div>

      <CreateForm errorMessage={params?.error} initialSharedUrl={initialSharedUrl} />
    </div>
  );
}
