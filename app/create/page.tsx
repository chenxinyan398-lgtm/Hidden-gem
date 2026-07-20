import CreateForm from './CreateForm';

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;

  // 全方位搜尋帶入的網址 (可能為 ?url=..., ?text=..., 或是網址參數組合)
  let initialSharedUrl = '';

  const rawUrl = typeof params.url === 'string' ? params.url : '';
  const rawText = typeof params.text === 'string' ? params.text : '';

  if (rawUrl) {
    initialSharedUrl = rawUrl;
  } else if (rawText) {
    const match = rawText.match(/https?:\/\/[^\s]+/);
    if (match) {
      initialSharedUrl = match[0];
    } else {
      initialSharedUrl = rawText;
    }
  } else {
    // 檢查是否有任何含有 http/https 或 instagram 的參數值
    for (const key of Object.keys(params)) {
      const val = params[key];
      if (typeof val === 'string' && (val.includes('instagram.com') || val.startsWith('http'))) {
        initialSharedUrl = val;
        break;
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 p-6 pb-24">
      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">新增私房筆記</h1>
        <p className="text-sm text-zinc-400 mt-1">獨立主題手帳：私房景點與私房料理</p>
      </div>

      <CreateForm errorMessage={typeof params.error === 'string' ? params.error : undefined} initialSharedUrl={initialSharedUrl} />
    </div>
  );
}
