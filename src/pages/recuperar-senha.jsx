import { useMemo, useState } from "react"; // useMemo: armazenamento em cache | useState: gerenciar estado de componentes
import { useNavigate } from "react-router-dom"; // navegação programática (voltar)

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de recuperação de senha
export default function RecuperarSenha() {
	// Estados dos campos
	const [step, setStep] = useState("request");
	const [email, setEmail] = useState("");
	const [codigo, setCodigo] = useState("");
	const [novaSenha, setNovaSenha] = useState("");
	const [confirmarSenha, setConfirmarSenha] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [mensagem, setMensagem] = useState("");
	const [erro, setErro] = useState("");

	const emailValido = useMemo(() => /.+@.+\..+/.test(email), [email]); // validação de email (com @ e .)

	function validarRequest() {
		if (!email.trim() || !emailValido) return "Informe um e-mail válido"; // trim() remove espaços em branco no início e fim
		return null;
	}

	// Validação do formulário
	function validarReset() {
		if (!email.trim() || !emailValido) return "Informe um e-mail válido";
		if (!codigo.trim() || codigo.trim().length !== 6) return "Informe o código de 6 dígitos";
		if (!novaSenha) return "Informe a nova senha";
		if (novaSenha.length < 6) return "A senha deve ter pelo menos 6 caracteres";
		if (novaSenha !== confirmarSenha) return "As senhas não coincidem";
		return null;
	}

	// Solicita o código de recuperação de senha
	async function solicitarCodigo() {
		setErro(""); // limpa erros anteriores
		setMensagem(""); // limpa mensagens anteriores

		// validação dos campos
		const err = validarRequest();
		if (err) {
			setErro(err);
			return;
		}

		// Requisição para solicitar código ao backend
		setSubmitting(true);
		try {
			const res = await fetch(`${API_URL}/auth/solicitar-codigo/recuperar-senha`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim() }),
			});
			const data = await res.json().catch(() => ({})); // tenta converter a resposta em JSON, se falhar retorna objeto vazio
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha ao solicitar código (HTTP ${res.status})`;
				throw new Error(msg);
			}
			setMensagem(data?.message || "Código enviado para seu e-mail");
			setStep("reset"); // avança para a etapa de redefinição de senha
		} catch (e) {
			setErro(e.message ?? "Erro ao solicitar código");
		} finally {
			setSubmitting(false); // finaliza o estado de submissão
		}
	}

	// Redefine a senha usando o código enviado por e-mail
	async function redefinirSenha(e) {
		e.preventDefault(); // previne recarregar a página
		setErro(""); // limpa erros anteriores
		setMensagem(""); // limpa mensagens anteriores

		// validação dos campos
		const err = validarReset();
		if (err) {
			setErro(err);
			return;
		}

		// Requisição para redefinir a senha no backend
		setSubmitting(true);
		try {
			const res = await fetch(`${API_URL}/auth/recuperar-senha`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim(), codigo: codigo.trim(), nova_senha: novaSenha }),
			});
			const data = await res.json().catch(() => ({})); // tenta converter a resposta em JSON, se falhar retorna objeto vazio
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha ao atualizar senha (HTTP ${res.status})`;
				throw new Error(msg);
			}
			setMensagem(data?.detail || data?.message || "Senha atualizada com sucesso");
		} catch (e) {
			setErro(e.message ?? "Erro ao atualizar senha");
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
				<h1 className="text-3xl text-slate-200 font-semibold mb-4 text-center">Recuperar senha</h1>
				<div className="w-full max-w-md bg-slate-950 border border-slate-700 rounded-xl p-6 text-slate-200 shadow-lg">

					{!!erro && (
						<div className="mb-3 p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">{erro}</div>
					)}
					{!!mensagem && (
						<div className="mb-3 p-3 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">{mensagem}</div>
					)}

					{step === "request" && (
						<div className="space-y-3">
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

					{step === "reset" && (
						<form onSubmit={redefinirSenha} className="space-y-3">
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

							<div className="flex flex-col">
								<label className="mb-2 text-indigo-300 text-sm" htmlFor="novaSenha">Nova senha</label>
								<input
									id="novaSenha"
									type="password"
									value={novaSenha}
									onChange={(e) => setNovaSenha(e.target.value)}
									placeholder="Mínimo 6 caracteres"
									autoComplete="new-password"
									className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>

							<div className="flex flex-col">
								<label className="mb-2 text-indigo-300 text-sm" htmlFor="confirmarSenha">Confirmar nova senha</label>
								<input
									id="confirmarSenha"
									type="password"
									value={confirmarSenha}
									onChange={(e) => setConfirmarSenha(e.target.value)}
									placeholder="Repita a nova senha"
									autoComplete="new-password"
									className="mb-2 w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>

							<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
								<button
									type="button"
									onClick={solicitarCodigo}
									disabled={submitting}
									className="w-full py-2 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-60"
								>
									Reenviar código
								</button>
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

					<div className="mt-4 flex flex-col gap-2">
						<button
							type="button"
							onClick={() => (window.location.href = "/login")}
							className="mt-2 w-full py-2 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800"
						>
							Voltar ao login
						</button>
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
