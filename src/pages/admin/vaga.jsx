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

	// Lista de vagas (com paginação)
	const [vagas, setVagas] = useState([]);
	const [vagasLoading, setVagasLoading] = useState(true);
	const [vagasErro, setVagasErro] = useState("");
	const [vagasMsg, setVagasMsg] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	// Categorias disponíveis para seleção na pré-visualização
	const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);

	// Pop-up Exclusão de Vaga
	const [vagaExcluir, setVagaExcluir] = useState(null);
	const [excluindo, setExcluindo] = useState(false);

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
		// também limpa mensagens da lista
		setVagasMsg("");
		setVagasErro("");
	}

	// Normaliza descrição localmente para comparar duplicidade (trim, espaço único, minúsculas)
	function normalizarDescricaoLocal(texto) {
		return (texto ?? "").toString().trim().replace(/\s+/g, " ").toLowerCase();
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

	async function cadastrarVaga(e) {
		// Evita reload da página ao enviar o formulário
		e?.preventDefault?.();
		setErro(""); setMensagem(""); setConfirmMsg(""); setConfirmErro(""); setConfirmResultado(null);
		setVagaId(null); setHabilidadesPreview([]); setJaConfirmado(false);
		try {
			// validação: carreira é obrigatória
			if (!carreiraId) {
				setErro("Selecione uma carreira para cadastrar a vaga.");
				return;
			}
			// validação: descrição duplicada (local) -> mensagem amigável e não envia
			const descNorm = normalizarDescricaoLocal(descricao);
			const existeDuplicada = (vagas || []).some(v => normalizarDescricaoLocal(v?.descricao) === descNorm);
			if (existeDuplicada) {
				setErro("Já existe uma vaga com a mesma descrição. Altere a descrição para prosseguir.");
				return;
			}
			setCarregando(true);
			const payload = { titulo: titulo.trim(), descricao: descricao.trim(), carreira_id: Number(carreiraId) };
			const res = await authFetch(`${API_URL}/vaga/cadastro`, {
				method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
			});
			const vaga = await res.json().catch(() => ({}));
			if (!res.ok) {
				let msg = vaga?.detail || vaga?.message || `Falha ao cadastrar (HTTP ${res.status})`;
				const m = (msg || "").toLowerCase();
				if (res.status === 409 || m.includes("duplic") || m.includes("já existe") || m.includes("duplicate") || m.includes("unique")) {
					msg = "Já existe uma vaga com a mesma descrição. Altere a descrição para prosseguir.";
				}
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

	// Carregar vagas (para listagem)
	async function carregarVagas() {
		setVagasErro("");
		setVagasMsg("");
		setVagasLoading(true);
		try {
			const res = await authFetch(`${API_URL}/vaga/`);
			const data = await res.json().catch(() => []);
			if (!res.ok) {
				const msg = (data && data.detail) || `Falha ao listar vagas (HTTP ${res.status})`;
				throw new Error(msg);
			}
			// garante array e mantém ordem do backend (já desc), mas se necessário, reforça ordenação por id desc
			const lista = Array.isArray(data) ? data : [];
			setVagas(lista);
			// reset de paginação ao recarregar
			setPage(1);
		} catch (e) {
			setVagasErro(e.message || "Erro ao carregar vagas");
		} finally {
			setVagasLoading(false);
		}
	}

	useEffect(() => {
		carregarVagas();
	}, []);

		// Carregar categorias para popular o select na pré-visualização
		useEffect(() => {
			let ativo = true;
			(async () => {
				try {
					const res = await authFetch(`${API_URL}/habilidade/categorias`);
					const data = await res.json().catch(() => []);
					if (!res.ok) { if (ativo) setCategoriasDisponiveis([]); return; }
					if (ativo) setCategoriasDisponiveis(Array.isArray(data) ? data : []);
				} catch (_) {
					if (ativo) setCategoriasDisponiveis([]);
				}
			})();
			return () => { ativo = false; };
		}, []);

	// Exclusão de vaga com modal (igual ao de carreiras)
	function solicitarExclusaoVaga(v) {
		setVagasErro(""); setVagasMsg("");
		setVagaExcluir({ id: v.id, titulo: v.titulo });
	}

	async function confirmarExclusaoVaga() {
		if (!vagaExcluir) return;
		setExcluindo(true); setVagasErro(""); setVagasMsg("");
		try {
			const res = await authFetch(`${API_URL}/vaga/${vagaExcluir.id}`, { method: "DELETE" });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha ao excluir (HTTP ${res.status})`;
				throw new Error(msg);
			}
			setVagas(prev => {
				const nova = prev.filter(v => v.id !== vagaExcluir.id);
				const totalPagesDepois = Math.max(1, Math.ceil(nova.length / pageSize));
				if (page > totalPagesDepois) setPage(totalPagesDepois);
				return nova;
			});
			setVagasMsg(data?.message || 'Vaga deletada com sucesso.');
			setVagaExcluir(null);
		} catch (e) {
			setVagasErro(e.message || "Erro ao excluir vaga");
		} finally {
			setExcluindo(false);
		}
	}

	function cancelarExclusaoVaga() {
		if (excluindo) return;
		setVagaExcluir(null);
	}

	// Paginação derivada
	const totalVagas = vagas.length;
	const totalPages = Math.max(1, Math.ceil(totalVagas / pageSize));
	const startIndex = (page - 1) * pageSize;
	const endIndex = Math.min(startIndex + pageSize, totalVagas);
	const vagasPagina = vagas.slice(startIndex, endIndex);

	function irParaPagina(n) {
		if (n < 1 || n > totalPages) return;
		setPage(n);
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
			// Transforma em objetos para permitir edição de categoria, preservando sugestão da IA
			const itens = Array.isArray(data) ? data : [];
			const objetos = itens.map(h => {
				if (typeof h === 'string') {
					return { nome: h, habilidade_id: '', categoria_id: '', categoria_nome: '', categoria_sugerida: '' };
				}
				const nome = h?.nome ?? '';
				const habilidade_id = h?.habilidade_id ?? '';
				let categoria_id = h?.categoria_id ?? '';
				let categoria_nome = h?.categoria_nome ?? h?.categoria ?? h?.category ?? '';
				const categoria_sugerida = h?.categoria_sugerida ?? '';
				// Se não veio categoria id, mas há sugestão, tente casar com categoriasDisponiveis
				if (!categoria_id && categoria_sugerida) {
					const match = (categoriasDisponiveis || []).find(c => String(c.nome).toLowerCase() === String(categoria_sugerida).toLowerCase());
					if (match) { categoria_id = match.id; categoria_nome = match.nome; }
				}
				return { nome, habilidade_id, categoria_id, categoria_nome, categoria_sugerida };
			});
			setHabilidadesPreview(objetos);
		} catch (e) {
			setErro(e.message || "Erro ao extrair habilidades");
		} finally {
			setPreviewLoading(false);
		}
	}

	function editarHabilidadePreview(index, novoValor) {
		setHabilidadesPreview(prev => prev.map((h, i) => {
			if (i !== index) return h;
			// Mantém como objeto padronizado
			if (typeof h === 'string') {
				return { nome: novoValor, categoria_id: '', categoria_nome: '' };
			}
			return { ...h, nome: novoValor };
		}));
	}

	function removerHabilidadePreview(index) {
		setHabilidadesPreview(prev => prev.filter((_, i) => i !== index));
	}

	function alterarCategoriaPreview(index, novaCategoriaId) {
		setHabilidadesPreview(prev => prev.map((h, i) => {
			if (i !== index) return h;
			const catObj = (categoriasDisponiveis || []).find(c => String(c.id) === String(novaCategoriaId));
			return {
				...(typeof h === 'string' ? { nome: h } : h),
				categoria_id: novaCategoriaId,
				categoria_nome: catObj?.nome || ''
			};
		}));
	}

	async function confirmarHabilidades() {
		if (!vagaId) return;
		setConfirmErro(""); setConfirmMsg(""); setConfirmResultado(null);
		try {
			setConfirmLoading(true);
			// Envia objetos ricos: nome, categoria_id, habilidade_id (quando existir)
			const itens = (habilidadesPreview || []).map(h => {
				if (typeof h === 'string') {
					return { nome: h, categoria_id: '', habilidade_id: '', categoria_sugerida: '' };
				}
				return {
					nome: h?.nome ?? '',
					categoria_id: h?.categoria_id ? Number(h.categoria_id) : '',
					habilidade_id: h?.habilidade_id ? Number(h.habilidade_id) : '',
					categoria_sugerida: h?.categoria_sugerida ?? '',
				};
			});
			const payload = { habilidades: itens };
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
										required
									>
										<option value="" disabled>Selecione...</option>
										{carreiras.map(c => (
											<option key={c.id} value={c.id}>{c.nome}</option>
										))}
									</select>
								)}
							</div>
							<div className="flex justify-end">
								<button
										disabled={carregando || !carreiraId}
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
														{habilidadesPreview.map((h, i) => {
															const nome = typeof h === 'string' ? h : (h.nome ?? h.name ?? '');
															const categoriaId = typeof h === 'object' ? (h.categoria_id ?? '') : '';
															const sugestao = typeof h === 'object' ? (h.categoria_sugerida ?? '') : '';
															return (
																<li key={i} className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
																	<div className="md:col-span-6">
																		<input
																			value={nome}
																			onChange={e => editarHabilidadePreview(i, e.target.value)}
																			className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
																		/>
																	</div>
																	<div className="md:col-span-4">
																		<select
																			value={String(categoriaId)}
																			onChange={e => alterarCategoriaPreview(i, e.target.value)}
																			className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
																		>
																			<option value="">Categoria...</option>
																			{(categoriasDisponiveis || []).map(c => (
																				<option key={c.id} value={c.id}>{c.nome}</option>
																			))}
																		</select>
																		{!categoriaId && sugestao && (
																			<p className="text-[11px] text-slate-400 mt-1">Sugestão da IA: <span className="text-slate-300">{sugestao}</span></p>
																		)}
																	</div>
																	<div className="md:col-span-2 flex justify-end">
																		<button
																			onClick={() => removerHabilidadePreview(i)}
																			className="px-2 py-1 text-xs rounded border border-red-700 text-red-200 hover:bg-red-900/40"
																		>Remover</button>
																	</div>
																</li>
															);
														})}
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

			{/* LISTA DE VAGAS */}
			<section className="ml-8 mr-8 mx-auto px-4 pb-8">
				<div className="mt-4 bg-slate-950 border border-slate-800 rounded-lg p-5">
					<h2 className="text-lg font-semibold text-indigo-300 mb-4 text-center">Vagas Cadastradas</h2>
					{vagasMsg && (
						<div className="mb-3 p-2 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">{vagasMsg}</div>
					)}
					{vagasErro && (
						<div className="mb-3 p-2 rounded border border-red-700 bg-red-900 text-red-100 text-sm">{vagasErro}</div>
					)}
					{vagasLoading ? (
						<p className="text-sm text-slate-400">Carregando vagas…</p>
					) : !vagas.length ? (
						<p className="text-sm text-slate-400">Nenhuma vaga cadastrada.</p>
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="min-w-full text-sm table-fixed">
									<thead className="text-slate-300">
										<tr>
											<th className="text-left py-2 px-2 w-16">ID</th>
											<th className="text-left py-2 px-2 w-1/2">Título</th>
											<th className="text-left py-2 px-2 w-1/3 hidden md:table-cell">Carreira</th>
											<th className="text-left py-2 px-2 w-28">Ações</th>
										</tr>
									</thead>
									<tbody>
										{vagasPagina.map(v => (
											<tr key={v.id} className="border-t border-slate-800">
												<td className="py-2 px-2 text-slate-400">{v.id}</td>
												<td className="py-2 px-2">
													<div className="truncate max-w-[12rem] md:max-w-[24rem]">{v.titulo}</div>
												</td>
												<td className="py-2 px-2 text-slate-300 hidden md:table-cell">
													<div className="truncate max-w-[10rem] md:max-w-[20rem]">{v.carreira_nome ?? '-'}</div>
												</td>
												<td className="py-2 px-2">
													<button
														onClick={() => solicitarExclusaoVaga(v)}
														className="px-2 py-1 text-xs rounded border border-red-700 text-red-200 hover:bg-red-900/40"
													>
														Excluir
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Paginação */}
							<div className="mt-4 flex items-center justify-between">
								<div className="text-xs text-slate-400">
									Exibindo {totalVagas ? startIndex + 1 : 0}–{endIndex} de {totalVagas}
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={() => irParaPagina(page - 1)}
										disabled={page === 1}
										className="px-2 py-1 rounded border border-slate-700 text-slate-200 disabled:opacity-50 hover:bg-slate-800"
									>
										Anterior
									</button>
									<span className="text-xs text-slate-300">Página {page} de {totalPages}</span>
									<button
										onClick={() => irParaPagina(page + 1)}
										disabled={page === totalPages}
										className="px-2 py-1 rounded border border-slate-700 text-slate-200 disabled:opacity-50 hover:bg-slate-800"
									>
										Próxima
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			</section>

			{/* confirmação de exclusão */}
			{vagaExcluir && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center"
					role="dialog"
					aria-modal="true"
					aria-labelledby="modal-excluir-vaga-titulo"
				>
					{/* fundo escuro/blur */}
					<div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={cancelarExclusaoVaga} />

					<div className="relative w-full max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-6">
						{/* título */}
						<h2 id="modal-excluir-vaga-titulo" className="text-lg font-semibold text-red-300 mb-3">Confirmar Exclusão</h2>
						{/* mensagem de confirmação */}
						<p className="text-sm text-slate-300 mb-6 leading-relaxed">
							Tem certeza que deseja excluir a vaga <strong className="text-slate-100">{vagaExcluir.titulo}</strong>? Esta ação não pode ser desfeita.
						</p>
						<div className="flex justify-end gap-3">
							{/* botão cancelar */}
							<button
								onClick={cancelarExclusaoVaga}
								disabled={excluindo}
								className="px-4 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-200 text-sm hover:bg-slate-700 disabled:opacity-50"
							>
								Cancelar
							</button>
							{/* botão confirmar */}
							<button
								onClick={confirmarExclusaoVaga}
								disabled={excluindo}
								className="px-4 py-2 rounded-md border border-red-700 bg-red-600/90 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
							>
								{excluindo ? 'Excluindo...' : 'Excluir'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
