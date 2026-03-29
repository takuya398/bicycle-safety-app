'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, NotificationScope } from '@/types'
import { NOTIFICATION_RADIUS_OPTIONS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface Props { profile: Profile | null }

export default function SettingsClient({ profile }: Props) {
  const [username, setUsername] = useState(profile?.username ?? '')
  const [notifEnabled, setNotifEnabled] = useState(profile?.notification_enabled ?? false)
  const [notifScope, setNotifScope] = useState<NotificationScope>(profile?.notification_scope ?? 'saved_only')
  const [notifRadius, setNotifRadius] = useState(profile?.notification_radius ?? 300)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        notification_enabled: notifEnabled,
        notification_scope: notifScope,
        notification_radius: notifRadius,
      })
      .eq('id', profile!.id)

    if (error) toast.error('保存に失敗しました')
    else toast.success('設定を保存しました')
    setSaving(false)
  }

  const handleNotifToggle = async () => {
    if (!notifEnabled) {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('通知の許可が必要です。ブラウザの設定から許可してください')
        return
      }
    }
    setNotifEnabled(!notifEnabled)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">設定</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">プロフィール</CardTitle></CardHeader>
        <CardContent>
          <Label>ユーザー名</Label>
          <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="ユーザー名" className="mt-1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">危険地点接近通知</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">通知を有効にする</p>
              <p className="text-xs text-gray-500">危険地点に近づくとアラートを表示します</p>
            </div>
            <button
              onClick={handleNotifToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${notifEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {notifEnabled && (
            <>
              <Separator />
              <div>
                <Label>通知対象</Label>
                <Select value={notifScope} onValueChange={v => setNotifScope(v as NotificationScope)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saved_only">保存地点のみ</SelectItem>
                    <SelectItem value="saved_and_high_risk">保存地点＋高注意地点</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>通知距離</Label>
                <Select value={String(notifRadius)} onValueChange={v => setNotifRadius(Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_RADIUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 text-white">
        {saving ? '保存中...' : '設定を保存'}
      </Button>
    </div>
  )
}
