import { useMemo, useState, useEffect } from "react"; // + useEffect
import { useNavigate, Link } from "react-router-dom"; // navegação programática (voltar)
import { authFetch, transformarJwt, getAccessToken, VerificarTokenExpirado, refreshAccessToken } from "../utils/auth"; // importa utilitários faltantes
import logoRumoTechno from "../../images/rumotechno-logo.svg";

const API_URL = import.meta.env.VITE_API_URL ?? "https://pfcbackend-production-668a.up.railway.app";

// Página de login
export default function LoginUsuario() {

	// Estados dos campos
	const navigate = useNavigate(); // navegação de páginas (voltar)
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [erro, setErro] = useState("");
	const [mensagem, setMensagem] = useState("");

	// Se o usuário já possui token válido (ou renovável), redireciona automaticamente
	useEffect(() => {
		let cancelled = false;
		async function checkAndRedirect() {
			const token = getAccessToken();
			if (!token) return; // não está logado
			try {
				if (VerificarTokenExpirado(token)) {
					// tenta renovar
					await refreshAccessToken();
					const newToken = getAccessToken();
					if (!newToken) return;
					if (!cancelled) await descobrirPerfilERedirecionar(newToken);
				} else {
					if (!cancelled) await descobrirPerfilERedirecionar(token);
				}
			} catch (e) {
				// falha ao renovar/validar -> limpa dados e permite que o usuário veja a tela de login
				try { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); } catch {}
			}
		}
		checkAndRedirect();
		return () => { cancelled = true; };
	}, [navigate]);

	// Limpa dados de autenticação
	function clearAuth() {
		try {
			localStorage.removeItem("access_token");
			localStorage.removeItem("token_type");
			localStorage.removeItem("usuario_id");
			localStorage.removeItem("is_admin");
			localStorage.removeItem("usuario_nome");
		} catch {}
	}

	// Definindo e-mail válido (com @ e .)
	const emailValido = useMemo(() => /.+@.+\..+/.test(email), [email]);

	// Validação dos campos do formulário
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
			// chama backend
			const res = await authFetch(`${API_URL}/usuario/${userId}`);
			if (!res.ok) throw new Error("Falha ao obter dados do usuário");
			const user = await res.json(); // guarda os dados do usuário em JSON
			const isAdmin = !!user?.admin; // verifica se é admin (true/false)
			// Guarda id, nome e tipo de usuário em localStorage
			localStorage.setItem("usuario_id", String(userId));
			localStorage.setItem("is_admin", String(isAdmin));
			if (user?.nome) localStorage.setItem("usuario_nome", String(user.nome));
			// redireciona sem recarregar a página
			navigate(isAdmin ? "/homeAdmin" : "/homeUsuario", { replace: true });
		} catch (e) {
			clearAuth(); // limpa dados de autenticação
			setErro("Não foi possível obter os dados do usuário. Tente novamente.");
			return;
		}
	}

	// Envio do formulário
	async function onSubmit(e) {
		e.preventDefault(); // previne recarregar a página
		setErro(""); setMensagem("");
		// Validação dos campos
		const erroValid = validarCampos();
		if (erroValid) {
			setErro(erroValid);
			return;
		}
		setSubmitting(true);
		try {
			// chama backend
			const res = await fetch(`${API_URL}/auth/login/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim(), senha }), // converte para JSON
				credentials: 'include', // permite que o browser receba e envie cookies HttpOnly
			});
			const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha no login (HTTP ${res.status})`;
				throw new Error(msg);
			}
			const { access_token, token_type } = data; // pega os tokens retornados (refresh token é armazenado em cookie HttpOnly)
			if (!access_token) throw new Error("Token de acesso não retornado");
			// Persistência do access token no localStorage
			localStorage.setItem("access_token", access_token);
			if (token_type) localStorage.setItem("token_type", token_type);
			setMensagem("Login realizado com sucesso. Redirecionando…");
			await descobrirPerfilERedirecionar(access_token); // descobre o perfil e redireciona
		} catch (e) {
			setErro(e.message ?? "Erro ao efetuar login");
		} finally {
			setSubmitting(false);
		}
	}

	// HTML
	return (
			<div className="min-h-screen relative bg-slate-900 pt-16">

			<header className="fixed inset-x-0 top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
				<div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
					{/* Logo redireciona para a Home */}
					<Link to="/" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200" aria-label="Ir para a Home">
						<img src={logoRumoTechno} alt="RumoTechno" className="h-8 w-auto transition-transform duration-200 ease-out hover:scale-103" />
					</Link>
					<div className="flex items-center gap-3">
						<Link
							to="/login"
							className="px-4 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
						>
							Entrar
						</Link>
						<Link
							to="/cadastro"
							className="px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
						>
							Cadastre-se
						</Link>
					</div>
				</div>
			</header>
				{/* CONTEÚDO PRINCIPAL */}
				<div className="flex flex-col items-center pt-5 pb-8 px-4">

					{/* título */}
					<h1 className="text-3xl text-slate-200 font-semibold mb-4 text-center">Entrar</h1>

					<div className="w-full max-w-md bg-slate-950 border border-slate-700 rounded-xl p-6 text-slate-200 shadow-lg">

						{/* feedback */}
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

						{/* formulário */}
						<form onSubmit={onSubmit} className="space-y-3">

							{/* email */}
							<div className="flex flex-col">
								<label className="mb-2 text-indigo-300 text-1xl" htmlFor="email">E-mail</label>
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

							{/* senha */}
							<div className="flex flex-col">
								<label className="mb-2 text-indigo-300 text-1xl" htmlFor="senha">Senha</label>
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

							{/* link para recuperar senha */}
							<div className="mt-4 flex flex-col gap-2">
									<button
										type="button"
										onClick={() => navigate("/recuperar-senha")}
										className="w-full py-2 text-slate-200"
									>
										<span className="underline underline-offset-2">Esqueceu sua senha?</span>
									</button>
							</div>

							{/* botão enviar */}
							<button
								type="submit"
								disabled={submitting}
								className="w-full py-3 rounded-md border border-indigo-600 bg-indigo-500 text-white font-semibold hover:bg-indigo-600 disabled:opacity-60"
							>
								{submitting ? "Entrando…" : "Entrar"}
							</button>
						</form>

						{/* link para cadastro */}
						<div className="mt-4 flex flex-col gap-2">
							<button
								type="button"
								onClick={() => navigate("/cadastro")}
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