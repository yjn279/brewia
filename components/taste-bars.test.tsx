import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TasteBars } from '@/components/taste-bars'

const defaultProps = {
  aroma: 4,
  acidity: 3,
  sweetness: 4,
  body: 3,
  overall: 5,
}

describe('TasteBars', () => {
  it('renders all 5 attribute labels', () => {
    render(<TasteBars {...defaultProps} />)
    expect(screen.getByText('Aroma')).toBeDefined()
    expect(screen.getByText('Acidity')).toBeDefined()
    expect(screen.getByText('Sweetness')).toBeDefined()
    expect(screen.getByText('Body')).toBeDefined()
    expect(screen.getByText('Overall')).toBeDefined()
  })

  it('renders the numeric value for each attribute', () => {
    render(<TasteBars {...defaultProps} />)
    // aroma=4, sweetness=4 both render "4" — getAllByText handles duplicates
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1)
    // acidity=3, body=3 both render "3"
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
    // overall=5
    expect(screen.getByText('5')).toBeDefined()
  })

  it('renders exactly 5 progressbar elements', () => {
    render(<TasteBars {...defaultProps} />)
    const bars = screen.getAllByRole('progressbar')
    expect(bars).toHaveLength(5)
  })

  it('progressbars carry correct aria-valuenow, aria-valuemin, aria-valuemax', () => {
    render(<TasteBars {...defaultProps} />)
    const bars = screen.getAllByRole('progressbar')
    // First progressbar is Aroma (value 4)
    const aromaBar = bars[0]
    expect(Number(aromaBar.getAttribute('aria-valuenow'))).toBe(4)
    expect(Number(aromaBar.getAttribute('aria-valuemax'))).toBe(5)
    // aria-valuemin is 0 or 1; either is acceptable
    const min = Number(aromaBar.getAttribute('aria-valuemin'))
    expect(min === 0 || min === 1).toBe(true)
  })

  it('each progressbar is discoverable by its attribute accessible name', () => {
    render(<TasteBars {...defaultProps} />)
    expect(screen.getByRole('progressbar', { name: 'Aroma' })).toBeDefined()
    expect(screen.getByRole('progressbar', { name: 'Acidity' })).toBeDefined()
    expect(screen.getByRole('progressbar', { name: 'Sweetness' })).toBeDefined()
    expect(screen.getByRole('progressbar', { name: 'Body' })).toBeDefined()
    expect(screen.getByRole('progressbar', { name: 'Overall' })).toBeDefined()
  })

  it('value of 0 renders as "-" instead of "0", and all 5 bars still exist', () => {
    render(
      <TasteBars aroma={0} acidity={0} sweetness={0} body={0} overall={0} />
    )
    // The digit "0" should not appear as a visible value cell
    expect(screen.queryByText('0')).toBeNull()
    // Each of the 5 rows shows a dash
    expect(screen.getAllByText('-')).toHaveLength(5)
    // Progressbars still present with aria-valuenow=0
    const bars = screen.getAllByRole('progressbar')
    expect(bars).toHaveLength(5)
    bars.forEach((bar) => {
      expect(Number(bar.getAttribute('aria-valuenow'))).toBe(0)
    })
  })
})
