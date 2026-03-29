'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-6xl mb-4">⚠️</p>
      <h2 className="text-xl font-bold mb-2">エラーが発生しました</h2>
      <p className="text-gray-500 mb-6">問題が解決しない場合は、ページを再読み込みしてください</p>
      <Button onClick={reset} className="bg-green-600 hover:bg-green-700 text-white">
        もう一度試す
      </Button>
    </div>
  )
}
