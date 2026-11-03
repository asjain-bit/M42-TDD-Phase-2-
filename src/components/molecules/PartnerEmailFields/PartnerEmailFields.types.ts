export interface PartnerEmail {
  to: string
  subject: string
  body: string
}

export interface PartnerEmailFieldsProps {
  email: PartnerEmail
  /** Called with the whole email when the subject or the message is edited */
  onChange: (email: PartnerEmail) => void
  /** Keeps the field ids unique when more than one email is on the page */
  idPrefix: string
  /** Accessible name of the group */
  label?: string
}
