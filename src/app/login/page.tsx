import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-[#111111] text-white p-12">
        <div className="font-extrabold tracking-wide text-sm">PRIME UM ASCEND</div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight max-w-xs">From Agent → Leader → UM</h1>
          <p className="mt-4 text-zinc-300">Build People. Build Business. Build Leaders.</p>
        </div>
        <div className="text-xs text-zinc-500">Demo cohort — data is fictional</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form action={loginAction} className="w-full max-w-sm flex flex-col gap-4">
          <h2 className="text-xl font-semibold">เข้าสู่ระบบ</h2>
          {error && <p className="text-sm text-red-600">อีเมลหรือรหัสผ่านไม่ถูกต้อง</p>}
          <label className="flex flex-col gap-1 text-sm font-medium">
            อีเมล
            <input name="email" type="email" required className="h-10 rounded-lg border border-zinc-300 px-3" placeholder="um01@demo.prime" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            รหัสผ่าน
            <input name="password" type="password" required className="h-10 rounded-lg border border-zinc-300 px-3" />
          </label>
          <button type="submit" className="h-10 rounded-lg bg-[#ff6b00] text-black font-semibold mt-2">
            เข้าสู่ระบบ
          </button>
          <p className="text-xs text-zinc-500">
            บัญชีสาธิต: um01@demo.prime / coach01@demo.prime / al01@demo.prime / admin01@demo.prime — รหัสผ่าน prime2026
          </p>
        </form>
      </div>
    </div>
  );
}
