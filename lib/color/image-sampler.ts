export async function sampleImageColor(file: File): Promise<{ r: number; g: number; b: number }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Unsupported file type')
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to load image'))
      image.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas 2d context')
    }

    ctx.drawImage(img, 0, 0, 256, 256)

    const x = Math.round(256 * 0.30)
    const y = Math.round(256 * 0.30)
    const w = Math.round(256 * 0.40)
    const h = Math.round(256 * 0.40)

    const imageData = ctx.getImageData(x, y, w, h)
    const { data } = imageData

    let sumR = 0
    let sumG = 0
    let sumB = 0
    const pixelCount = data.length / 4

    for (let i = 0; i < data.length; i += 4) {
      sumR += data[i]
      sumG += data[i + 1]
      sumB += data[i + 2]
    }

    return {
      r: sumR / pixelCount,
      g: sumG / pixelCount,
      b: sumB / pixelCount,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
