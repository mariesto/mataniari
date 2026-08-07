import '@fontsource/rubik/500.css'
import '@fontsource/rubik/600.css'
import '@fontsource/rubik/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { chakraTheme } from './theme/chakraTheme'
import App from './App'

createRoot(document.getElementById('root')).render(
  <ChakraProvider theme={chakraTheme}>
    <App />
  </ChakraProvider>,
)
