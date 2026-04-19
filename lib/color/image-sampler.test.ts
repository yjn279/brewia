import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sampleImageColor } from '@/lib/color/image-sampler'

function makeImageDataStub(r: number, g: number, b: number, width = 256, height = 256) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = 255
  }
  return { data, width, height }
}

function installCanvasMock(r: number, g: number, b: number) {
  const getImageDataMock = vi.fn().mockReturnValue(makeImageDataStub(r, g, b))
  const drawImageMock = vi.fn()
  const ctx2d = {
    drawImage: drawImageMock,
    getImageData: getImageDataMock,
  }
  const canvasMock = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(ctx2d),
  } as unknown as HTMLCanvasElement

  const originalCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return canvasMock
    return originalCreate(tag)
  })
  return { getImageDataMock, drawImageMock, canvasMock }
}

function installNullContextCanvasMock() {
  const canvasMock = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(null),
  } as unknown as HTMLCanvasElement

  const originalCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return canvasMock
    return originalCreate(tag)
  })
}

function installImageMock() {
  class ImageMock {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    private _src = ''
    get src() { return this._src }
    set src(v: string) {
      this._src = v
      queueMicrotask(() => this.onload?.())
    }
  }
  vi.stubGlobal('Image', ImageMock)
}

describe('sampleImageColor', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock'),
      revokeObjectURL: vi.fn(),
    })
    installImageMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('S3-T1: given a uniform image with rgb(186,141,93), when sampleImageColor is called, then returns approx {r:186, g:141, b:93}', async () => {
    installCanvasMock(186, 141, 93)
    const file = new File(['dummy'], 'bean.jpg', { type: 'image/jpeg' })
    const result = await sampleImageColor(file)
    expect(result.r).toBeCloseTo(186, 0)
    expect(result.g).toBeCloseTo(141, 0)
    expect(result.b).toBeCloseTo(93, 0)
  })

  it('S3-T2: given a uniform image with rgb(61,45,39), when sampleImageColor is called, then returns approx {r:61, g:45, b:39}', async () => {
    installCanvasMock(61, 45, 39)
    const file = new File(['dummy'], 'dark.jpg', { type: 'image/jpeg' })
    const result = await sampleImageColor(file)
    expect(result.r).toBeCloseTo(61, 0)
    expect(result.g).toBeCloseTo(45, 0)
    expect(result.b).toBeCloseTo(39, 0)
  })

  it('S3-T3: given a file with type "application/pdf", when sampleImageColor is called, then it throws an Error', async () => {
    const file = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' })
    await expect(sampleImageColor(file)).rejects.toThrow()
  })

  it('S3-T4: given a file with empty type, when sampleImageColor is called, then it throws an Error', async () => {
    const file = new File(['dummy'], 'noext', { type: '' })
    await expect(sampleImageColor(file)).rejects.toThrow()
  })

  it('S3-T5: given canvas.getContext returns null, when sampleImageColor is called, then it throws an Error', async () => {
    installNullContextCanvasMock()
    const file = new File(['dummy'], 'bean.jpg', { type: 'image/jpeg' })
    await expect(sampleImageColor(file)).rejects.toThrow()
  })

  it('S3-T6: given a valid image, when sampleImageColor is called, then getImageData is called with x=77, y=77, w=102, h=102 (centered 40% region)', async () => {
    const { getImageDataMock } = installCanvasMock(100, 100, 100)
    const file = new File(['dummy'], 'bean.jpg', { type: 'image/jpeg' })
    await sampleImageColor(file)
    const call = getImageDataMock.mock.calls[0]
    expect(call[0]).toBeGreaterThanOrEqual(76)
    expect(call[0]).toBeLessThanOrEqual(78)
    expect(call[1]).toBeGreaterThanOrEqual(76)
    expect(call[1]).toBeLessThanOrEqual(78)
    expect(call[2]).toBeGreaterThanOrEqual(101)
    expect(call[2]).toBeLessThanOrEqual(103)
    expect(call[3]).toBeGreaterThanOrEqual(101)
    expect(call[3]).toBeLessThanOrEqual(103)
  })

  it('S3-T7: given a valid image, when sampleImageColor resolves, then URL.revokeObjectURL is called', async () => {
    installCanvasMock(100, 100, 100)
    const file = new File(['dummy'], 'bean.jpg', { type: 'image/jpeg' })
    await sampleImageColor(file)
    const urlObj = globalThis.URL as unknown as { revokeObjectURL: ReturnType<typeof vi.fn> }
    expect(urlObj.revokeObjectURL).toHaveBeenCalled()
  })

  it('S3-T8: given canvas.getContext returns null, when sampleImageColor rejects, then URL.revokeObjectURL is still called (cleanup)', async () => {
    installNullContextCanvasMock()
    const file = new File(['dummy'], 'bean.jpg', { type: 'image/jpeg' })
    await expect(sampleImageColor(file)).rejects.toThrow()
    const urlObj = globalThis.URL as unknown as { revokeObjectURL: ReturnType<typeof vi.fn> }
    expect(urlObj.revokeObjectURL).toHaveBeenCalled()
  })

  it('S3-T9: given image.onerror fires, when sampleImageColor is called, then it rejects and URL.revokeObjectURL is called', async () => {
    installCanvasMock(0, 0, 0)
    // Replace the Image mock to trigger onerror instead of onload
    class ErrorImageMock {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      private _src = ''
      get src() { return this._src }
      set src(v: string) {
        this._src = v
        queueMicrotask(() => this.onerror?.())
      }
    }
    vi.stubGlobal('Image', ErrorImageMock)

    const file = new File(['dummy'], 'broken.jpg', { type: 'image/jpeg' })
    await expect(sampleImageColor(file)).rejects.toThrow()
    const urlObj = globalThis.URL as unknown as { revokeObjectURL: ReturnType<typeof vi.fn> }
    expect(urlObj.revokeObjectURL).toHaveBeenCalled()
  })
})
