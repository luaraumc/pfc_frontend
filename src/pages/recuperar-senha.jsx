import { useMemo, useState, useEffect } from "react"; // useMemo: armazenamento em cache | useState: gerenciar estado de componentes
import { useNavigate, Link } from "react-router-dom"; // navegação programática (voltar)
import { getAccessToken, VerificarTokenExpirado, refreshAccessToken, authFetch, transformarJwt } from "../utils/auth"; // checar token e redirecionar se já autenticado
import logoRumoTechno from "../../images/rumotechno-logo.svg";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de recuperação de senha
export default function RecuperarSenha() {

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
	
	const [step, setStep] = useState("request"); // etapas: request (solicitar código) | reset (redefinir senha)
	const [email, setEmail] = useState("");
	const [codigo, setCodigo] = useState("");
	const [novaSenha, setNovaSenha] = useState("");
	const [confirmarSenha, setConfirmarSenha] = useState("");
	const [showNova, setShowNova] = useState(false);
	const [showConfirmar, setShowConfirmar] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [mensagem, setMensagem] = useState("");
	const [erro, setErro] = useState("");

	// Definindo e-mail válido (com @ e .)
	const emailValido = useMemo(() => /.+@.+\..+/.test(email), [email]);

	// Requisitos aplicados à nova senha (campo de redefinição)
	const novaSenhaRequisitos = useMemo(() => {
		return {
			len: (novaSenha || '').length >= 6,
			maiuscula: /[A-Z]/.test(novaSenha || ''),
			especial: /[^A-Za-z0-9]/.test(novaSenha || ''),
			semEspacos: !/\s/.test(novaSenha || ''),
		};
	}, [novaSenha]);

	// Validando e-mail
	function validarEmail() {
		if (!email.trim() || !emailValido) return "Informe um e-mail válido"; // trim() remove espaços em branco no início e fim
		return null;
	}

	// Validação do formulário de redefinição de senha
	function validarReset() {
		if (!email.trim() || !emailValido) return "Informe um e-mail válido";
		if (!codigo.trim() || codigo.trim().length !== 6) return "Informe o código de 6 dígitos";
		if (!novaSenha) return "Informe a nova senha";
		if (novaSenha.length < 6) return "A senha deve ter pelo menos 6 caracteres";
			if (/\s/.test(novaSenha) || /\s/.test(confirmarSenha)) return "A senha não pode conter espaços";
		if (novaSenha !== confirmarSenha) return "As senhas não coincidem";
		return null;
	}

	// Solicita o código
	async function solicitarCodigo() {
		setErro("");setMensagem("");
		// validação do e-mail
		const err = validarEmail();
		if (err) {
			setErro(err);
			return;
		}
		setSubmitting(true);
		try {
			// chama backend
			const res = await fetch(`${API_URL}/auth/solicitar-codigo/recuperar-senha/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim() }), // converte para JSON
			});
			const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha ao solicitar código (HTTP ${res.status})`;
				throw new Error(msg);
			}
			setMensagem(data?.message || "Código enviado para seu e-mail");
			setStep("reset"); // avança para a etapa de redefinição de senha
		} catch (e) {
			setErro(e.message ?? "Erro ao solicitar código");
		} finally {
			setSubmitting(false);
		}
	}

	// Redefine a senha usando o código enviado por e-mail
	async function redefinirSenha(e) {
		e.preventDefault(); // evita reload da página
		setErro(""); setMensagem("");
		// validação dos campos
		const err = validarReset();
		if (err) {
			setErro(err);
			return;
		}
		setSubmitting(true);
		try {
			// chama backend
			const res = await fetch(`${API_URL}/auth/recuperar-senha/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim(), codigo: codigo.trim(), nova_senha: (novaSenha||'').replace(/\s/g,'') }), // converte para JSON e remove espaços
			});
			const raw = await res.text();
			let data = {};
			try { data = JSON.parse(raw); } catch {}
			if (!res.ok) {
				let msg = '';
				const detail = data?.detail;
				if (typeof detail === 'string') {
					msg = detail;
				} else if (Array.isArray(detail)) {
					const msgs = detail
						.filter(d => d?.msg)
						.map(d => {
							let m = String(d.msg);
							m = m.replace(/^\s*nova_senha\s*:?\s*/i, '');
							return m;
						})
						.filter(Boolean);
					if (msgs.length) msg = msgs.join(' ');
				}
				if (!msg) msg = data?.message || raw || `Falha ao atualizar senha (HTTP ${res.status})`;
				// normalizações
				if (/c[oó]digo inválido/i.test(msg)) msg = 'Código inválido. Verifique o código enviado ao seu e-mail e tente novamente.';
				if (/c[oó]digo expirado/i.test(msg)) msg = 'Código expirado. Solicite um novo código e tente novamente.';
				if (/mínimo\s*6/i.test(msg)) msg = 'A nova senha deve ter no mínimo 6 caracteres, 1 letra maiúscula e 1 caractere especial.';
				msg = msg.replace(/^\s*nova_senha\s*:?\s*/i, '');
				setErro(msg);
				return;
			}
			const sucesso = data?.detail || data?.message || 'Senha atualizada com sucesso';
			setMensagem(String(sucesso).replace(/^\s*nova_senha\s*:?\s*/i, ''));
		} catch (e) {
			setErro(e.message ?? "Erro ao atualizar senha");
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
				<h1 className="text-3xl text-slate-200 font-semibold mb-4 text-center">Recuperar senha</h1>

				<div className="w-full max-w-md bg-slate-950 border border-slate-700 rounded-xl p-6 text-slate-200 shadow-lg">

					{/* feedback */}
					{!!erro && (
						<div className="mb-3 p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">{erro}</div>
					)}
					{!!mensagem && (
						<div className="mb-3 p-3 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">{mensagem}</div>
					)}

					{/* formulário de solicitação de código */}
					{step === "request" && (
						<div className="space-y-3">
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

							{/* botão enviar código */}
							<button
								type="button"
								onClick={solicitarCodigo}
								disabled={submitting}
								className="mt-2 w-full py-3 rounded-md border border-indigo-600 bg-indigo-500 text-white font-semibold hover:bg-indigo-600 disabled:opacity-60"
							>
								{submitting ? "Enviando…" : "Enviar código"}
							</button>

						</div>

					)}

					{/* formulário de redefinição de senha */}
					{step === "reset" && (
						<form onSubmit={redefinirSenha} className="space-y-3">
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

							{/* código */}
							<div className="flex flex-col">
								<label className="mb-2 text-indigo-300 text-1xl" htmlFor="codigo">Código</label>
								<input
									id="codigo"
									type="text"
									inputMode="numeric"
									pattern="[0-9]*"
									maxLength={6}
									value={codigo}
									onChange={(e) => setCodigo(e.target.value.replace(/\D+/g, ""))}
									placeholder="6 dígitos"
									className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>

							{/* nova senha */}
							<div className="flex flex-col">
								<label className="mb-2 text-indigo-300 text-1xl" htmlFor="novaSenha">Nova senha</label>
								<div className="relative">
								<input
									id="novaSenha"
									type={showNova ? "text" : "password"}
									value={novaSenha}
									onChange={(e) => setNovaSenha(e.target.value)}
									onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
									onPaste={(e) => { const pasted=(e.clipboardData.getData('text')||'').replace(/\s/g,''); e.preventDefault(); setNovaSenha(prev=>prev? prev + pasted : pasted); }}
									placeholder="Mínimo 6 caracteres"
									autoComplete="new-password"
									className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								/>
								<button
									type="button"
									className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100"
									onClick={() => setShowNova((v) => !v)}
									aria-label={showNova ? "Ocultar nova senha" : "Mostrar nova senha"}
								>
									{showNova ? (
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.74-1.64 1.79-3.17 3.1-4.47M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-1.02 2.27-2.64 4.29-4.67 5.71M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
											<line x1="1" y1="1" x2="23" y2="23"/>
										</svg>
									) : (
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
											<circle cx="12" cy="12" r="3"/>
										</svg>
									)}
								</button>
								</div>
								<div className="mt-1 text-xs text-slate-400">
									<ul className="mt-1 space-y-0.5">
										<li className={novaSenhaRequisitos.len ? "text-emerald-400" : undefined}>• Mínimo 6 caracteres</li>
										<li className={novaSenhaRequisitos.maiuscula ? "text-emerald-400" : undefined}>• Pelo menos 1 letra maiúscula</li>
										<li className={novaSenhaRequisitos.especial ? "text-emerald-400" : undefined}>• Pelo menos 1 caractere especial</li>
									</ul>
								</div>
							</div>

							{/* confirmar nova senha */}
							<div className="flex flex-col">
								<label className="mb-2 text-indigo-300 text-1xl" htmlFor="confirmarSenha">Confirmar nova senha</label>
								<div className="relative">
								<input
									id="confirmarSenha"
									type={showConfirmar ? "text" : "password"}
									value={confirmarSenha}
									onChange={(e) => setConfirmarSenha(e.target.value)}
									onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
									onPaste={(e) => { const pasted=(e.clipboardData.getData('text')||'').replace(/\s/g,''); e.preventDefault(); setConfirmarSenha(prev=>prev? prev + pasted : pasted); }}
									placeholder="Repita a nova senha"
									autoComplete="new-password"
									className="mb-2 w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								/>
								<button
									type="button"
									className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100"
									onClick={() => setShowConfirmar((v) => !v)}
									aria-label={showConfirmar ? "Ocultar confirmação" : "Mostrar confirmação"}
								>
									{showConfirmar ? (
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.74-1.64 1.79-3.17 3.1-4.47M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-1.02 2.27-2.64 4.29-4.67 5.71M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
											<line x1="1" y1="1" x2="23" y2="23"/>
										</svg>
									) : (
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
											<circle cx="12" cy="12" r="3"/>
										</svg>
									)}
								</button>
								</div>
							</div>

							
							<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
								{/* botão reenviar código */}
								<button
									type="button"
									onClick={solicitarCodigo}
									disabled={submitting}
									className="w-full py-2 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-60"
								>
									Reenviar código
								</button>

								{/* botão redefinir senha */}
								<button
									type="submit"
									disabled={submitting}
									className="w-full py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-semibold hover:bg-indigo-600 disabled:opacity-60"
								>
									{submitting ? "Salvando…" : "Redefinir senha"}
								</button>
							</div>
						</form>
					)}

					{/* links para login e cadastro */}
					<div className="mt-4 flex flex-col gap-2">
						{/* botão voltar ao login */}
						<button
							type="button"
							onClick={() => navigate("/login")}
							className="mt-2 w-full py-2 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800"
						>
							Voltar ao login
						</button>
						{/* botão ir para cadastro */}
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
