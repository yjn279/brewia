import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/color/image-sampler', () => ({
  sampleImageColor: vi.fn(),
}))
vi.mock('@/lib/color/srgb-to-lab', () => ({
  srgbToLab: vi.fn(),
}))
vi.mock('@/lib/color/roast-estimator', () => ({
  estimateRoastLevel: vi.fn(),
}))

import { RoastPhotoPicker } from '@/components/roast-photo-picker'
import { sampleImageColor } from '@/lib/color/image-sampler'
import { srgbToLab } from '@/lib/color/srgb-to-lab'
import { estimateRoastLevel } from '@/lib/color/roast-estimator'

const mockSampleImageColor = vi.mocked(sampleImageColor)
const mockSrgbToLab = vi.mocked(srgbToLab)
const mockEstimateRoastLevel = vi.mocked(estimateRoastLevel)

function makeImageFile(name = 'bean.jpg') {
  return new File(['dummy'], name, { type: 'image/jpeg' })
}

describe('RoastPhotoPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('S4-T1: given RoastPhotoPicker renders, when rendered, then a file input with accept="image/*" exists', () => {
    render(<RoastPhotoPicker onEstimate={vi.fn()} />)
    const input = screen.getByTestId('photo-input') as HTMLInputElement
    expect(input.type).toBe('file')
    expect(input.accept).toBe('image/*')
  })

  it('S4-T2: given a file is selected, when sampleImageColor is pending, then a loading indicator is visible', async () => {
    let resolve: ((value: { r: number; g: number; b: number }) => void) | undefined
    mockSampleImageColor.mockReturnValue(new Promise((res) => { resolve = res }))

    render(<RoastPhotoPicker onEstimate={vi.fn()} />)
    fireEvent.change(screen.getByTestId('photo-input'), {
      target: { files: [makeImageFile()] },
    })

    await screen.findByRole('status')
    // cleanup: resolve the pending promise so test doesn't leak
    resolve?.({ r: 100, g: 100, b: 100 })
  })

  it('S4-T3: given sampleImageColor resolves and estimateRoastLevel returns "Medium", when file is selected, then onEstimate is called with "Medium"', async () => {
    mockSampleImageColor.mockResolvedValue({ r: 158, g: 108, b: 65 })
    mockSrgbToLab.mockReturnValue({ L: 50.0, a: 12.0, b: 20.0 })
    mockEstimateRoastLevel.mockReturnValue('Medium')

    const onEstimate = vi.fn()
    render(<RoastPhotoPicker onEstimate={onEstimate} />)

    fireEvent.change(screen.getByTestId('photo-input'), {
      target: { files: [makeImageFile()] },
    })

    await waitFor(() => expect(onEstimate).toHaveBeenCalledTimes(1))
    expect(onEstimate).toHaveBeenCalledWith('Medium')
  })

  it('S4-T4: given estimation succeeds, when onEstimate is called, then loading indicator is no longer visible', async () => {
    mockSampleImageColor.mockResolvedValue({ r: 158, g: 108, b: 65 })
    mockSrgbToLab.mockReturnValue({ L: 50.0, a: 12.0, b: 20.0 })
    mockEstimateRoastLevel.mockReturnValue('Medium')

    render(<RoastPhotoPicker onEstimate={vi.fn()} />)
    fireEvent.change(screen.getByTestId('photo-input'), {
      target: { files: [makeImageFile()] },
    })

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
  })

  it('S4-T5: given sampleImageColor rejects, when file is selected, then onEstimate is not called and an error message is visible', async () => {
    mockSampleImageColor.mockRejectedValue(new Error('canvas error'))

    const onEstimate = vi.fn()
    render(<RoastPhotoPicker onEstimate={onEstimate} />)

    fireEvent.change(screen.getByTestId('photo-input'), {
      target: { files: [makeImageFile()] },
    })

    await screen.findByRole('alert')
    expect(onEstimate).not.toHaveBeenCalled()
  })

  it('S4-T6: given estimateRoastLevel returns null (out-of-range), when file is selected, then onEstimate is not called and an error message is visible', async () => {
    mockSampleImageColor.mockResolvedValue({ r: 255, g: 255, b: 255 })
    mockSrgbToLab.mockReturnValue({ L: 100.0, a: 0.0, b: 0.0 })
    mockEstimateRoastLevel.mockReturnValue(null)

    const onEstimate = vi.fn()
    render(<RoastPhotoPicker onEstimate={onEstimate} />)

    fireEvent.change(screen.getByTestId('photo-input'), {
      target: { files: [makeImageFile()] },
    })

    await screen.findByRole('alert')
    expect(onEstimate).not.toHaveBeenCalled()
  })

  it('S4-T7: given first estimation succeeds and second fails, when two files are selected sequentially, then only the latest error is visible', async () => {
    mockSampleImageColor
      .mockResolvedValueOnce({ r: 158, g: 108, b: 65 })
      .mockRejectedValueOnce(new Error('second error'))
    mockSrgbToLab.mockReturnValue({ L: 50.0, a: 12.0, b: 20.0 })
    mockEstimateRoastLevel.mockReturnValue('Medium')

    render(<RoastPhotoPicker onEstimate={vi.fn()} />)
    const input = screen.getByTestId('photo-input')

    fireEvent.change(input, { target: { files: [makeImageFile()] } })
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())

    fireEvent.change(input, { target: { files: [makeImageFile('second.jpg')] } })
    await screen.findByRole('alert')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
  })

  it('S4-T8: given estimation succeeds with L*=50.0, when file is processed, then L* value "50.0" and level "Medium" are visible', async () => {
    mockSampleImageColor.mockResolvedValue({ r: 158, g: 108, b: 65 })
    mockSrgbToLab.mockReturnValue({ L: 50.0, a: 12.0, b: 20.0 })
    mockEstimateRoastLevel.mockReturnValue('Medium')

    render(<RoastPhotoPicker onEstimate={vi.fn()} />)
    fireEvent.change(screen.getByTestId('photo-input'), {
      target: { files: [makeImageFile()] },
    })

    await screen.findByText(/50\.0/)
    await screen.findByText(/Medium/)
  })

  it('S4-T9: given an empty FileList, when the input change event fires, then sampleImageColor is not called', () => {
    mockSampleImageColor.mockResolvedValue({ r: 0, g: 0, b: 0 })
    render(<RoastPhotoPicker onEstimate={vi.fn()} />)

    fireEvent.change(screen.getByTestId('photo-input'), {
      target: { files: [] },
    })

    expect(mockSampleImageColor).not.toHaveBeenCalled()
  })

  it('S4-T10: given two files are selected and the first resolves after the second, when both complete, then onEstimate is called only with the latest result (not overwritten by stale)', async () => {
    let resolveFirst: ((value: { r: number; g: number; b: number }) => void) | undefined
    let resolveSecond: ((value: { r: number; g: number; b: number }) => void) | undefined

    mockSampleImageColor
      .mockImplementationOnce(() => new Promise((res) => { resolveFirst = res }))
      .mockImplementationOnce(() => new Promise((res) => { resolveSecond = res }))

    // second resolves before first, so srgbToLab/estimateRoastLevel are called for second first
    mockSrgbToLab
      .mockReturnValueOnce({ L: 38, a: 0, b: 0 })  // second (resolves first)
      .mockReturnValueOnce({ L: 50, a: 0, b: 0 })  // first (resolves later, stale)

    mockEstimateRoastLevel
      .mockReturnValueOnce('City')    // second (resolves first)
      .mockReturnValueOnce('Medium')  // first (resolves later, stale)

    const onEstimate = vi.fn()
    render(<RoastPhotoPicker onEstimate={onEstimate} />)
    const input = screen.getByTestId('photo-input')

    // First file selection (will be slow)
    fireEvent.change(input, { target: { files: [makeImageFile('first.jpg')] } })
    // Second file selection (will resolve first)
    fireEvent.change(input, { target: { files: [makeImageFile('second.jpg')] } })

    // Resolve second first, then first
    resolveSecond?.({ r: 90, g: 60, b: 40 })
    await waitFor(() => expect(onEstimate).toHaveBeenCalledWith('City'))

    resolveFirst?.({ r: 150, g: 100, b: 70 })
    // Give microtasks a chance to run
    await new Promise((r) => setTimeout(r, 0))

    // The stale first result must NOT override the latest City
    expect(onEstimate).toHaveBeenCalledTimes(1)
    expect(onEstimate).not.toHaveBeenCalledWith('Medium')
  })
})
