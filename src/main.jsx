import { BrowserRouter } from 'react-router-dom'; // manter a URL sincronizada
import { StrictMode } from 'react' // identificar problemas potenciais na aplicação
import { createRoot } from 'react-dom/client' // criar a raiz da aplicação React
import './index.css' // tailwindcss
import App from './App.jsx' // componente principal da aplicação

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
