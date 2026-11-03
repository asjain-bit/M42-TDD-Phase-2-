import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { NdaStage, NDA_TEMPLATE_URL } from './NdaStage'
import { INITIAL_PARTNERSHIP_REQUESTS, type PartnershipRequest } from '@/types/partnership.types'

const base: PartnershipRequest = {
  ...INITIAL_PARTNERSHIP_REQUESTS[1],
  nda: undefined,
  alignmentPackOn: undefined,
  discovery: undefined,
}
const signedRequest: PartnershipRequest = {
  ...base,
  nda: {
    versions: [
      {
        version: 1,
        signed: false,
        fileName: 'ADHDS_NDA_Execution_Form_v1.0.docx',
        uploadedOn: '14 Oct 2026',
        uploadedBy: 'Zaid Al Ali',
      },
      {
        version: 2,
        signed: true,
        fileName: 'nda_v2.pdf',
        uploadedOn: '14 Oct 2026',
        uploadedBy: 'Zaid Al Ali',
      },
      {
        version: 3,
        signed: true,
        fileName: 'nda_v3.pdf',
        uploadedOn: '15 Oct 2026',
        uploadedBy: 'Zaid Al Ali',
      },
    ],
  },
  alignmentPackOn: '14 Oct 2026',
}
const file = (name: string) => new File(['x'], name)

const renderStage = (
  request: PartnershipRequest,
  role: 'director' | 'sponsor' | 'viewer',
  extra: { onAction?: () => void; onNext?: () => void } = {}
) =>
  render(
    <NdaStage
      request={request}
      role={role}
      onAction={extra.onAction ?? vi.fn()}
      onNext={extra.onNext ?? vi.fn()}
    />
  )

describe('NdaStage: the Director signs the NDA', () => {
  it('shows the template as a file card, with no Download next to the title', () => {
    renderStage(base, 'director')
    expect(screen.getByRole('heading', { level: 2, name: 'NDA' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Download/ })).not.toBeInTheDocument()
    expect(screen.getByText('ADHDS-NDA-Execution-Form-v1.0.docx')).toBeInTheDocument()
    expect(screen.getByText(/Version 1 · unsigned template/)).toBeInTheDocument()
  })

  it('previews the template in a document viewer, with its download, closed by X or Esc', async () => {
    const user = userEvent.setup()
    renderStage(base, 'director')
    await user.click(screen.getByRole('button', { name: /Preview/ }))
    const viewer = screen.getByRole('dialog', { name: 'ADHDS-NDA-Execution-Form-v1.0.docx' })
    const download = within(viewer).getByRole('link', { name: /Download/ })
    expect(download).toHaveAttribute('href', NDA_TEMPLATE_URL)
    expect(download).toHaveAttribute('download')
    // Only the pages scroll, inside the viewer
    const pages = within(viewer).getByLabelText('NDA execution form')
    expect(pages.className).toContain('overflow-y-auto')
    expect(pages.className).toContain('flex-1')
    await user.click(within(viewer).getByRole('button', { name: 'Close preview' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Preview/ }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fills the page height, with the acknowledgement in the footer', () => {
    const { container } = renderStage(base, 'director')
    expect((container.firstChild as HTMLElement).className).toContain('h-full')
    const checkbox = screen.getByRole('checkbox', {
      name: 'I acknowledge that the document has been signed by the vendor',
    })
    expect((checkbox.closest('div.sticky') as HTMLElement).className).toContain('bottom-0')
  })

  it('asks for the signed copy in a popup once the signature is acknowledged', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    renderStage(base, 'director', { onAction })
    const upload = screen.getByRole('button', { name: /Upload signed NDA/ })
    expect(upload).toBeDisabled()
    await user.click(
      screen.getByRole('checkbox', {
        name: 'I acknowledge that the document has been signed by the vendor',
      })
    )
    await user.click(upload)
    const popup = screen.getByRole('dialog', { name: 'Upload signed NDA' })
    await user.upload(
      within(popup).getByLabelText('Signed NDA file'),
      file('MedTech_Signed_NDA.pdf')
    )
    await user.click(within(popup).getByRole('button', { name: 'Upload' }))
    expect(onAction).toHaveBeenCalledWith({ type: 'uploadNda', fileName: 'MedTech_Signed_NDA.pdf' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('NdaStage: once the NDA is signed', () => {
  it('shows the signed copy as a file card, with the versions in a dropdown', async () => {
    const user = userEvent.setup()
    const two = { ...signedRequest, nda: { versions: signedRequest.nda!.versions.slice(0, 2) } }
    renderStage(two, 'director')
    const versions = screen.getByLabelText('NDA version')
    expect(versions).toHaveValue('2')
    expect(
      within(versions)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['v2 (current) · signed copy', 'v1 · unsigned template'])
    expect(screen.getByRole('heading', { name: 'Signed NDA' })).toBeInTheDocument()
    expect(screen.getByText('nda_v2.pdf')).toBeInTheDocument()
    expect(
      screen.getByText('Version 2 · signed copy · Zaid Al Ali, 14 Oct 2026')
    ).toBeInTheDocument()
    await user.selectOptions(versions, '1')
    expect(screen.getByRole('heading', { name: 'Unsigned template' })).toBeInTheDocument()
    expect(screen.getByText('ADHDS-NDA-Execution-Form-v1.0.docx')).toBeInTheDocument()
  })

  it('offers no new version and no alignment pack', () => {
    renderStage(signedRequest, 'director')
    expect(screen.queryByRole('button', { name: 'Upload new version' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Alignment Pack' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', {
        name: 'I acknowledge that the document has been signed by the vendor',
      })
    ).toBeDisabled()
  })

  it('moves on to the Discovery Call with Proceed, for every role', async () => {
    const user = userEvent.setup()
    for (const role of ['director', 'sponsor', 'viewer'] as const) {
      const onNext = vi.fn()
      const { unmount } = renderStage(signedRequest, role, { onNext })
      await user.click(screen.getByRole('button', { name: 'Proceed' }))
      expect(onNext).toHaveBeenCalledTimes(1)
      unmount()
    }
  })

  it('shows no context upload: that belongs to the discovery call', () => {
    renderStage(signedRequest, 'director')
    expect(screen.queryByLabelText('Upload meeting notes, transcript or recording')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
  })
})

describe('NdaStage: everyone else', () => {
  it('never shows the template, only a wait until the NDA is signed', () => {
    renderStage(base, 'sponsor')
    expect(
      screen.getByText(/Waiting for the Director to upload the signed NDA/)
    ).toBeInTheDocument()
    expect(screen.queryByText('ADHDS-NDA-Execution-Form-v1.0.docx')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Preview/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('sees the signed NDA read-only once it is in', () => {
    renderStage(signedRequest, 'viewer')
    expect(screen.getByRole('heading', { name: 'Signed NDA' })).toBeInTheDocument()
    expect(screen.getByLabelText('NDA version')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Preview/ })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload new version' })).not.toBeInTheDocument()
  })
})
