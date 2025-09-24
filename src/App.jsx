import { Routes, Route } from 'react-router-dom'

import CadastroUsuario from './pages/cadastro.jsx'
import Login from './pages/login.jsx'
import RecuperarSenha from './pages/recuperar-senha.jsx'

function App() {

  return (
    <>
    <Routes>
        <Route path="/cadastro" element={<CadastroUsuario />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
    </Routes>
    </>
  )
}

export default App
