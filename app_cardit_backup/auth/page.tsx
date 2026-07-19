import { login, signup } from './actions'

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <div className="w-full text-center mb-10 mt-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">SecretSpace</h1>
        <p className="text-zinc-400 text-sm">你的數位私密名片與交換日記</p>
      </div>

      <form className="flex-1 flex flex-col w-full gap-4 text-zinc-300">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium pl-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium pl-1">密碼</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
            placeholder="••••••••"
          />
        </div>

        {params?.error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mt-2 text-center">
            {params.error}
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <button
            formAction={login}
            className="w-full bg-zinc-100 text-zinc-950 font-semibold py-3 rounded-xl hover:bg-white transition-colors"
          >
            登入
          </button>
          <button
            formAction={signup}
            className="w-full bg-transparent border border-zinc-800 text-zinc-300 font-semibold py-3 rounded-xl hover:bg-zinc-900 transition-colors"
          >
            註冊新帳號
          </button>
        </div>
      </form>
    </div>
  )
}
