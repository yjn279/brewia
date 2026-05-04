/**
 * Slice 6: PhotoImportButton コンポーネント — UI 挙動
 *
 * 実装ファイルのパス: components/photo-import-button.tsx → @/components/photo-import-button
 *
 * テスト戦略:
 *   - fetch は vi.stubGlobal でスタブ化する
 *   - sonner の toast は vi.mock でスタブ化する
 *   - ファイル選択は hidden input への fireEvent.change でシミュレートする
 *   - FileReader は jsdom 環境でサポートされているが、
 *     readAsDataURL の非同期完了を waitFor でガードする
 *
 * 確定事項:
 *   - クライアント側サイズ上限: 4 MB（4 * 1024 * 1024 = 4,194,304 bytes）
 *   - 許可 MIME: image/jpeg / image/png
 *   - ボタンテキスト: "写真から入力"
 *   - エラー時トースト: 'sonner' の toast.error
 *   - エラーメッセージ: '自動入力に失敗しました。手動で入力してください'
 *   - エンドポイント: POST /api/beans/extract
 *   - ボディ: multipart/form-data の FormData
 *
 * red 状態の維持:
 *   - photo-import-button.tsx が存在しない間は vite:import-analysis がクラッシュするため
 *     describe.skip で全テストを保護する
 *   - 実装後は describe.skip を describe に変更して有効化する
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PhotoImportButton } from '@/components/photo-import-button'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}))

describe('PhotoImportButton', () => {
  // ---- ヘルパー ----

  function makeFile(sizeBytes: number, mimeType = 'image/jpeg', name = 'bean.jpg') {
    const bytes = new Uint8Array(sizeBytes).fill(0xab)
    return new File([bytes], name, { type: mimeType })
  }

  function makeFetchResponse(ok: boolean, status: number, body: unknown) {
    return { ok, status, json: async () => body }
  }

  function renderButton(onExtracted = vi.fn()) {
    render(<PhotoImportButton onExtracted={onExtracted} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    return { input }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---- 初期描画 ----

  it('given コンポーネントがレンダリングされるとき then "写真から入力" テキストのボタンが表示される', () => {
    render(<PhotoImportButton onExtracted={vi.fn()} />)
    const button = screen.getByRole('button', { name: /写真から入力/ })
    expect(button).toBeDefined()
  })

  it('given コンポーネントがレンダリングされるとき then ボタンは有効（disabled でない）', () => {
    render(<PhotoImportButton onExtracted={vi.fn()} />)
    const button = screen.getByRole('button', { name: /写真から入力/ })
    expect((button as HTMLButtonElement).disabled).toBe(false)
  })

  it('given コンポーネントがレンダリングされるとき then hidden input が accept="image/jpeg,image/png" で存在する', () => {
    render(<PhotoImportButton onExtracted={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.accept).toContain('image/jpeg')
    expect(input.accept).toContain('image/png')
  })

  it('given ボタンがレンダリングされたとき then input に capture 属性が設定されていない（アップロードもカメラ撮影も OS ネイティブ picker で選べるようにするため）', () => {
    const { input } = renderButton()
    expect(input.hasAttribute('capture')).toBe(false)
  })

  // ---- ローディング状態 ----

  it('given ファイルが選択されたとき then ボタンが無効化されスピナーが表示される', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const { input } = renderButton()
    const file = makeFile(1024)
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect((button as HTMLButtonElement).disabled).toBe(true)
    })
  })

  // ---- 成功系 ----

  it('given POST が 200 を返すとき then onExtracted コールバックが抽出フィールドと共に呼ばれる', async () => {
    const extractedFields = { name: 'Yirgacheffe Kochere', country: 'Ethiopia' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true, 200, extractedFields)))
    const onExtracted = vi.fn()
    const { input } = renderButton(onExtracted)
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => { expect(onExtracted).toHaveBeenCalledTimes(1) })
    expect(onExtracted).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Yirgacheffe Kochere', country: 'Ethiopia',
    }))
  })

  it('given POST が 200 を返しかつ成功したとき then toast.error は呼ばれない', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true, 200, {})))
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      // fetch が呼ばれるまで待つ
      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
    })
    // fetch 完了後に toast.error が呼ばれていないことを確認
    await waitFor(() => {
      expect(toast.error).not.toHaveBeenCalled()
    })
  })

  it('given 解析が完了したとき then ボタンが再度有効化される（isLoading: false）', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true, 200, {})))
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect((button as HTMLButtonElement).disabled).toBe(false)
    })
  })

  // ---- エラー系: サーバーエラー ----

  it('given POST が 503 を返すとき then toast.error が正しいメッセージで呼ばれる', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(false, 503, { code: 'EXTRACTION_FAILED' })))
    const onExtracted = vi.fn()
    const { input } = renderButton(onExtracted)
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'AI 解析に失敗しました',
        expect.objectContaining({ duration: 10000 }),
      )
    })
    expect(onExtracted).not.toHaveBeenCalled()
  })

  it('given POST が 400 (INVALID_FILE) を返すとき then toast.error が呼ばれ onExtracted は呼ばれない', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(false, 400, { code: 'INVALID_FILE' })))
    const onExtracted = vi.fn()
    const { input } = renderButton(onExtracted)
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        '画像形式が不正です（JPEG / PNG のみ対応）',
        expect.objectContaining({ duration: 10000 }),
      )
    })
    expect(onExtracted).not.toHaveBeenCalled()
  })

  // ---- エラー系: ネットワーク障害 ----

  it('given fetch が reject するとき then toast.error が呼ばれる', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('自動入力に失敗しました。手動で入力してください')
    })
  })

  it('given fetch が reject したとき then ボタンが再度有効化される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect((button as HTMLButtonElement).disabled).toBe(false)
    })
  })

  // ---- クライアント側サイズチェック ----

  it('given 4 MB 超のファイルが選択されたとき then toast.error が呼ばれ fetch は送信されない', async () => {
    // 4 MB + 1 byte
    const oversizeFile = makeFile(4 * 1024 * 1024 + 1)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [oversizeFile] } })
    await waitFor(() => { expect(toast.error).toHaveBeenCalled() })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('given ちょうど 4 MB のファイルが選択されたとき then fetch が送信される（境界値: 許可）', async () => {
    // ちょうど 4 MB = 4,194,304 bytes
    const boundaryFile = makeFile(4 * 1024 * 1024)
    const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse(true, 200, {}))
    vi.stubGlobal('fetch', fetchMock)
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [boundaryFile] } })
    await waitFor(() => { expect(fetchMock).toHaveBeenCalledTimes(1) })
  })

  // ---- クライアント側 MIME チェック ----

  it('given JPEG/PNG 以外のファイルが選択されたとき then toast.error が呼ばれ fetch は送信されない', async () => {
    const gifFile = new File(['gif data'], 'test.gif', { type: 'image/gif' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const onExtracted = vi.fn()
    const { input } = renderButton(onExtracted)
    fireEvent.change(input, { target: { files: [gifFile] } })
    await waitFor(() => { expect(toast.error).toHaveBeenCalled() })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('given JPEG/PNG 以外のファイルが選択されたとき then onExtracted は呼ばれない', async () => {
    const gifFile = new File(['gif data'], 'test.gif', { type: 'image/gif' })
    vi.stubGlobal('fetch', vi.fn())
    const onExtracted = vi.fn()
    const { input } = renderButton(onExtracted)
    fireEvent.change(input, { target: { files: [gifFile] } })
    await waitFor(() => { expect(toast.error).toHaveBeenCalled() })
    expect(onExtracted).not.toHaveBeenCalled()
  })

  it('given MIME バリデーションエラー後 then input.value がリセットされ同じファイルを再選択できる', async () => {
    const gifFile = new File(['gif data'], 'test.gif', { type: 'image/gif' })
    vi.stubGlobal('fetch', vi.fn())
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [gifFile] } })
    await waitFor(() => { expect(toast.error).toHaveBeenCalled() })
    // input.value がリセットされている（空文字）ことを確認
    expect(input.value).toBe('')
  })

  it('given サイズバリデーションエラー後 then input.value がリセットされ同じファイルを再選択できる', async () => {
    const oversizeFile = makeFile(4 * 1024 * 1024 + 1)
    vi.stubGlobal('fetch', vi.fn())
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [oversizeFile] } })
    await waitFor(() => { expect(toast.error).toHaveBeenCalled() })
    // input.value がリセットされている（空文字）ことを確認
    expect(input.value).toBe('')
  })

  // ---- 空抽出（200 だが有効フィールドなし）----

  it('given POST が 200 {} を返すとき then toast.warning が呼ばれる', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true, 200, {})))
    const onExtracted = vi.fn()
    const { input } = renderButton(onExtracted)
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        '写真から情報を読み取れませんでした。別の画像か手動入力をお試しください',
      )
    })
  })

  it('given POST が 200 {} を返すとき then onExtracted は呼ばれない', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true, 200, {})))
    const onExtracted = vi.fn()
    const { input } = renderButton(onExtracted)
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledTimes(1)
    })
    expect(onExtracted).not.toHaveBeenCalled()
  })

  // ---- エラー系: code 別メッセージ ----

  it('given POST が 400 (FILE_TOO_LARGE) を返すとき then 対応するトーストメッセージが表示される', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse(false, 400, { code: 'FILE_TOO_LARGE' })),
    )
    const onExtracted = vi.fn()
    const { input } = renderButton(onExtracted)
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'ファイルサイズが大きすぎます（サーバー側）',
        expect.objectContaining({ duration: 10000 }),
      )
    })
    expect(onExtracted).not.toHaveBeenCalled()
  })

  it('given POST が 503 (EXTRACTION_FAILED) を返すとき then AI 解析失敗メッセージが表示される', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse(false, 503, { code: 'EXTRACTION_FAILED' })),
    )
    const onExtracted = vi.fn()
    const { input } = renderButton(onExtracted)
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('AI 解析に失敗しました'),
        expect.objectContaining({ duration: 10000 }),
      )
    })
    expect(onExtracted).not.toHaveBeenCalled()
  })

  it('given POST が 503 で details ありのとき then トーストメッセージに details が含まれる', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        makeFetchResponse(false, 503, { code: 'EXTRACTION_FAILED', details: 'Invalid API key' }),
      ),
    )
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'AI 解析に失敗しました: Invalid API key',
        expect.objectContaining({ duration: 10000 }),
      )
    })
  })

  it('given POST が 500 で details ありのとき then トーストメッセージに details が含まれる', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        makeFetchResponse(false, 500, { code: 'INTERNAL_ERROR', details: 'Database connection failed' }),
      ),
    )
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        '自動入力に失敗しました。手動で入力してください: Database connection failed',
        expect.objectContaining({ duration: 10000 }),
      )
    })
  })

  it('given POST が 503 で details なしのとき then トーストはベースメッセージのみを表示する（後方互換）', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse(false, 503, { code: 'EXTRACTION_FAILED' })),
    )
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'AI 解析に失敗しました',
        expect.objectContaining({ duration: 10000 }),
      )
    })
  })

  it('given POST が 500 {} (code なし) を返すとき then フォールバックメッセージが表示される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(false, 500, {})))
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        '自動入力に失敗しました。手動で入力してください',
        expect.objectContaining({ duration: 10000 }),
      )
    })
  })

  // ---- リクエスト形式 ----

  it('given ファイルが選択されたとき then fetch が /api/beans/extract に POST される', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse(true, 200, {}))
    vi.stubGlobal('fetch', fetchMock)
    const { input } = renderButton()
    fireEvent.change(input, { target: { files: [makeFile(1024)] } })
    await waitFor(() => { expect(fetchMock).toHaveBeenCalledTimes(1) })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/beans/extract')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
  })

  // ---- LLM 経由 焙煎度取得統合 ----

  it('given LLM が roast="Medium" を含むフィールドを返すとき then onRoastEstimated が "Medium" で呼ばれ onExtracted も呼ばれる', async () => {
    const extractedFields = { name: 'Test Bean', roast: 'Medium' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true, 200, extractedFields)))

    const onExtracted = vi.fn()
    const onRoastEstimated = vi.fn()
    render(<PhotoImportButton onExtracted={onExtracted} onRoastEstimated={onRoastEstimated} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [makeFile(1024)] } })

    await waitFor(() => { expect(onExtracted).toHaveBeenCalledTimes(1) })
    await waitFor(() => { expect(onRoastEstimated).toHaveBeenCalledWith('Medium') })
  })

  it('given LLM が roast フィールドを含まないレスポンスを返すとき then onRoastEstimated は呼ばれない', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true, 200, { name: 'Test Bean' })))

    const onRoastEstimated = vi.fn()
    render(<PhotoImportButton onExtracted={vi.fn()} onRoastEstimated={onRoastEstimated} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [makeFile(1024)] } })

    await waitFor(() => {
      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
    })
    // fetch 完了後に onRoastEstimated が呼ばれていないことを確認
    await waitFor(() => {
      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
    })
    expect(onRoastEstimated).not.toHaveBeenCalled()
  })

  it('given サイズ超過で早期リターンするとき then onRoastEstimated は呼ばれない', async () => {
    const oversizeFile = makeFile(4 * 1024 * 1024 + 1)
    vi.stubGlobal('fetch', vi.fn())
    const onRoastEstimated = vi.fn()
    render(<PhotoImportButton onExtracted={vi.fn()} onRoastEstimated={onRoastEstimated} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [oversizeFile] } })

    await waitFor(() => { expect(toast.error).toHaveBeenCalled() })
    expect(onRoastEstimated).not.toHaveBeenCalled()
  })

  it('given MIME 不正で早期リターンするとき then onRoastEstimated は呼ばれない', async () => {
    const gifFile = new File(['gif data'], 'test.gif', { type: 'image/gif' })
    vi.stubGlobal('fetch', vi.fn())
    const onRoastEstimated = vi.fn()
    render(<PhotoImportButton onExtracted={vi.fn()} onRoastEstimated={onRoastEstimated} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [gifFile] } })

    await waitFor(() => { expect(toast.error).toHaveBeenCalled() })
    expect(onRoastEstimated).not.toHaveBeenCalled()
  })

  it('given LLM が roast="French" を含む複数フィールドを返すとき then onRoastEstimated が "French" で呼ばれる', async () => {
    const extractedFields = { name: 'Kenya AA', country: 'Kenya', roast: 'French' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(true, 200, extractedFields)))

    const onRoastEstimated = vi.fn()
    render(<PhotoImportButton onExtracted={vi.fn()} onRoastEstimated={onRoastEstimated} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [makeFile(1024)] } })

    await waitFor(() => { expect(onRoastEstimated).toHaveBeenCalledWith('French') })
  })
})
