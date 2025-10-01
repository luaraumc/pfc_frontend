import { Routes, Route } from 'react-router-dom' // Routes: agrupa as rotas | Route: define uma rota
import { RequireAuth, RequireAdmin } from './routes/ProtectedRoutes.jsx' // rotas protegidas

// Páginas
import CadastroUsuario from './pages/cadastro.jsx'
import Login from './pages/login.jsx'
import RecuperarSenha from './pages/recuperar-senha.jsx'
import Home from './pages/home.jsx'
import HomeUsuario from './pages/usuario/homeUsuario.jsx'
import HomeAdmin from './pages/admin/homeAdmin.jsx'
import AdminCarreira from './pages/admin/carreira.jsx'
import AdminCurso from './pages/admin/curso.jsx'

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
        </Route>
        <Route element={<RequireAdmin />}>
          <Route path="/homeAdmin" element={<HomeAdmin />} />
          <Route path="/admin/carreira" element={<AdminCarreira />} />
          <Route path="/admin/curso" element={<AdminCurso />} />
        </Route>
    </Routes>
    </>
  )
}
export default App