'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Header() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-green-700">
          <span className="text-xl">🚲</span>
          <span className="hidden sm:inline">チャリ安全ナビ</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/rules" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 px-2">
            交通ルール
          </Link>
          {!loading && (
            user ? (
              <>
                <Link href="/post">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    + 投稿
                  </Button>
                </Link>
                <Link href="/mypage" className="flex items-center gap-1">
                  <span className="text-sm text-gray-600 hidden sm:inline">{profile?.username ?? 'マイページ'}</span>
                  {profile?.role === 'admin' && <Badge variant="secondary" className="text-xs">管理者</Badge>}
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  ログアウト
                </Button>
              </>
            ) : (
              <Link href="/auth/login">
                <Button size="sm" variant="outline">ログイン</Button>
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  )
}
