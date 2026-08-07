import { Box } from '@chakra-ui/react'
import TerminalPreview from '../TerminalPreview'

// The large live preview, bound to the editor draft.
export default function EditorPreviewPane({ draft }) {
  return (
    <Box>
      <TerminalPreview t={draft} size="lg" />
    </Box>
  )
}
