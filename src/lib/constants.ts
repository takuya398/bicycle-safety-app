export const REPORT_CATEGORY_LABELS: Record<string, string> = {
  warning: '指導・警告を受けた',
  fine: '反則金・取締りがあった',
  danger: '危険だった',
  confusing_road: '分かりづらい道路構造だった',
}

export const VIOLATION_TYPE_LABELS: Record<string, string> = {
  signal_ignore: '信号無視',
  wrong_way: '逆走',
  stop_sign_ignore: '一時不停止',
  sidewalk_issue: '歩道通行',
  smartphone_use: 'スマホ使用',
  no_light: '無灯火',
  right_side_issue: '右側通行',
  other: 'その他',
}

export const FLAG_REASON_LABELS: Record<string, string> = {
  misinformation: '誤情報',
  personal_info: '個人情報を含む',
  harassment: '誹謗中傷',
  spam: 'スパム',
  other: 'その他',
}

export const NOTIFICATION_RADIUS_OPTIONS = [
  { value: 100, label: '100m' },
  { value: 300, label: '300m' },
  { value: 500, label: '500m' },
]

export const HIGH_RISK_REPORT_THRESHOLD = 3
export const REPORT_FLAG_THRESHOLD = 3
export const PROXIMITY_COOLDOWN_MS = 30 * 60 * 1000 // 30 minutes
export const LOCATION_POLL_INTERVAL_MS = 10 * 1000 // 10 seconds
