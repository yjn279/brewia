export interface Lab {
  L: number
  a: number
  b: number
}

/**
 * Converts sRGB (0-255 per channel) to CIELAB (D65 illuminant).
 *
 * Pipeline:
 *   sRGB → linear RGB  (IEC 61966-2-1 inverse gamma)
 *   linear RGB → XYZ   (sRGB standard matrix, D65)
 *   XYZ → CIELAB       (D65 white point)
 */
export function srgbToLab(r: number, g: number, b: number): Lab {
  // --- sRGB → linear RGB ---
  const toLinear = (c: number): number => {
    const n = c / 255
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
  }

  const rl = toLinear(r)
  const gl = toLinear(g)
  const bl = toLinear(b)

  // --- linear RGB → XYZ (D65) ---
  const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl
  const Y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl
  const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl

  // --- XYZ → CIELAB (D65 white point) ---
  const Xn = 0.95047
  const Yn = 1.00000
  const Zn = 1.08883

  const epsilon = (6 / 29) ** 3 // ~0.008856
  const kappa = (1 / 3) * (29 / 6) ** 2 // ~7.787

  const f = (t: number): number =>
    t > epsilon ? t ** (1 / 3) : kappa * t + 4 / 29

  const fx = f(X / Xn)
  const fy = f(Y / Yn)
  const fz = f(Z / Zn)

  const L = 116 * fy - 16
  const a = 500 * (fx - fy)
  const bStar = 200 * (fy - fz)

  return { L, a, b: bStar }
}
