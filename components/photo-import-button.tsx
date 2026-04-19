'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CLIENT_MAX_IMAGE_SIZE_BYTES, ALLOWED_MEDIA_TYPES } from '@/lib/llm/constants'
import type { ExtractedBeanFields } from '@/lib/llm/types'

interface PhotoImportButtonProps {
  /** 解析完了時に呼ばれるコールバック。親フォームがフィールドを更新する */
  onExtracted: (fields: ExtractedBeanFields) => void
}

export function PhotoImportButton({ onExtracted }: PhotoImportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    try {
      // クライアント側バリデーション: サイズチェック（順序重要: サイズ→MIME）
      if (file.size > CLIENT_MAX_IMAGE_SIZE_BYTES) {
        toast.error('ファイルサイズが大きすぎます。4MB 以下の画像を選択してください')
        return
      }

      // クライアント側バリデーション: MIME タイプチェック
      if (!ALLOWED_MEDIA_TYPES.includes(file.type as (typeof ALLOWED_MEDIA_TYPES)[number])) {
        toast.error('JPEG または PNG の画像を選択してください')
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/beans/extract', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const fields = (await response.json()) as ExtractedBeanFields
        onExtracted(fields)
      } else {
        toast.error('自動入力に失敗しました。手動で入力してください')
      }
    } catch {
      toast.error('自動入力に失敗しました。手動で入力してください')
    } finally {
      setIsLoading(false)
      // input をリセットして同じファイルを再選択できるようにする（バリデーションエラー時も含む）
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleButtonClick}
        disabled={isLoading}
        aria-label={isLoading ? '解析中' : '写真から入力'}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            解析中...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            写真から入力
          </>
        )}
      </Button>
    </>
  )
}
