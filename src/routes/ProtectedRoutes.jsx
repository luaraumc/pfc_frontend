import { Navigate, Outlet } from 'react-router-dom'; // Navigate: gerir a navegação | Outlet: renderiza componentes
import { useEffect, useState } from 'react'; // useEffect: executar funções | useState: gerenciar estado de componentes
import { getAccessToken, VerificarTokenExpirado, refreshAccessToken } from '../utils/auth'; // funções de autenticação

// Proteger rotas que requerem autenticação
export function RequireAuth() {
  const [status, setStatus] = useState('checking'); // define o estado inicial como 'checking'
  useEffect(() => {
    const token = getAccessToken(); // obtém o token de acesso
    if (!token) {
      setStatus('redirect'); // se não houver token redireciona para login
      return;
    }
    if (VerificarTokenExpirado(token)) {
      refreshAccessToken()
        .then(() => setStatus('ok')) // se o token for renovado com sucesso permite o acesso
        .catch(() => setStatus('redirect')); // se a renovação falhar redireciona para login
      return;
    }
    setStatus('ok'); // se o token for válido permite o acesso
  }, []);

  if (status === 'checking') return null;
  if (status === 'redirect') return <Navigate to="/login" replace />; // redireciona para login
  return <Outlet />;
}

// Proteger rotas que requerem privilégios de administrador
export function RequireAdmin() {
  const [status, setStatus] = useState('checking'); // define o estado inicial como 'checking'
  useEffect(() => {
    const token = getAccessToken(); // obtém o token de acesso
    if (!token) {
      setStatus('toLogin'); // se não houver token redireciona para login
      return;
    }
    const garantirToken = async () => {
      if (VerificarTokenExpirado(token)) {
        try {
          await refreshAccessToken(); // tenta renovar o token
        } catch {
          setStatus('toLogin'); // se a renovação falhar redireciona para login
          return;
        }
      }
      const isAdmin = localStorage.getItem('is_admin') === 'true'; // verifica se o usuário é admin
      setStatus(isAdmin ? 'ok' : 'toUser'); // se for admin permite o acesso, senão redireciona para a página do usuário
    };
    garantirToken(); // chama a função para garantir o token
  }, []);

  if (status === 'checking') return null;
  if (status === 'toLogin') return <Navigate to="/login" replace />; // redireciona para login
  if (status === 'toUser') return <Navigate to="/homeUsuario" replace />; // redireciona para a página do usuário
  return <Outlet />;
}
