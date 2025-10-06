import { Routes, Route } from 'react-router-dom' // Routes: agrupa as rotas | Route: define uma rota
import { RequireAuth, RequireAdmin } from './routes/ProtectedRoutes.jsx' // rotas protegidas

// Páginas
import CadastroUsuario from './pages/cadastro.jsx'
import Login from './pages/login.jsx'
import RecuperarSenha from './pages/recuperar-senha.jsx'
import Home from './pages/home.jsx'
import HomeUsuario from './pages/usuario/homeUsuario.jsx'
import EditarPerfil from './pages/usuario/editarPerfil.jsx'
import HomeAdmin from './pages/admin/homeAdmin.jsx'
import AdminCarreira from './pages/admin/carreira.jsx'
import AdminCurso from './pages/admin/curso.jsx'
import AdminConhecimento from './pages/admin/conhecimento.jsx'
import AdminVaga from './pages/admin/vaga.jsx'

// Componente principal da aplicação
function App() {
  return (
    <>
    <Routes>
    <Route path="/" element={<Home />} />
        <Route path="/cadastro" element={<CadastroUsuario />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route element={<RequireAuth />}>
          <Route path="/homeUsuario" element={<HomeUsuario />} />
          <Route path="/usuario/editar-perfil" element={<EditarPerfil />} />
        </Route>
        <Route element={<RequireAdmin />}>
          <Route path="/homeAdmin" element={<HomeAdmin />} />
          <Route path="/admin/carreira" element={<AdminCarreira />} />
          <Route path="/admin/curso" element={<AdminCurso />} />
          <Route path="/admin/conhecimento" element={<AdminConhecimento />} />
          <Route path="/admin/vaga" element={<AdminVaga />} />
        </Route>
    </Routes>
    </>
  )
}
export default App
