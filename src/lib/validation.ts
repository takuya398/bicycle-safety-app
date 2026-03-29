const NG_PATTERNS = [
  /\d{2,4}[-\s]?\d{2,4}[-\s]?\d{4}/,  // phone numbers
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,  // email
  /警察.*回避|取締.*回避|捕まら|ネズミ取り|取締り.*場所/,
]

const NG_WORDS = ['警察回避', '取締り回避', '捕まりやすい', 'ネズミ取り', '取締りエリア']

export function validateComment(text: string): string | null {
  if (text.length < 10) return 'コメントは10文字以上で入力してください'
  if (text.length > 500) return 'コメントは500文字以内で入力してください'
  for (const pattern of NG_PATTERNS) {
    if (pattern.test(text)) return '個人情報や不適切な表現が含まれています'
  }
  for (const word of NG_WORDS) {
    if (text.includes(word)) return '不適切な表現が含まれています'
  }
  return null
}

export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
