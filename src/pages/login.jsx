import { useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function decodeJwt(token) {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		// Adiciona padding se necessário
		const padded = base64 + "===".slice(0, (4 - (base64.length % 4)) % 4);
		const jsonPayload = decodeURIComponent(
			atob(padded)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join("")
		);
		return JSON.parse(jsonPayload);
	} catch (e) {
		return null;
	}
}

export default function LoginUsuario() {
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [erro, setErro] = useState("");
	const [mensagem, setMensagem] = useState("");

	const emailValido = useMemo(() => /.+@.+\..+/.test(email), [email]);

	function validarCampos() {
		if (!email.trim() || !emailValido) return "Informe um e-mail válido";
		if (!senha) return "Informe a senha";
		return null;
	}

	async function descobrirPerfilERedirecionar(accessToken) {
		const decoded = decodeJwt(accessToken);
		const userId = decoded?.sub ? Number(decoded.sub) : null;
		if (!userId) {
			// Falhou decodificação: redireciona como usuário comum
			window.location.href = "/dashboard";
			return;
		}
		try {
			const res = await fetch(`${API_URL}/usuario/${userId}`);
			if (!res.ok) throw new Error("Falha ao obter dados do usuário");
			const user = await res.json();
			const isAdmin = !!user?.admin;
			// Guarda alguns dados úteis
			localStorage.setItem("usuario_id", String(userId));
			localStorage.setItem("is_admin", String(isAdmin));
			window.location.href = isAdmin ? "/admin" : "/dashboard";
		} catch {
			// Se falhar a busca, segue para dashboard comum
			window.location.href = "/dashboard";
		}
	}

	async function onSubmit(e) {
		e.preventDefault();
		setErro("");
		setMensagem("");

		const erroValid = validarCampos();
		if (erroValid) {
			setErro(erroValid);
			return;
		}

		setSubmitting(true);
		try {
			const res = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim(), senha }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha no login (HTTP ${res.status})`;
				throw new Error(msg);
			}
			const { access_token, refresh_token, token_type } = data;
			if (!access_token) throw new Error("Token de acesso não retornado");

			// Persistência básica dos tokens
			localStorage.setItem("access_token", access_token);
			if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
			if (token_type) localStorage.setItem("token_type", token_type);

			setMensagem("Login realizado com sucesso. Redirecionando…");
			await descobrirPerfilERedirecionar(access_token);
		} catch (e) {
			setErro(e.message ?? "Erro ao efetuar login");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
			<h1 className="text-3xl text-slate-200 font-semibold mb-4 text-center">Login</h1>
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
	);
}
