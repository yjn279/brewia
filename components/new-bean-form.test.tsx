/**
 * NewBeanForm 統合テスト
 *
 * テスト対象:
 *   - @/components/new-bean-form (components/new-bean-form.tsx)
 *   - @/components/photo-import-button (components/photo-import-button.tsx)
 *   - @/components/roast-photo-picker (components/roast-photo-picker.tsx)
 *   - @/components/roast-palette (components/roast-palette.tsx)
 *
 * テスト戦略:
 *   - PhotoImportButton を vi.mock で差し替え、onExtracted を外部から呼べるようにする
 *   - RoastPhotoPicker を vi.mock で差し替え、onEstimate を外部から呼べるようにする
 *   - UI コンポーネント（Select）は placeholder を aria-label として使うモックに統一
 *   - next/navigation の useRouter は既存のパターンと同様にモックする
 *   - 「LLM が返さなかったフィールド (undefined) は既存の入力値を維持する」ことを確認する
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExtractedBeanFields } from '@/lib/llm/types'
import type { RoastLevel } from '@/lib/types'

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

// ---- RoastPhotoPicker モック ----

const { photoPickerState } = vi.hoisted(() => ({
  photoPickerState: { onEstimate: null as ((level: RoastLevel) => void) | null },
}))

vi.mock('@/components/roast-photo-picker', () => ({
  RoastPhotoPicker: ({ onEstimate }: { onEstimate: (level: string) => void }) => {
    photoPickerState.onEstimate = onEstimate as (level: RoastLevel) => void
    return (
      <button
        type="button"
        data-testid="mock-photo-picker"
        onClick={() => onEstimate('French')}
      >
        Mock Photo Picker
      </button>
    )
  },
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
// Select: placeholder を aria-label として使う（main 側の方針を優先）

vi.mock('@/components/ui/select', async () => {
  const React = await import('react')

  function extractText(node: React.ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node)
    }

    if (Array.isArray(node)) {
      return node.map(extractText).join('')
    }

    if (!React.isValidElement(node)) {
      return ''
    }

    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    return extractText(element.props.children)
  }

  function SelectItem({
    children,
  }: {
    children: React.ReactNode
    value: string
  }) {
    return <>{children}</>
  }

  function collectItems(children: React.ReactNode): Array<{ label: string; value: string }> {
    const items: Array<{ label: string; value: string }> = []

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        return
      }

      const element = child as React.ReactElement<{
        children?: React.ReactNode
        value?: string
      }>

      if (element.type === SelectItem && element.props.value) {
        items.push({
          label: extractText(element.props.children),
          value: element.props.value,
        })
        return
      }

      items.push(...collectItems(element.props.children))
    })

    return items
  }

  function Select({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode
    onValueChange?: (value: string) => void
    value?: string
  }) {
    const items = collectItems(children)
    // Extract placeholder from SelectValue child for aria-label
    let placeholder = ''
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const el = child as React.ReactElement<{ children?: React.ReactNode }>
      extractText(el.props.children) // traverse
      // Look for SelectTrigger > SelectValue placeholder
      React.Children.forEach(el.props.children, (grandchild) => {
        if (!React.isValidElement(grandchild)) return
        const gc = grandchild as React.ReactElement<{ placeholder?: string }>
        if (gc.props.placeholder) {
          placeholder = gc.props.placeholder
        }
      })
    })

    return (
      <select
        aria-label={placeholder || 'Select'}
        onChange={(event) => onValueChange?.(event.target.value)}
        value={value ?? ''}
      >
        <option disabled value="">
          {placeholder}
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

  function SelectValue({
    children,
    placeholder,
  }: {
    children?: React.ReactNode
    placeholder?: string
  }) {
    return <>{children ?? placeholder}</>
  }

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  }
})

// NewBeanForm をモック後に import する
import { NewBeanForm } from '@/components/new-bean-form'

// ---- テストスイート: RoastPalette / RoastPhotoPicker 連携 (main 側) ----

describe('NewBeanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    photoPickerState.onEstimate = null
    capturedOnExtracted.current = null
  })

  it('T8: given the palette selection changes from Medium to French, when the form is submitted, then fetch is called with roast="French"', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'bean-1' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBeanForm />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Bean' } })
    fireEvent.change(screen.getByLabelText('Roaster'), { target: { value: 'Test Roaster' } })

    // Country is the first combobox
    const comboboxes = screen.getAllByRole('combobox')
    fireEvent.change(comboboxes[0], { target: { value: 'Ethiopia' } })

    // Select French roast from the roast dropdown
    fireEvent.change(screen.getByRole('combobox', { name: 'Select roast level' }), {
      target: { value: 'French' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add Bean' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as { roast: string }
    expect(body.roast).toBe('French')
  })

  it('S5-T1: given NewBeanForm renders, when rendered, then the RoastPhotoPicker mock is present', () => {
    render(<NewBeanForm />)
    expect(screen.getByTestId('mock-photo-picker')).toBeDefined()
  })

  it('S5-T2: given RoastPhotoPicker calls onEstimate("French"), when the callback fires, then the roast combobox value becomes "French"', async () => {
    render(<NewBeanForm />)

    fireEvent.click(screen.getByTestId('mock-photo-picker'))

    await waitFor(() => {
      const combobox = screen.getByRole('combobox', { name: 'Select roast level' }) as HTMLSelectElement
      expect(combobox.value).toBe('French')
    })
  })

  it('S5-T3: given RoastPhotoPicker sets roast to "French" and the form is submitted, when fetch is called, then request body has roast="French"', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'bean-1' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBeanForm />)

    fireEvent.click(screen.getByTestId('mock-photo-picker'))

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Bean' } })
    fireEvent.change(screen.getByLabelText('Roaster'), { target: { value: 'Test Roaster' } })
    const comboboxes = screen.getAllByRole('combobox')
    fireEvent.change(comboboxes[0], { target: { value: 'Ethiopia' } })

    fireEvent.click(screen.getByRole('button', { name: 'Add Bean' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as { roast: string }
    expect(body.roast).toBe('French')
  })

  it('S5-T4: given photoPickerState.onEstimate("Light") is invoked, when called, then the roast combobox value becomes "Light"', async () => {
    render(<NewBeanForm />)

    await waitFor(() => expect(photoPickerState.onEstimate).not.toBeNull())
    photoPickerState.onEstimate!('Light')

    await waitFor(() => {
      const combobox = screen.getByRole('combobox', { name: 'Select roast level' }) as HTMLSelectElement
      expect(combobox.value).toBe('Light')
    })
  })

  it('S5-T5: given NewBeanForm with mode="edit" and an initialBean, when rendered, then the RoastPhotoPicker mock is present', () => {
    const bean = {
      id: 'b1', name: 'Test', country: 'Ethiopia' as const, region: null, farm: null,
      process: null, variety: null, roast: 'Medium' as const, roaster: 'R',
      priceJpy: null, notes: null, created: '', updated: '',
    }
    render(<NewBeanForm mode="edit" initialBean={bean} />)
    expect(screen.getByTestId('mock-photo-picker')).toBeDefined()
  })

  // ---- PhotoImportButton 統合テスト (feat/32 側) ----

  it('given create モードでレンダリングされるとき then "写真から入力" ボタンが表示される', () => {
    // Arrange & Act
    render(<NewBeanForm />)

    // Assert: PhotoImportButton モックが描画されている
    const btn = screen.getByTestId('photo-import-button')
    expect(btn).toBeDefined()
  })

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

    // Assert: Country select (aria-label="Select country") の値が Ethiopia になっていること
    await waitFor(() => {
      const countrySelect = screen.getByRole('combobox', { name: 'Select country' }) as HTMLSelectElement
      expect(countrySelect.value).toBe('Ethiopia')
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

  it('given ユーザーが Roast を変更後に onExtracted が呼ばれたとき then Roast の値は維持される（LLM は roast を更新しない）', async () => {
    // Arrange
    render(<NewBeanForm />)

    // Roast を French に変更
    const roastSelect = screen.getByRole('combobox', { name: 'Select roast level' }) as HTMLSelectElement
    fireEvent.change(roastSelect, { target: { value: 'French' } })
    expect(roastSelect.value).toBe('French')

    // Act: onExtracted を呼ぶ（roast は LLM スコープ外なので影響なし）
    await waitFor(() => expect(capturedOnExtracted.current).not.toBeNull())
    capturedOnExtracted.current!({ name: 'Some Bean' })

    // Assert: Roast は French のまま
    await waitFor(() => {
      expect(roastSelect.value).toBe('French')
    })
  })

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
      priceJpy: null,
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

  // Sprint 1: Price (JPY) フィールドのテスト
  it('S1-P1: given the price field is filled and the form is submitted, then fetch body includes priceJpy', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'bean-1' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBeanForm />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Bean' } })
    fireEvent.change(screen.getByLabelText('Roaster'), { target: { value: 'Test Roaster' } })
    const comboboxes = screen.getAllByRole('combobox')
    fireEvent.change(comboboxes[0], { target: { value: 'Ethiopia' } })
    fireEvent.change(screen.getByLabelText('price (jpy)'), { target: { value: '1500' } })

    fireEvent.click(screen.getByRole('button', { name: 'Add Bean' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as { priceJpy: number }
    expect(body.priceJpy).toBe(1500)
  })

  it('S1-P2: given the price field is empty and the form is submitted, then fetch body includes priceJpy as empty string', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'bean-1' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBeanForm />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Bean' } })
    fireEvent.change(screen.getByLabelText('Roaster'), { target: { value: 'Test Roaster' } })
    const comboboxes = screen.getAllByRole('combobox')
    fireEvent.change(comboboxes[0], { target: { value: 'Ethiopia' } })

    fireEvent.click(screen.getByRole('button', { name: 'Add Bean' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as { priceJpy: string }
    // empty string is sent when no price entered (schema transforms '' to null)
    expect(body.priceJpy).toBe('')
  })

  // Sprint 1: 生産国拡張のテスト
  it('S1-C1: given the form renders, then the country select includes Bolivia and Vietnam', () => {
    render(<NewBeanForm />)

    const countrySelect = screen.getByRole('combobox', { name: 'Select country' }) as HTMLSelectElement
    const optionValues = Array.from(countrySelect.options).map((o) => o.value)
    expect(optionValues).toContain('Bolivia')
    expect(optionValues).toContain('Vietnam')
    expect(optionValues).toContain('Honduras')
    expect(optionValues).toContain('Tanzania')
  })
})
