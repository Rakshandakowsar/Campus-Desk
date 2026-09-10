import type { ReactElement } from 'react'

declare function HelpModal(props: {
  onClose: () => void
  onOpenAction: (action: string) => void
}): ReactElement

export default HelpModal
