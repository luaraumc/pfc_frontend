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
	const [carregando, setCarregando] = useState(false); // loading do cadastro básico
	const [mensagem, setMensagem] = useState(""); // msg geral
	const [erro, setErro] = useState(""); // erro geral
	const [carreiras, setCarreiras] = useState([]);
	const [carreirasErro, setCarreirasErro] = useState("");
	const [carreirasLoading, setCarreirasLoading] = useState(true);
	// estados do fluxo em 2 etapas
	const [vagaId, setVagaId] = useState(null); // id da vaga criada no cadastro básico
	const [previewLoading, setPreviewLoading] = useState(false); // loading da extração
	const [habilidadesPreview, setHabilidadesPreview] = useState([]); // lista editável
	const [confirmLoading, setConfirmLoading] = useState(false); // loading confirmação
	const [confirmMsg, setConfirmMsg] = useState("");
	const [confirmErro, setConfirmErro] = useState("");
	const [confirmResultado, setConfirmResultado] = useState(null); // dados de retorno após confirmar (criadas/ja_existiam)
	const [jaConfirmado, setJaConfirmado] = useState(false); // trava o botão após sucesso

	// Limpar toda a tela/estado para o estado inicial
	function limparTela() {
		setTitulo("");
		setDescricao("");
		setCarreiraId("");
		setCarregando(false);
		setMensagem("");
		setErro("");
		setVagaId(null);
		setPreviewLoading(false);
		setHabilidadesPreview([]);
		setConfirmLoading(false);
		setConfirmMsg("");
		setConfirmErro("");
		setConfirmResultado(null);
		setJaConfirmado(false);
	}

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

	// Cadastrar vaga (básico) e carregar preview de habilidades editáveis
	async function cadastrarVaga(e) {
		e.preventDefault();
		setErro(""); setMensagem(""); setConfirmMsg(""); setConfirmErro(""); setConfirmResultado(null);
		setVagaId(null); setHabilidadesPreview([]); setJaConfirmado(false);
		try {
			setCarregando(true);
			const payload = { titulo: titulo.trim(), descricao: descricao.trim(), carreira_id: carreiraId ? Number(carreiraId) : null };
			const res = await authFetch(`${API_URL}/vaga/cadastro-basico`, {
				method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
			});
			const vaga = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = vaga?.detail || vaga?.message || `Falha ao cadastrar (HTTP ${res.status})`;
				throw new Error(msg);
			}
			setVagaId(vaga?.id);
			setMensagem("Vaga cadastrada. Edite as habilidades extraídas antes de confirmar.");
			// limpa campos do formulário
			setTitulo(""); setDescricao("");
			// busca preview
			await carregarPreview(vaga?.id);
		} catch (e) {
			setErro(e.message || "Erro ao cadastrar vaga");
		} finally {
			setCarregando(false);
		}
	}

	async function carregarPreview(id) {
		if (!id) return;
		setPreviewLoading(true);
		try {
			const res = await authFetch(`${API_URL}/vaga/${id}/preview-habilidades`);
			const data = await res.json().catch(() => []);
			if (!res.ok) {
				const msg = (data && data.detail) || `Falha ao extrair habilidades (HTTP ${res.status})`;
				throw new Error(msg);
			}
			// lista editável
			setHabilidadesPreview(Array.isArray(data) ? data : []);
		} catch (e) {
			setErro(e.message || "Erro ao extrair habilidades");
		} finally {
			setPreviewLoading(false);
		}
	}

	function editarHabilidadePreview(index, novoValor) {
		setHabilidadesPreview(prev => prev.map((h, i) => i === index ? novoValor : h));
	}

	function removerHabilidadePreview(index) {
		setHabilidadesPreview(prev => prev.filter((_, i) => i !== index));
	}

	async function confirmarHabilidades() {
		if (!vagaId) return;
		setConfirmErro(""); setConfirmMsg(""); setConfirmResultado(null);
		try {
			setConfirmLoading(true);
			const payload = { habilidades: habilidadesPreview };
			const res = await authFetch(`${API_URL}/vaga/${vagaId}/confirmar-habilidades`, {
				method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha ao confirmar (HTTP ${res.status})`;
				throw new Error(msg);
			}
			// Após salvar com sucesso, manter resultado visível e bloquear o botão
			// Limpar também campos de edição das habilidades extraídas
			setConfirmResultado(data);
			setConfirmMsg("Habilidades confirmadas e salvas.");
			setHabilidadesPreview([]);
			setJaConfirmado(true);
		} catch (e) {
			setConfirmErro(e.message || "Erro ao confirmar habilidades");
		} finally {
			setConfirmLoading(false);
		}
	}

	// HTML
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">

			{/* HEADER */}
			<header className="w-full border-b border-slate-800 bg-slate-950/80">
				<div className="w-90% ml-10 mr-10 px-4 h-16 flex items-center justify-between">
				<Link to="/homeAdmin" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
                    Home
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
                <Link to="/admin/vaga" className="text-lg font-medium underline decoration-slate-500 decoration-3 underline-offset-8 text-indigo-300 hover:text-indigo-200">
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
									placeholder="Informe o título da vaga."
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
									{carregando ? "Cadastrando..." : "Cadastrar e Extrair"}
								</button>
							</div>
						</form>
					</div>

					<div className="bg-slate-950 border border-slate-800 rounded-lg p-5 mr-30">
						<h2 className="text-lg font-semibold text-indigo-300 mb-4 text-center">Pré-visualização e Confirmação</h2>
						{confirmMsg && (
							<div className="mb-3 p-2 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">{confirmMsg}</div>
						)}
						{!vagaId ? (
							<p className="text-lg text-slate-400 text-center">Após cadastrar, as habilidades extraídas aparecerão aqui para edição.</p>
						) : (
							<div className="space-y-4">
								{/* Info da vaga */}
								<div>
									<p className="text-sm text-slate-300"><span className="text-slate-400">Vaga ID:</span> {vagaId}</p>
								</div>

								{/* Lista editável - visível apenas enquanto não confirmado */}
								{!jaConfirmado && (
									<div>
										<h3 className="text-sm font-semibold text-slate-200 mb-2">Habilidades extraídas (edite/remova):</h3>
										{previewLoading ? (
											<p className="text-xs text-slate-400">Extraindo…</p>
										) : (
											<>
												{habilidadesPreview?.length ? (
													<ul className="space-y-2">
														{habilidadesPreview.map((h, i) => (
															<li key={i} className="flex items-center gap-2">
																<input
																	value={h}
																	onChange={e => editarHabilidadePreview(i, e.target.value)}
																	className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
																/>
																<button
																	onClick={() => removerHabilidadePreview(i)}
																	className="px-2 py-1 text-xs rounded border border-red-700 text-red-200 hover:bg-red-900/40"
																>Remover</button>
															</li>
														))}
													</ul>
												) : (
													<p className="text-xs text-slate-500">Nenhuma habilidade detectada.</p>
												)}
											</>
										)}
									</div>
								)}

								{/* Ações */}
								<div className="flex justify-end gap-2">
									<button
										type="button"
										onClick={limparTela}
										className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
									>
										Cancelar
									</button>
									<button
										type="button"
										onClick={confirmarHabilidades}
										disabled={confirmLoading || jaConfirmado}
										className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
									>{confirmLoading ? 'Confirmando…' : (jaConfirmado ? 'Confirmado' : 'Confirmar e Salvar')}</button>
								</div>

								{/* Feedback confirmação */}
								{confirmErro && (
									<div className="p-2 rounded border border-red-700 bg-red-900 text-red-100 text-sm">{confirmErro}</div>
								)}

								{/* Resultado após confirmação */}
								{confirmResultado && (
									<div className="grid md:grid-cols-2 gap-4">
										<div>
											<h3 className="text-sm font-semibold text-slate-200 mb-1">Criadas</h3>
											{confirmResultado.habilidades_criadas?.length ? (
												<ul className="list-disc pl-5 text-sm text-emerald-300">
													{confirmResultado.habilidades_criadas.map((h, i) => <li key={i}>{h}</li>)}
												</ul>
											) : (
												<p className="text-xs text-slate-500">Nenhuma.</p>
											)}
										</div>
										<div>
											<h3 className="text-sm font-semibold text-slate-200 mb-1">Já existiam</h3>
											{confirmResultado.habilidades_ja_existiam?.length ? (
												<ul className="list-disc pl-5 text-sm text-slate-300">
													{confirmResultado.habilidades_ja_existiam.map((h, i) => <li key={i}>{h}</li>)}
												</ul>
											) : (
												<p className="text-xs text-slate-500">Nenhuma.</p>
											)}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
