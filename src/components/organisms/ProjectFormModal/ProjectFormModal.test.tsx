import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ProjectFormModal } from './ProjectFormModal'
import { EXISTING_PROJECTS } from '@/types/partnership.types'

describe('ProjectFormModal', () => {
  it('asks for the required fields before adding a project', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <ProjectFormModal
        owners={['Riza Sayeed']}
        vendorOptions={[]}
        onSave={onSave}
        onClose={vi.fn()}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Add project' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getAllByText('This field is required')).toHaveLength(5)
  })

  it('edits a project and keeps its id out of the draft', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const project = EXISTING_PROJECTS[0]
    render(
      <ProjectFormModal
        initial={project}
        owners={['Riza Sayeed']}
        vendorOptions={[]}
        onSave={onSave}
        onClose={vi.fn()}
      />
    )
    await user.clear(screen.getByLabelText(/Project name/))
    await user.type(screen.getByLabelText(/Project name/), 'Renamed')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith(expect.not.objectContaining({ id: project.id }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Renamed', owner: project.owner, team: project.team })
    )
  })
})
