import { defineConfig } from 'vite';
export default defineConfig(({mode})=>({
  base:'./',
  server:{host:'0.0.0.0',port:4173,strictPort:true,proxy:{'/capture':'http://localhost:4181','/points':'http://localhost:4181'},allowedHosts:['terminal.local']},
  build:{target:'es2022',chunkSizeWarningLimit:900,assetsDir:mode==='pages'?'web-assets':'assets',copyPublicDir:mode!=='pages'}
}));
