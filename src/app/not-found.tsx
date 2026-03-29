import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-6xl mb-4">🚲</p>
      <h1 className="text-2xl font-bold mb-2">ページが見つかりません</h1>
      <p className="text-gray-500 mb-6">お探しのページは存在しないか、移動した可能性があります</p>
      <Link href="/">
        <Button className="bg-green-600 hover:bg-green-700 text-white">トップページへ</Button>
      </Link>
    </div>
  )
}
