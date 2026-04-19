import { NextResponse } from 'next/server'
import { extractorService } from '@/app/beans/extractor/service'
import { InvalidImageError } from '@/app/beans/extractor/errors'
import { LLMApiError, ExtractionParseError } from '@/lib/llm/errors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const
const SERVER_MAX_SIZE = 4.5 * 1024 * 1024

export async function POST(request: Request): Promise<Response> {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request', code: 'INVALID_FILE' },
      { status: 400 }
    )
  }

  const fileEntry = formData.get('file')

  if (!fileEntry || !(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: 'No file provided', code: 'INVALID_FILE' },
      { status: 400 }
    )
  }

  const file = fileEntry

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return NextResponse.json(
      { error: 'Invalid file type', code: 'INVALID_FILE' },
      { status: 400 }
    )
  }

  if (file.size > SERVER_MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large', code: 'FILE_TOO_LARGE' },
      { status: 400 }
    )
  }

  try {
    const fields = await extractorService.extractFromImage(file)
    return NextResponse.json(fields, { status: 200 })
  } catch (err) {
    if (err instanceof InvalidImageError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 }
      )
    }
    if (err instanceof LLMApiError || err instanceof ExtractionParseError) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[extract] LLM error:', message)
      return NextResponse.json(
        { error: 'Extraction failed', code: 'EXTRACTION_FAILED' },
        { status: 503 }
      )
    }
    console.error('[extract] Unexpected error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
