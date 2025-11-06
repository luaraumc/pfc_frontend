
const API_URL = import.meta.env.VITE_API_URL ?? 'https://pfcbackend-production-668a.up.railway.app'; // URL da API backend

// Pega os dados de um JWT e transforma em JSON
export function transformarJwt(token) {
    
    // Entrada: uma string JWT no formato header.payload.signature (dois “.”)
    // Saída: objeto JSON com os dados do payload ou null se falhar
    
    try {
        const base64Url = token.split('.')[1]; // pega o payload (parte do meio) do JWT
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // converte para base64 padrão
        const padded = base64 + '==='.slice(0, (4 - (base64.length % 4)) % 4); // adiciona padding se necessário
        // Decodifica base64 para string
        const jsonPayload = decodeURIComponent(
        atob(padded) // retorna uma string onde cada caractere representa um byte
            .split('') // divide em caracteres
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)) // converte para percent-encoding (apenas caracteres permitidos em URLs)
            .join('') // junta de volta em string
        );
        return JSON.parse(jsonPayload); // estrutura em JSON
    } catch {
        return null;
    }
}

// Verifica se o token JWT está expirado
export function VerificarTokenExpirado(token, skewSeconds = 30) {
    if (!token) return true; // se não houver token = expirado
    const payload = transformarJwt(token); // decodifica o token
    const exp = payload?.exp; // pega o timestamp de expiração
    if (!exp) return true; // se não tiver timestamp de expiração = expirado
    const now = Math.floor(Date.now() / 1000); // timestamp atual em segundos
    const expNum = typeof exp === 'string' ? parseInt(exp, 10) : exp; // garante que é número
    return now >= (expNum - skewSeconds); // verifica se expirou considerando o skew (skew = margem de segurança em segundos caso esteja perto de expirar)
}

// Pega o access token do localStorage
export function getAccessToken() {
    return localStorage.getItem('access_token');
}

// Armazena o access token no localStorage
export function setAccessToken(token, tokenType) {
    if (token) localStorage.setItem('access_token', token);
    if (tokenType) localStorage.setItem('token_type', tokenType);
}

// Tenta renovar o access token usando o refresh token
export async function refreshAccessToken() {
    // Faz a requisição para o backend para renovar o token.
    // O refresh token é enviado automaticamente pelo browser via cookie HttpOnly.
    const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // necessário para enviar cookies HttpOnly
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        throw new Error(`Refresh failed with status ${res.status}`);
    }
    const data = await res.json().catch(() => ({})); // tenta decodificar JSON, se falhar retorna objeto vazio
    const { access_token, token_type } = data || {}; // pega o novo access token e tipo
    if (!access_token) throw new Error('No access token in refresh response');
    setAccessToken(access_token, token_type); // armazena o novo access token
    return access_token;
}

// Fetch para anexar tokens e renovar se necessário
export async function authFetch(input, init = {}) {
    let access = getAccessToken(); // tenta pegar o access token
    const headers = new Headers(init.headers || {}); // cria um objeto Headers a partir dos headers fornecidos
    if (!access) {
        try {
        access = await refreshAccessToken(); // se não houver access token ainda, tenta obter via refresh
        } catch (e) {
        throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
        }
    }
    if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${access}`); // adiciona o cabeçalho Authorization se não existir
    }
    // As chamadas autenticadas precisam enviar cookies para que o backend receba o refresh cookie quando necessário
    const response = await fetch(input, { ...init, headers, credentials: 'include' }); // faz a requisição com os headers atualizados
    if (response.status === 401 || response.status === 403) {
        try {
        access = await refreshAccessToken(); // tenta renovar o token
        headers.set('Authorization', `Bearer ${access}`); // atualiza o cabeçalho com o novo token
        return await fetch(input, { ...init, headers, credentials: 'include' }); // repete a requisição original
        } catch (e) {
        throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
        }
    }
    return response;
}

// Limpa tokens e dados do usuário e redireciona para login
export function logoutRedirecionar() {
    // solicita ao backend remoção do cookie de refresh (caso exista)
    try {
        fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    } catch (e) {}

    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_email');

    window.location.href = '/login';
}
