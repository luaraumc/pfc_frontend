import { useMemo, useState } from "react"; // useMemo: armazenamento em cache | useState: gerenciar estado de componentes
import { useNavigate } from "react-router-dom"; // navegação programática (voltar)
import { authFetch } from "../utils/auth"; // fetch autenticado com renovação automática de token

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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

export default function LoginUsuario() {
	// Estados dos campos
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [erro, setErro] = useState("");
	const [mensagem, setMensagem] = useState("");

	// Limpa dados de autenticação
	function clearAuth() {
		try {
			localStorage.removeItem("access_token");
			localStorage.removeItem("refresh_token");
			localStorage.removeItem("token_type");
			localStorage.removeItem("usuario_id");
			localStorage.removeItem("is_admin");
			localStorage.removeItem("usuario_nome");
		} catch {}
	}

	const emailValido = useMemo(() => /.+@.+\..+/.test(email), [email]); // validação de email (com @ e .)

	function validarCampos() {
		if (!email.trim() || !emailValido) return "Informe um e-mail válido"; // trim() remove espaços em branco no início e fim
		if (!senha) return "Informe a senha"; // senha campo obrigatório
		return null;
	}

	// Descobre o perfil do usuário (admin ou comum) e redireciona para a home correta
	async function descobrirPerfilERedirecionar(accessToken) {
		const decoded = transformarJwt(accessToken); // decodifica o token
		const userId = decoded?.sub ? Number(decoded.sub) : null; // pega o ID do usuário do campo "sub" do token
		if (!userId) {
			clearAuth(); // limpa dados de autenticação
			setErro("Não foi possível validar o token retornado. Tente novamente.");
			return;
		}
		try {
			const res = await authFetch(`${API_URL}/usuario/${userId}`); // busca os dados do usuário no backend
			if (!res.ok) throw new Error("Falha ao obter dados do usuário");
			const user = await res.json(); // guarda os dados do usuário em formato JSON
			const isAdmin = !!user?.admin; // verifica se é admin (true/false)
			// Guarda dados úteis em localStorage
			localStorage.setItem("usuario_id", String(userId));
			localStorage.setItem("is_admin", String(isAdmin));
			if (user?.nome) localStorage.setItem("usuario_nome", String(user.nome));
			window.location.href = isAdmin ? "/homeAdmin" : "/homeUsuario"; // redireciona conforme o tipo de usuário
		} catch (e) {
			clearAuth(); // limpa dados de autenticação
			setErro("Não foi possível obter os dados do usuário. Tente novamente.");
			return;
		}
	}

	// Envio do formulário
	async function onSubmit(e) {
		e.preventDefault(); // previne recarregar a página
		setErro(""); // limpa erros anteriores
		setMensagem(""); // limpa mensagens anteriores

		// Validação dos campos
		const erroValid = validarCampos();
		if (erroValid) {
			setErro(erroValid); // mostra o erro de validação
			return;
		}

		// Envia os dados para o backend
		setSubmitting(true);
		try {
			const res = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim(), senha }),
			});
			const data = await res.json().catch(() => ({})); // tenta decodificar JSON, se falhar retorna objeto vazio
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha no login (HTTP ${res.status})`;
				throw new Error(msg);
			}
			const { access_token, refresh_token, token_type } = data; // pega os tokens retornados
			if (!access_token) throw new Error("Token de acesso não retornado");

			// Persistência dos tokens no localStorage
			localStorage.setItem("access_token", access_token);
			if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
			if (token_type) localStorage.setItem("token_type", token_type);

			setMensagem("Login realizado com sucesso. Redirecionando…");
			await descobrirPerfilERedirecionar(access_token); // descobre o perfil e redireciona
		} catch (e) {
			setErro(e.message ?? "Erro ao efetuar login");
		} finally {
			setSubmitting(false); // finaliza o estado de submissão
		}
	}

	const navigate = useNavigate(); // navegação de páginas (voltar)

	// HTML
	return (
			<div className="min-h-screen relative bg-slate-900">
				<button
					onClick={() => navigate(-1)}
					className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
					>
					<span aria-hidden>←</span> Voltar
		    	</button>
				<div className="min-h-screen flex flex-col items-center justify-center p-4">
					<h1 className="text-3xl text-slate-200 font-semibold mb-4 text-center">Entrar</h1>
					<div className="w-full max-w-md bg-slate-950 border border-slate-700 rounded-xl p-6 text-slate-200 shadow-lg">

					{!!erro && (
						<div className="mb-3 p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">
							{erro}
						</div>
					)}
					{!!mensagem && (
						<div className="mb-3 p-3 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">
							{mensagem}
						</div>
					)}

					<form onSubmit={onSubmit} className="space-y-3">
						<div className="flex flex-col">
							<label className="mb-2 text-indigo-300 text-1xl" htmlFor="email">
								E-mail
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="voce@exemplo.com"
								autoComplete="email"
								className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>

						<div className="flex flex-col">
							<label className="mb-2 text-indigo-300 text-1xl" htmlFor="senha">
								Senha
							</label>
							<input
								id="senha"
								type="password"
								value={senha}
								onChange={(e) => setSenha(e.target.value)}
								placeholder="Sua senha"
								autoComplete="current-password"
								className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>

						<div className="mt-4 flex flex-col gap-2">
								<button
									type="button"
									onClick={() => (window.location.href = "/recuperar-senha")}
									className="w-full py-2 text-slate-200"
								>
									<span className="underline underline-offset-2">Esqueceu sua senha?</span>
								</button>
						</div>

						<button
							type="submit"
							disabled={submitting}
							className="w-full py-3 rounded-md border border-indigo-600 bg-indigo-500 text-white font-semibold hover:bg-indigo-600 disabled:opacity-60"
						>
							{submitting ? "Entrando…" : "Entrar"}
						</button>
					</form>

						<div className="mt-4 flex flex-col gap-2">
							<button
								type="button"
								onClick={() => (window.location.href = "/cadastro")}
								className="w-full py-2 text-slate-200"
							>
								Não possui uma conta? <span className="underline underline-offset-2">Cadastre-se</span>
							</button>
							</div>
						</div>
					</div>
				</div>
		);
}
