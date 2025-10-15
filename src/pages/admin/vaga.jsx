import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useState } from "react"; // estados e efeitos
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de cadastramento de vagas
export default function Vaga() {

	// Estados principais
	const navigate = useNavigate(); // navegação de páginas (voltar)
	const [titulo, setTitulo] = useState("");
	const [descricao, setDescricao] = useState("");
	const [carreiraId, setCarreiraId] = useState("");
	const [carregando, setCarregando] = useState(false);
	const [mensagem, setMensagem] = useState("");
	const [erro, setErro] = useState("");
	const [carreiras, setCarreiras] = useState([]);
	const [carreirasErro, setCarreirasErro] = useState("");
	const [carreirasLoading, setCarreirasLoading] = useState(true);
	const [resultado, setResultado] = useState(null);

	// Carregar carreiras para o select
	useEffect(() => {
		let ativo = true;
		(async () => {
			try {
				setCarreirasLoading(true);
				const res = await authFetch(`${API_URL}/carreira/`);
				if (!res.ok) throw new Error(`Falha ao listar carreiras (HTTP ${res.status})`);
				const data = await res.json();
				if (ativo) setCarreiras(Array.isArray(data) ? data : []);
			} catch (e) {
				if (ativo) setCarreirasErro(e.message || "Erro ao carregar carreiras");
			} finally {
				if (ativo) setCarreirasLoading(false);
			}
		})();
		return () => { ativo = false; };
	}, []);

	// Cadastrar vaga
	async function cadastrarVaga(e) {
		e.preventDefault(); // evita reload da página
		setErro(""); setMensagem(""); setResultado(null);
		try {
			setCarregando(true);
			// monta o objeto que será enviado ao backend
			const payload = {
				titulo: titulo.trim(),
				descricao: descricao.trim(),
				carreira_id: carreiraId ? Number(carreiraId) : null
			};
			// chama backend
			const res = await authFetch(`${API_URL}/vaga/cadastro`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload) // converte para JSON
			});
			const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha ao cadastrar (HTTP ${res.status})`;
				throw new Error(msg);
			}
			setMensagem("Vaga cadastrada com sucesso");
			setResultado(data);
			setTitulo("");
			setDescricao("");
		} catch (e) {
			setErro(e.message || "Erro ao cadastrar vaga");
		} finally {
			setCarregando(false);
		}
	}

	// HTML
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">

			{/* HEADER */}
			<header className="w-full border-b border-slate-800 bg-slate-950/80">
				<div className="w-90% ml-10 mr-10 px-4 h-16 flex items-center justify-between">
				<Link to="/homeAdmin" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
                    PFC - Admin
                </Link>
                <Link to="/admin/carreira" className="text-lg font-medium text-white hover:text-indigo-200">
                    Carreiras
                </Link>
                <Link to="/admin/habilidade" className="text-lg font-medium text-white hover:text-indigo-200">
                    Habilidades
                </Link>
                <Link to="/admin/curso" className="text-lg font-medium text-white hover:text-indigo-200">
                    Cursos
                </Link>
                <Link to="/admin/conhecimento" className="text-lg font-medium text-white hover:text-indigo-200">
                    Conhecimentos
                </Link>
                <Link to="/admin/vaga" className="text-lg font-medium underline decoration-slate-500 text-slate-300 hover:text-indigo-200">
                    Vagas
                </Link>
				<button
					onClick={logoutRedirecionar}
					className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
					>
					Sair
				</button>
				</div>
			</header>

			{/* CONTEÚDO PRINCIPAL */}
			<main className="ml-8 mr-8 mx-auto px-4 py-5">

				{/* BOTÃO VOLTAR */}
				<button
					onClick={() => navigate(-1)}
					className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
				>
					<span aria-hidden>←</span> Voltar
				</button>

				{/* título */}
				<h1 className="text-2xl font-semibold text-center mb-8">Cadastrar Vagas</h1>

				{/* formulário de cadastro de vaga */}
				<div className="mt-8 grid md:grid-cols-2 gap-8">
					<div className="bg-slate-950 border border-slate-800 rounded-lg p-5 ml-30">
						<h2 className="text-lg font-semibold text-indigo-300 mb-4 text-center">Cadastrar Vaga</h2>

						{erro && (
							<div className="mb-3 p-2 rounded border border-red-700 bg-red-900 text-red-100 text-sm">{erro}</div>
						)}
						{mensagem && (
							<div className="mb-3 p-2 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">{mensagem}</div>
						)}

						<form onSubmit={cadastrarVaga} className="space-y-4">
							<div>
								<label className="block text-lg mb-1">Título</label>
								<input
									value={titulo}
									onChange={e => setTitulo(e.target.value)}
									className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
									required
								/>
							</div>
							<div>
								<label className="block text-lg mb-1">Descrição da vaga</label>
								<textarea
									value={descricao}
									onChange={e => setDescricao(e.target.value)}
									rows={6}
									className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm resize-y"
									placeholder="Cole aqui a descrição da vaga. As habilidades serão extraídas automaticamente."
									required
								/>
							</div>
							<div>
								<label className="block text-lg mb-1">Carreira</label>
								{carreirasLoading ? (
									<p className="text-xs text-slate-400">Carregando carreiras…</p>
								) : carreirasErro ? (
									<p className="text-xs text-red-400">{carreirasErro}</p>
								) : (
									<select
										value={carreiraId}
										onChange={e => setCarreiraId(e.target.value)}
										className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
									>
										<option value="">Selecione...</option>
										{carreiras.map(c => (
											<option key={c.id} value={c.id}>{c.nome}</option>
										))}
									</select>
								)}
							</div>
							<div className="flex justify-end">
								<button
									disabled={carregando}
									type="submit"
									className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-base font-medium mt-3"
								>
									{carregando ? "Cadastrando..." : "Cadastrar Vaga"}
								</button>
							</div>
						</form>
					</div>

					<div className="bg-slate-950 border border-slate-800 rounded-lg p-5 mr-30">
						<h2 className="text-lg font-semibold text-indigo-300 mb-4 text-center">Resultado da Extração</h2>
						{!resultado ? (
							<p className="text-lg text-slate-400 text-center">Após cadastrar, as habilidades extraídas aparecerão aqui.</p>
						) : (
							<div className="space-y-4">
								<div>
									<p className="text-sm text-slate-300"><span className="text-slate-400">Vaga:</span> {resultado.titulo}</p>
									{resultado.carreira_nome && (
										<p className="text-sm text-slate-300"><span className="text-slate-400">Carreira:</span> {resultado.carreira_nome}</p>
									)}
								</div>
								<div>
									<h3 className="text-sm font-semibold text-slate-200 mb-1">Habilidades extraídas</h3>
									{resultado.habilidades_extraidas?.length ? (
										<ul className="list-disc pl-5 text-sm text-slate-200">
											{resultado.habilidades_extraidas.map((h, i) => <li key={i}>{h}</li>)}
										</ul>
									) : (
										<p className="text-xs text-slate-500">Nenhuma habilidade detectada.</p>
									)}
								</div>
								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<h3 className="text-sm font-semibold text-slate-200 mb-1">Criadas</h3>
										{resultado.habilidades_criadas?.length ? (
											<ul className="list-disc pl-5 text-sm text-emerald-300">
												{resultado.habilidades_criadas.map((h, i) => <li key={i}>{h}</li>)}
											</ul>
										) : (
											<p className="text-xs text-slate-500">Nenhuma.</p>
										)}
									</div>
									<div>
										<h3 className="text-sm font-semibold text-slate-200 mb-1">Já existiam</h3>
										{resultado.habilidades_ja_existiam?.length ? (
											<ul className="list-disc pl-5 text-sm text-slate-300">
												{resultado.habilidades_ja_existiam.map((h, i) => <li key={i}>{h}</li>)}
											</ul>
										) : (
											<p className="text-xs text-slate-500">Nenhuma.</p>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
