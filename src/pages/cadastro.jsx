import { useEffect, useMemo, useState } from "react"; // useEffect: executar funções | useMemo: armazenamento em cache | useState: gerenciar estado de componentes
import { useNavigate } from "react-router-dom"; // navegação programática (voltar)

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de cadastro de usuário comum
export default function CadastroUsuario() {
	// Estados dos campos
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

	const emailValido = useMemo(() => /.+@.+\..+/.test(email), [email]); // validação de email (com @ e .)

	// Carrega carreiras e cursos em paralelo
	useEffect(() => {
		const ctrl = new AbortController(); // para cancelar fetch se o componente desmontar
		async function carregarListas() {
			setLoadingListas(true); // indica que as listas estão sendo carregadas
			setErro(""); // limpa erros anteriores
			try {
				// Requisições GET
				const [resCarreira, resCurso] = await Promise.all([
					fetch(`${API_URL}/carreira/`, { signal: ctrl.signal }),
					fetch(`${API_URL}/curso/`, { signal: ctrl.signal }),
				]);
				if (!resCarreira.ok) throw new Error(`Falha ao listar carreiras (${resCarreira.status})`);
				if (!resCurso.ok) throw new Error(`Falha ao listar cursos (${resCurso.status})`);
				// Converte respostas para JSON
				const [carreirasJson, cursosJson] = await Promise.all([
					resCarreira.json(),
					resCurso.json(),
				]);
				// Atualiza estado dos arrays
				setCarreiras(carreirasJson ?? []);
				setCursos(cursosJson ?? []);
			} catch (e) {
				if (e.name !== "AbortError") setErro(e.message ?? "Erro ao carregar listas");
			} finally {
				setLoadingListas(false); // indica que o carregamento terminou
			}
		}
		carregarListas(); // chama a função para carregar as listas
		return () => ctrl.abort(); // cancela fetch se o componente desmontar
	}, []);

	// Validação dos campos do formulário
	function validarCampos() {
		if (!nome.trim()) return "Informe o nome";
		if (!email.trim() || !emailValido) return "Informe um e-mail válido";
		if (!senha) return "Informe a senha";
		if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres";
		if (!carreiraId) return "Selecione a carreira";
		if (!cursoId) return "Selecione o curso";
		return null;
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

		// Prepara dados para envio
		const payload = {
			nome: nome.trim(),
			email: email.trim(),
			senha,
			admin: false,
			carreira_id: Number(carreiraId),
			curso_id: Number(cursoId),
		};

		// Envia os dados para o backend
		setSubmitting(true);
		try {
			const res = await fetch(`${API_URL}/auth/cadastro`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json().catch(() => ({})); // tenta decodificar JSON, se falhar retorna objeto vazio
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Erro ao cadastrar (HTTP ${res.status})`;
				throw new Error(msg);
			}
			setMensagem(data?.message || "Usuário cadastrado com sucesso");
			// Limpa o formulário (exceto listas)
			setNome("");
			setEmail("");
			setSenha("");
			setCarreiraId("");
			setCursoId("");
		} catch (e) {
			setErro(e.message ?? "Falha ao cadastrar");
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
				<h1 className="text-3xl text-slate-200 font-semibold mb-4 text-center">Cadastro de Usuário</h1>
				<div className="w-full max-w-3xl bg-slate-950 border border-slate-700 rounded-xl p-6 text-slate-200 shadow-lg">
					{loadingListas && (
						<div className="mb-3 p-2 rounded bg-slate-800 text-slate-300 text-sm">Carregando listas…</div>
					)}
					{!!erro && <div className="mb-3 p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">{erro}</div>}
					{!!mensagem && <div className="mb-3 p-3 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">{mensagem}</div>}

					<form onSubmit={onSubmit} className="mt-3 space-y-3">
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

						<div className="flex flex-col">
							<label className="mb-2 text-indigo-300 text-1xl" htmlFor="senha">Senha</label>
							<input
								id="senha"
								type="password"
								value={senha}
								onChange={(e) => setSenha(e.target.value)}
								placeholder="Mínimo 6 caracteres"
								className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								autoComplete="new-password"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="flex flex-col">
								<label className="mb-2 text-indigo-300 text-1xl" htmlFor="carreira">Carreira Desejada</label>
								<select
									id="carreira"
									value={carreiraId}
									disabled={loadingListas}
									onChange={(e) => setCarreiraId(e.target.value)}
									className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

						<button type="submit" className="mt-2 w-full py-3 rounded-md border border-indigo-600 bg-indigo-500 text-white font-semibold hover:bg-indigo-600 disabled:opacity-60" disabled={submitting || loadingListas}>
							{submitting ? "Enviando…" : "Cadastrar"}
						</button>
					</form>

					<div className="mt-4">
						<button
							type="button"
							onClick={() => (window.location.href = "/login")}
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
