import { useEffect, useMemo, useState } from "react"; // useEffect: executar funções | useMemo: armazenamento em cache | useState: gerenciar estado de componentes
import { useNavigate, Link } from "react-router-dom"; // navegação programática (voltar)
import { getAccessToken, VerificarTokenExpirado, refreshAccessToken, authFetch, transformarJwt } from "../utils/auth"; // checar token e redirecionar se já autenticado
import logoRumoTechno from "../../images/rumotechno-logo.svg";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de cadastro de usuário comum
export default function CadastroUsuario() {
	
	// Estados dos campos
	const navigate = useNavigate(); // navegação de páginas (voltar)

	// Se o usuário já está autenticado, redireciona para a home apropriada
	useEffect(() => {
		let cancelled = false;
		async function checar() {
			const token = getAccessToken();
			if (!token) return;
			try {
				let usable = token;
				if (VerificarTokenExpirado(token)) {
					await refreshAccessToken();
					usable = getAccessToken();
					if (!usable) return;
				}
				const stored = localStorage.getItem('is_admin');
				if (stored === 'true' || stored === 'false') {
					if (!cancelled) navigate(stored === 'true' ? '/homeAdmin' : '/homeUsuario', { replace: true });
					return;
				}
				const decoded = transformarJwt(usable);
				const userId = decoded?.sub ? Number(decoded.sub) : null;
				if (!userId) return;
				const res = await authFetch(`${API_URL}/usuario/${userId}`);
				if (!res.ok) return;
				const user = await res.json().catch(() => ({}));
				const isAdmin = !!user?.admin;
				localStorage.setItem('is_admin', String(isAdmin));
				if (user?.nome) localStorage.setItem('usuario_nome', String(user.nome));
				if (!cancelled) navigate(isAdmin ? '/homeAdmin' : '/homeUsuario', { replace: true });
			} catch (e) {
				try { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); } catch {}
			}
		}
		checar();
		return () => { cancelled = true; };
	}, [navigate]);
	
	const [nome, setNome] = useState("");
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [carreiraId, setCarreiraId] = useState("");
	const [cursoId, setCursoId] = useState("");
	const [carreiras, setCarreiras] = useState([]);
	const [cursos, setCursos] = useState([]);
	const [loadingListas, setLoadingListas] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [mensagem, setMensagem] = useState("");
	const [erro, setErro] = useState("");

	// Definindo e-mail válido (contém '@' e o domínio contém '.com')
	const emailValido = useMemo(() => {
		const v = String(email || '').trim();
		if (!/.+@.+\..+/.test(v)) return false; // exige '@' e '.'
		return /@.*\.com/i.test(v); // aceita .com, .com.br, etc
	}, [email]);

	// Requisitos de senha: mínimo 6 caracteres, 1 maiúscula, 1 caractere especial
	const senhaRequisitos = useMemo(() => {
        return {
            len: senha.length >= 6,
            maiuscula: /[A-Z]/.test(senha),
            especial: /[^A-Za-z0-9]/.test(senha),
            semEspacos: !/\s/.test(senha),
        };
    }, [senha]);

	// Carrega carreiras e cursos em paralelo
	useEffect(() => {
		const ctrl = new AbortController(); // para cancelar fetch se o componente desmontar
		async function carregarListas() {
			setLoadingListas(true);
			setErro("");
			try {
				// chama backend em paralelo
				const [resCarreira, resCurso] = await Promise.all([
					fetch(`${API_URL}/carreira/`, { signal: ctrl.signal }),
					fetch(`${API_URL}/curso/`, { signal: ctrl.signal }),
				]);
				if (!resCarreira.ok) throw new Error(`Falha ao listar carreiras (${resCarreira.status})`);
				if (!resCurso.ok) throw new Error(`Falha ao listar cursos (${resCurso.status})`);
				// converte respostas em JSON
				const [carreirasJson, cursosJson] = await Promise.all([
					resCarreira.json(),
					resCurso.json(),
				]);
				setCarreiras(carreirasJson ?? []);
				setCursos(cursosJson ?? []);
			} catch (e) {
				if (e.name !== "AbortError") setErro(e.message ?? "Erro ao carregar listas");
			} finally {
				setLoadingListas(false);
			}
		}
		carregarListas();
		return () => ctrl.abort();
	}, []);

	// Validação dos campos do formulário
	function validarCampos() {
		if (!nome.trim()) return "Informe o nome";
        if (!email.trim() || !emailValido) return "Informe um e-mail válido.";
        if (!senha) return "Informe a senha";
        if (!senhaRequisitos.semEspacos) return "A senha não pode conter espaços";
        if (!(senhaRequisitos.len && senhaRequisitos.maiuscula && senhaRequisitos.especial)) {
            return "A senha deve conter no mínimo 6 caracteres, 1 letra maiúscula e 1 caractere especial";
        }
        if (!carreiraId) return "Selecione a carreira";
        return null;
	}

	// Envio do formulário
	async function onSubmit(e) {
		e.preventDefault(); // previne recarregar a página
		setErro(""); setMensagem("");
		// validação dos campos
		const erroValid = validarCampos();
		if (erroValid) {
			setErro(erroValid);
			return;
		}
		// prepara dados para envio
		const payload = {
			nome: nome.trim(),
			email: email.trim(),
			senha,
			admin: false,
			carreira_id: Number(carreiraId),
			curso_id: Number(cursoId),
		};
		setSubmitting(true);
		try {
			// chama backend
			const res = await fetch(`${API_URL}/auth/cadastro/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Erro ao cadastrar (HTTP ${res.status})`;
				throw new Error(msg);
			}
				setMensagem(data?.message || "Usuário cadastrado com sucesso! Redirecionando para login...");
				setNome("");
				setEmail("");
				setSenha("");
				setCarreiraId("");
				setCursoId("");
				navigate("/login", { replace: true });	// redireciona para página de login após sucesso
		} catch (e) {
			setErro(e.message ?? "Falha ao cadastrar");
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
			<div className="min-h-screen flex flex-col items-center pb-15 px-4">

				{/* título */}
				<h1 className="text-3xl text-slate-200 font-semibold mb-4 text-center pt-5">Cadastro de Usuário</h1>

				<div className="w-full max-w-md bg-slate-950 border border-slate-700 rounded-xl p-6 text-slate-200 shadow-lg">

					{/* feedback */}
					{loadingListas && (
						<div className="mb-3 p-2 rounded bg-slate-800 text-slate-300 text-sm">Carregando listas…</div>
					)}
					{!!erro && <div className="mb-3 p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">{erro}</div>}
					{!!mensagem && <div className="mb-3 p-3 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">{mensagem}</div>}

					{/* formulário */}
					<form onSubmit={onSubmit} className="mt-3 space-y-3">

						{/* nome */}
						<div className="flex flex-col">
							<label className="mb-2 text-indigo-300 text-1xl" htmlFor="nome">Nome</label>
							<input
								id="nome"
								type="text"
								value={nome}
								onChange={(e) => setNome(e.target.value)}
								placeholder="Seu nome"
								className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								autoComplete="name"
							/>
						</div>

						{/* email */}
						<div className="flex flex-col">
							<label className="mb-2 text-indigo-300 text-1xl" htmlFor="email">E-mail</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="voce@exemplo.com"
								className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								autoComplete="email"
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
								onKeyDown={(e) => { if (e.key === " ") e.preventDefault(); }}
								onPaste={(e) => {
									const pasted = (e.clipboardData.getData("text") || "").replace(/\s/g, "");
									e.preventDefault();
									setSenha((prev) => (prev ? (prev + pasted) : pasted));
								}}
								placeholder="Mínimo 6 caracteres"
								className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								autoComplete="new-password"
							/>
							<div className="mt-1 text-xs text-slate-400">
								<ul className="mt-1 space-y-0.5">
									<li className={senhaRequisitos.len ? "text-emerald-400" : undefined}>• Mínimo 6 caracteres</li>
									<li className={senhaRequisitos.maiuscula ? "text-emerald-400" : undefined}>• Pelo menos 1 letra maiúscula</li>
									<li className={senhaRequisitos.especial ? "text-emerald-400" : undefined}>• Pelo menos 1 caractere especial</li>
								</ul>
							</div>
						</div>

						{/* carreira e curso */}
						<div className="space-y-3">
							<div className="flex flex-col">
								<label className="mb-2 text-indigo-300 text-1xl" htmlFor="carreira">Carreira Desejada</label>
								<select
									id="carreira"
									value={carreiraId}
									disabled={loadingListas}
									onChange={(e) => setCarreiraId(e.target.value)}
									className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									required
								>
									<option value="">Selecione…</option>
									{carreiras.map((c) => (
										<option key={c.id} value={c.id}>
											{c.nome}
										</option>
									))}
								</select>
							</div>
							<div className="flex flex-col">
								<label className="mb-2 text-indigo-300 text-1xl" htmlFor="curso">Curso</label>
								<select
									id="curso"
									value={cursoId}
									disabled={loadingListas}
									onChange={(e) => setCursoId(e.target.value)}
									className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								>
									<option value="">Selecione…</option>
									{cursos.map((c) => (
										<option key={c.id} value={c.id}>
											{c.nome}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* botão enviar */}
						<button type="submit" className="mt-2 w-full py-3 rounded-md border border-indigo-600 bg-indigo-500 text-white font-semibold hover:bg-indigo-600 disabled:opacity-60" disabled={submitting || loadingListas}>
							{submitting ? "Enviando…" : "Cadastrar"}
						</button>
					</form>

					{/* link para login */}
					<div className="mt-4">
						<button
							type="button"
							onClick={() => navigate("/login")}
							className="w-full py-2 text-slate-200"
						>
							Já possui uma conta? <span className="underline underline-offset-2">Fazer login</span>
						</button>
					</div>
					
				</div>
			</div>
		</div>
	);
}
