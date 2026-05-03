'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CLIENT_MAX_IMAGE_SIZE_BYTES, ALLOWED_MEDIA_TYPES } from '@/lib/llm/constants'
import { sampleImageColor } from '@/lib/color/image-sampler'
import { srgbToLab } from '@/lib/color/srgb-to-lab'
import { estimateRoastLevel } from '@/lib/color/roast-estimator'
import type { ExtractedBeanFields } from '@/lib/llm/types'
import type { RoastLevel } from '@/lib/types'

interface PhotoImportButtonProps {
  /** 解析完了時に呼ばれるコールバック。親フォームがフィールドを更新する */
  onExtracted: (fields: ExtractedBeanFields) => void
  /**
   * Lab 色解析による焙煎度推定が完了したとき呼ばれるコールバック。
   * LLM 抽出と独立して実行される。estimateRoastLevel が null を返した場合は呼ばれない。
   */
  onRoastEstimated?: (level: RoastLevel) => void
}

export function PhotoImportButton({ onExtracted, onRoastEstimated }: PhotoImportButtonProps) {
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

      // LLM 抽出と Lab 色解析を並列実行。片方が失敗してももう一方の結果は反映する。
      const formData = new FormData()
      formData.append('file', file)

      const [llmResult, labResult] = await Promise.allSettled([
        fetch('/api/beans/extract', {
          method: 'POST',
          body: formData,
        }),
        onRoastEstimated
          ? sampleImageColor(file).then((rgb) => {
              const lab = srgbToLab(rgb.r, rgb.g, rgb.b)
              return estimateRoastLevel(lab.L)
            })
          : Promise.resolve(null),
      ])

      // LLM 抽出結果の処理
      if (llmResult.status === 'fulfilled') {
        const response = llmResult.value

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
        } else {
          const fields = (await response.json()) as ExtractedBeanFields
          const hasAnyValue = Object.values(fields).some(
            (v) => v !== undefined && v !== null && v !== '',
          )
          if (!hasAnyValue) {
            toast.warning(
              '写真から情報を読み取れませんでした。別の画像か手動入力をお試しください',
            )
          } else {
            onExtracted(fields)
          }
        }
      } else {
        toast.error('自動入力に失敗しました。手動で入力してください')
      }

      // Lab 色解析結果の処理（LLM 結果とは独立）
      if (onRoastEstimated && labResult.status === 'fulfilled' && labResult.value !== null) {
        onRoastEstimated(labResult.value)
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
