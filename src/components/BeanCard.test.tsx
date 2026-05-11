import React from 'react'
import { render } from '@testing-library/react-native'
import { BeanCard } from './BeanCard'
import type { Bean } from '@/types/domain'

const mockBean: Bean = {
  id: 'test-id-001',
  userId: 'user-001',
  name: 'Yirgacheffe Natural',
  country: 'Ethiopia',
  region: 'Sidama',
  farm: 'Konga',
  process: 'Natural',
  variety: 'Heirloom',
  roast: 'Light',
  roaster: 'Blue Bottle',
  priceJpy: 2500,
  notes: 'Very fruity',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
}

describe('BeanCard', () => {
  it('renders the bean name', () => {
    const { getByText } = render(<BeanCard bean={mockBean} />)
    expect(getByText('Yirgacheffe Natural')).toBeTruthy()
  })

  it('renders roaster and roast level', () => {
    const { getByText } = render(<BeanCard bean={mockBean} />)
    expect(getByText('Blue Bottle · Light')).toBeTruthy()
  })

  it('renders country name', () => {
    const { getByText } = render(<BeanCard bean={mockBean} />)
    expect(getByText('Ethiopia')).toBeTruthy()
  })
})
