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
  /** 選択ファイルが確定したときに呼ばれるオプションコールバック（焙煎度推定など追加処理用） */
  onFileSelected?: (file: File) => void
}

export function PhotoImportButton({ onExtracted, onFileSelected }: PhotoImportButtonProps) {
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

      // バリデーション通過後に追加処理コールバックを呼ぶ（焙煎度推定など）
      onFileSelected?.(file)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/beans/extract', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let code: string | undefined
        let details: string | undefined
        try {
          const err = await response.json()
          code = err?.code
          details = err?.details
        } catch {
          // body が読めなくても続行
        }

        const baseMessage =
          code === 'FILE_TOO_LARGE'
            ? 'ファイルサイズが大きすぎます（サーバー側）'
            : code === 'INVALID_FILE'
              ? '画像形式が不正です（JPEG / PNG のみ対応）'
              : code === 'EXTRACTION_FAILED'
                ? 'AI 解析に失敗しました'
                : '自動入力に失敗しました。手動で入力してください'

        const fullMessage = details ? `${baseMessage}: ${details}` : baseMessage
        toast.error(fullMessage, { duration: 10000 })
        return
      }

      const fields = (await response.json()) as ExtractedBeanFields
      const hasAnyValue = Object.values(fields).some(
        (v) => v !== undefined && v !== null && v !== '',
      )
      if (!hasAnyValue) {
        toast.warning(
          '写真から情報を読み取れませんでした。別の画像か手動入力をお試しください',
        )
        return
      }
      onExtracted(fields)
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
