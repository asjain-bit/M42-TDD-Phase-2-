import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HighlightLegend } from './HighlightLegend'

describe('HighlightLegend', () => {
  it('lists the three highlight tones in order', () => {
    render(<HighlightLegend />)
    const legend = screen.getByRole('list', { name: 'Highlight legend' })
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((li) => li.textContent)
    ).toEqual(['Critical', 'Needs attention', 'Positive'])
  })
})
