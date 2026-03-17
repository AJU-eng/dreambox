import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    allowedHosts:[
      '50ce-103-146-175-155.ngrok-free.app',
      'four-pandas-spend.loca.lt',
      'few-gifts-share.loca.lt',
      'small-lights-start.loca.lt'
    
    ]
  }
})
