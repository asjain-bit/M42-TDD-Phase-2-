export interface DocumentFileCardProps {
  fileName: string
  /** One line on what the file is, e.g. "Version 1 · unsigned template · 188 KB" */
  meta: string
  /** Opens the file in the document viewer */
  onPreview: () => void
  className?: string
}
