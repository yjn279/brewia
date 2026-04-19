/**
 * Slice 7: NewBeanForm 統合 — PhotoImportButton の onExtracted による state 更新
 *
 * 実装ファイルのパス:
 *   - @/components/new-bean-form (components/new-bean-form.tsx) — 既存ファイル
 *   - @/components/photo-import-button (components/photo-import-button.tsx) — 新規実装対象
 *
 * テスト戦略:
 *   - PhotoImportButton を vi.mock で差し替え、onExtracted を外部から呼べるようにする
 *   - UI コンポーネント（Select, Slider）は new-brew-form.test.tsx のパターンを踏襲してモック化する
 *   - next/navigation の useRouter は既存のパターンと同様にモックする
 *   - 「LLM が返さなかったフィールド (undefined) は既存の入力値を維持する」ことを確認する
 *
 * 注意:
 *   - NewBeanForm が PhotoImportButton を組み込む変更（実装 Slice 7）前は
 *     PhotoImportButton のモックが呼ばれないため、統合テストは初期値の確認のみ通る
 *   - PhotoImportButton 統合後に全テストが green になる
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExtractedBeanFields } from '@/lib/llm/types'

// ---- next/navigation モック ----

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}))

// ---- PhotoImportButton モック ----
// onExtracted を外部から制御できるようにするため、
// コールバック参照をホイスト変数に保持する。

const { capturedOnExtracted } = vi.hoisted(() => ({
  capturedOnExtracted: { current: null as ((fields: ExtractedBeanFields) => void) | null },
}))

vi.mock('@/components/photo-import-button', () => ({
  PhotoImportButton: ({ onExtracted }: { onExtracted: (fields: ExtractedBeanFields) => void }) => {
    // テスト内から呼び出せるようにキャプチャする
    capturedOnExtracted.current = onExtracted
    return (
      <button
        type="button"
        data-testid="photo-import-button"
        onClick={() => {
          // テスト内から直接 capturedOnExtracted.current() を呼ぶことができる
        }}
      >
        写真から入力
      </button>
    )
  },
}))

// ---- UI コンポーネントモック ----
// new-brew-form.test.tsx のパターンと同様に Select と Slider をモックする。

vi.mock('@/components/ui/select', async () => {
  const React = await import('react')

  function extractText(node: React.ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(extractText).join('')
    if (!React.isValidElement(node)) return ''
    const el = node as React.ReactElement<{ children?: React.ReactNode }>
    return extractText(el.props.children)
  }

  function SelectItem({ children }: { children: React.ReactNode; value: string }) {
    return <>{children}</>
  }

  function collectItems(children: React.ReactNode): Array<{ label: string; value: string }> {
    const items: Array<{ label: string; value: string }> = []
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const el = child as React.ReactElement<{ children?: React.ReactNode; value?: string }>
      if (el.type === SelectItem && el.props.value) {
        items.push({ label: extractText(el.props.children), value: el.props.value })
        return
      }
      items.push(...collectItems(el.props.children))
    })
    return items
  }

  function Select({
    children,
    onValueChange,
    value,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode
    onValueChange?: (value: string) => void
    value?: string
    'aria-label'?: string
  }) {
    const items = collectItems(children)
    return (
      <select
        aria-label={ariaLabel ?? 'select'}
        onChange={(e) => onValueChange?.(e.target.value)}
        value={value ?? ''}
      >
        <option disabled value="">
          Select
        </option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    )
  }

  function SelectContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }

  function SelectTrigger({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }

  function SelectValue({ placeholder }: { children?: React.ReactNode; placeholder?: string }) {
    return <>{placeholder}</>
  }

  return { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
})

vi.mock('@/components/ui/slider', async () => {
  const React = await import('react')

  function Slider({
    max,
    min,
    onValueChange,
    step,
    value,
    'aria-label': ariaLabel,
  }: {
    max?: number
    min?: number
    onValueChange?: (value: number[]) => void
    step?: number
    value?: number[]
    'aria-label'?: string
  }) {
    return (
      <input
        aria-label={ariaLabel ?? 'Roast slider'}
        max={max}
        min={min}
        onChange={(e) => onValueChange?.([Number(e.target.value)])}
        step={step}
        type="range"
        value={value?.[0] ?? min ?? 0}
      />
    )
  }

  return { Slider }
})

// NewBeanForm をモック後に import する
import { NewBeanForm } from '@/components/new-bean-form'

// ---- テストスイート ----

describe('NewBeanForm — PhotoImportButton 統合', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnExtracted.current = null
  })

  // ---- 初期描画 ----

  it('given create モードでレンダリングされるとき then "写真から入力" ボタンが表示される', () => {
    // Arrange & Act
    render(<NewBeanForm />)

    // Assert: PhotoImportButton モックが描画されている
    const btn = screen.getByTestId('photo-import-button')
    expect(btn).toBeDefined()
  })

  // ---- onExtracted による state 更新 ----

  it('given onExtracted が name と roaster を含むフィールドで呼ばれたとき then フォームの name/roaster 入力値が更新される', async () => {
    // Arrange
    render(<NewBeanForm />)

    // Act: PhotoImportButton の onExtracted を外部からトリガー
    await waitFor(() => {
      expect(capturedOnExtracted.current).not.toBeNull()
    })
    capturedOnExtracted.current!({
      name: 'Yirgacheffe Kochere',
      roaster: 'Onibus Coffee',
    })

    // Assert: フォームの入力フィールドが更新されている
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement
      expect(nameInput.value).toBe('Yirgacheffe Kochere')
    })
    const roasterInput = screen.getByLabelText('Roaster') as HTMLInputElement
    expect(roasterInput.value).toBe('Onibus Coffee')
  })

  it('given onExtracted が country: "Ethiopia" で呼ばれたとき then Country select が "Ethiopia" を選択した状態になる', async () => {
    // Arrange
    render(<NewBeanForm />)

    // Act
    await waitFor(() => expect(capturedOnExtracted.current).not.toBeNull())
    capturedOnExtracted.current!({ country: 'Ethiopia' })

    // Assert
    await waitFor(() => {
      // select 要素の値が Ethiopia になっていること
      const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
      const countrySelect = selects.find(
        (s) => s.getAttribute('aria-label') === 'select' && Array.from(s.options).some((o) => o.value === 'Ethiopia')
      )
      expect(countrySelect).toBeDefined()
      expect(countrySelect?.value).toBe('Ethiopia')
    })
  })

  it('given onExtracted が process: "Washed" で呼ばれたとき then Process select が "Washed" を選択した状態になる', async () => {
    // Arrange
    render(<NewBeanForm />)

    // Act
    await waitFor(() => expect(capturedOnExtracted.current).not.toBeNull())
    capturedOnExtracted.current!({ process: 'Washed' })

    // Assert
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
      const processSelect = selects.find(
        (s) => Array.from(s.options).some((o) => o.value === 'Washed')
      )
      expect(processSelect).toBeDefined()
      expect(processSelect?.value).toBe('Washed')
    })
  })

  it('given onExtracted が notes で呼ばれたとき then Textarea の値が更新される', async () => {
    // Arrange
    render(<NewBeanForm />)

    // Act
    await waitFor(() => expect(capturedOnExtracted.current).not.toBeNull())
    capturedOnExtracted.current!({ notes: 'Jasmine, Blueberry, Citrus' })

    // Assert
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Tasting notes/) as HTMLTextAreaElement
      expect(textarea.value).toBe('Jasmine, Blueberry, Citrus')
    })
  })

  // ---- undefined フィールドは既存の入力値を維持する ----

  it('given ユーザーが name を手動入力後に onExtracted が name を含まない（undefined）フィールドで呼ばれたとき then name の入力値は維持される', async () => {
    // Arrange
    render(<NewBeanForm />)
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement

    // 事前に手動入力
    fireEvent.change(nameInput, { target: { value: 'My Manual Bean Name' } })
    expect(nameInput.value).toBe('My Manual Bean Name')

    // Act: name を含まないフィールドで onExtracted を呼ぶ
    await waitFor(() => expect(capturedOnExtracted.current).not.toBeNull())
    capturedOnExtracted.current!({
      roaster: 'New Roaster From LLM',
      // name は undefined（省略）
    })

    // Assert: name は変わらない
    await waitFor(() => {
      expect(nameInput.value).toBe('My Manual Bean Name')
    })
    const roasterInput = screen.getByLabelText('Roaster') as HTMLInputElement
    expect(roasterInput.value).toBe('New Roaster From LLM')
  })

  it('given ユーザーが Roast スライダーを手動調整後に onExtracted が呼ばれたとき then スライダーの値は維持される（LLM は roast を更新しない）', async () => {
    // Arrange
    render(<NewBeanForm />)
    const slider = screen.getByRole('slider') as HTMLInputElement

    // デフォルト値は 2 (Medium)
    expect(Number(slider.value)).toBe(2)

    // 手動で変更（index 5 = Full City）
    fireEvent.change(slider, { target: { value: '5' } })

    // Act: onExtracted を呼ぶ（roast は LLM スコープ外なので影響なし）
    await waitFor(() => expect(capturedOnExtracted.current).not.toBeNull())
    capturedOnExtracted.current!({ name: 'Some Bean' })

    // Assert: スライダーは 5 のまま
    await waitFor(() => {
      expect(Number(slider.value)).toBe(5)
    })
  })

  // ---- edit モードでの動作 ----

  it('given edit モードで initialBean が設定されているとき then onExtracted でフィールドが上書きされる', async () => {
    // Arrange
    const initialBean = {
      id: 'bean-1',
      name: 'Old Name',
      roaster: 'Old Roaster',
      country: 'Kenya' as const,
      region: 'Nyeri',
      farm: 'Kieni',
      variety: 'SL28',
      process: 'Washed',
      roast: 'Light' as const,
      notes: null,
      created: '2026-04-18T00:00:00.000Z',
      updated: '2026-04-18T00:00:00.000Z',
    }
    render(<NewBeanForm mode="edit" initialBean={initialBean} />)

    // Act
    await waitFor(() => expect(capturedOnExtracted.current).not.toBeNull())
    capturedOnExtracted.current!({ name: 'New LLM Name', roaster: 'New LLM Roaster' })

    // Assert: edit モードでも上書きされる
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement
      expect(nameInput.value).toBe('New LLM Name')
    })
    const roasterInput = screen.getByLabelText('Roaster') as HTMLInputElement
    expect(roasterInput.value).toBe('New LLM Roaster')
  })
})
