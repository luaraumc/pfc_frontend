import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário
import { useEffect, useState } from "react"; // useEffect: executar funções | useState: gerenciar estado de componentes
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento + fetch autenticado
import perfilIcon from "../../../images/perfil.png"; // ícone de perfil

// Página inicial do usuário comum
export default function HomeUsuario() {

	const [nome, setNome] = useState(""); // armazena o nome do usuário
	const [carreiraId, setCarreiraId] = useState(null); // carreira escolhida pelo usuário
	const [carreiraNome, setCarreiraNome] = useState(''); // nome da carreira do usuário
	const [melhorCurso, setMelhorCurso] = useState(null); // { id, nome, score }
	const [loading, setLoading] = useState(true);
	const [erro, setErro] = useState(null);
	const [habilidadesUsuarioIds, setHabilidadesUsuarioIds] = useState(new Set());
	const [nomePorHabilidadeId, setNomePorHabilidadeId] = useState(new Map());
	const [expandedCarreiras, setExpandedCarreiras] = useState(new Set());
	const [habPorCarreira, setHabPorCarreira] = useState({}); // { [carreiraId]: { loading, error, itens: [{id, nome, frequencia}] } }
	const [topCarreiras, setTopCarreiras] = useState([]);
	const [loadingCompat, setLoadingCompat] = useState(true);
	const [erroCompat, setErroCompat] = useState("");
	// ESTADOS NOVOS: controle de salvamento por habilidade e erro do checklist
	const [savingHabIds, setSavingHabIds] = useState(new Set());
	const [erroChecklist, setErroChecklist] = useState("");

	const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	function formatScore(v) {
		if (v == null || Number.isNaN(v)) return '0.00';
		return Number(v).toFixed(2);
	}

	function ProgressBar({ value }) {
		const pct = Math.max(0, Math.min(100, Number(value) || 0));
		return (
			<div className="w-full bg-slate-800 rounded h-3 overflow-hidden border border-slate-700">
				<div
					className="h-3 bg-gradient-to-r from-indigo-500 to-cyan-400"
					style={{ width: `${pct}%` }}
				/>
			</div>
		);
	}

	useEffect(() => {
		let cancel = false;
		async function carregarRecomendacao() {
			try {
				const n = localStorage.getItem("usuario_nome") || ""; // obtém o nome do localStorage ou string vazia
				const usuarioId = localStorage.getItem('usuario_id');
				setNome(n);

				if (!usuarioId) {
					setErro('Não foi possível identificar o usuário. Faça login novamente.');
					return;
				}

				// 1) Busca o usuário para obter carreira_id
				const rUser = await fetch(`${API_URL}/usuario/${usuarioId}`);
				if (!rUser.ok) throw new Error('Falha ao carregar dados do usuário');
				const user = await rUser.json();
				if (cancel) return;
				const cid = user?.carreira_id ?? null;
				setCarreiraId(cid);

				// Se não houver carreira, limpa estados relacionados
				if (!cid) {
					setCarreiraNome('');
					setMelhorCurso(null);
					return; // usuário sem carreira definida
				}

				// Carrega o nome da carreira para exibição
				try {
					const rCar = await fetch(`${API_URL}/carreira/${cid}`);
					if (rCar.ok) {
						const car = await rCar.json();
						if (!cancel) setCarreiraNome(car?.nome ?? '');
					} else {
						if (!cancel) setCarreiraNome('');
					}
				} catch (err) {
					if (!cancel) setCarreiraNome('');
				}

				// 2) Carrega o mapa e pega o melhor curso para a carreira
				const rMapa = await fetch(`${API_URL}/mapa`);
				if (!rMapa.ok) throw new Error('Falha ao carregar mapa');
				const mapa = await rMapa.json();
				if (cancel) return;

				const lista = (mapa?.carreiraToCursos ?? {})[cid];
				if (Array.isArray(lista) && lista.length > 0) {
					setMelhorCurso(lista[0]);
				} else {
					setMelhorCurso(null);
				}
			} catch (e) {
				if (!cancel) setErro(e?.message || 'Erro ao carregar recomendação');
			} finally {
				if (!cancel) setLoading(false);
			}
		}
		carregarRecomendacao();
		return () => { cancel = true };
	}, [API_URL]);

	// Carrega catálogo de habilidades (id -> nome) uma vez
	useEffect(() => {
		let cancel = false;
		(async () => {
			try {
				const rHabs = await fetch(`${API_URL}/habilidade/`);
				if (!rHabs.ok) return;
				const todas = await rHabs.json();
				const mapa = new Map(todas.map(h => [h.id, h.nome]));
				if (!cancel) setNomePorHabilidadeId(mapa);
			} catch {}
		})();
		return () => { cancel = true };
	}, [API_URL]);

	// Carrega habilidades do usuário uma vez (para marcar check nas listas)
	useEffect(() => {
		let cancel = false;
		(async () => {
			try {
				const usuarioId = localStorage.getItem('usuario_id');
				if (!usuarioId) return;
				const rUserHabs = await authFetch(`${API_URL}/usuario/${usuarioId}/habilidades`);
				if (!rUserHabs.ok) return;
				const listaUsuario = await rUserHabs.json();
				const idsUsuario = new Set(listaUsuario.map(h => h.habilidade_id));
				if (!cancel) setHabilidadesUsuarioIds(idsUsuario);
			} catch {}
		})();
		return () => { cancel = true };
	}, [API_URL]);

	// Função para carregar habilidades por carreira sob demanda
	async function carregarHabilidadesDaCarreira(id) {
		setHabPorCarreira(prev => ({
			...prev,
			[id]: { ...(prev[id] || {}), loading: true, error: '', itens: prev[id]?.itens || [] }
		}));
		try {
			const r = await fetch(`${API_URL}/carreira/${id}/habilidades`);
			if (!r.ok) throw new Error('Falha ao carregar habilidades da carreira');
			const lista = await r.json(); // [{carreira_id, habilidade_id, frequencia}]
			const itens = (lista || []).map(rel => ({
				id: rel.habilidade_id,
				nome: nomePorHabilidadeId.get(rel.habilidade_id) ?? `Habilidade #${rel.habilidade_id}`,
				frequencia: rel.frequencia ?? 0,
			})).sort((a,b) => (b.frequencia||0) - (a.frequencia||0));
			setHabPorCarreira(prev => ({ ...prev, [id]: { loading: false, error: '', itens } }));
		} catch (e) {
			setHabPorCarreira(prev => ({ ...prev, [id]: { loading: false, error: e?.message || 'Erro ao carregar', itens: [] } }));
		}
	}

	function toggleExpandCarreira(id) {
		setExpandedCarreiras(prev => {
			const novo = new Set(prev);
			if (novo.has(id)) {
				novo.delete(id);
			} else {
				novo.add(id);
				// Carrega on-demand se ainda não tiver itens
				if (!habPorCarreira[id]?.itens) {
					carregarHabilidadesDaCarreira(id);
				}
			}
			return novo;
		});
	}

	// Recarrega compatibilidade do backend (atualiza percentuais e cobertas)
	async function recarregarCompatibilidade() {
		try {
			const usuarioId = localStorage.getItem('usuario_id');
			if (!usuarioId) {
				setErroCompat("Usuário não identificado. Faça login novamente.");
				return;
			}
			const res = await authFetch(`${API_URL}/usuario/${usuarioId}/compatibilidade/top`);
			if (!res.ok) throw new Error(`Erro ${res.status}`);
			const data = await res.json();
			setTopCarreiras(Array.isArray(data) ? data : []);
		} catch (e) {
			setErroCompat("Não foi possível carregar sua compatibilidade agora.");
		} finally {
			setLoadingCompat(false);
		}
	}

	// Atualização silenciosa (sem alterar loading/placeholder) para evitar flicker
	async function recarregarCompatibilidadeSilenciosa() {
		try {
			const usuarioId = localStorage.getItem('usuario_id');
			if (!usuarioId) return;
			const res = await authFetch(`${API_URL}/usuario/${usuarioId}/compatibilidade/top`);
			if (!res.ok) return;
			const data = await res.json();
			setTopCarreiras(Array.isArray(data) ? data : []);
		} catch {}
	}

	// Endpoints de adicionar/remover habilidade do usuário
	async function adicionarHabilidadeUsuario(usuarioId, habilidadeId) {
		return authFetch(`${API_URL}/usuario/${usuarioId}/adicionar-habilidade/${habilidadeId}`, {
			method: 'POST'
		});
	}
	async function removerHabilidadeUsuario(usuarioId, habilidadeId) {
		return authFetch(`${API_URL}/usuario/${usuarioId}/remover-habilidade/${habilidadeId}`, {
			method: 'DELETE'
		});
	}

	// Toggle do checklist
	async function handleToggleHabilidade(carreiraId, habilidade) {
		setErroChecklist("");
		const usuarioId = localStorage.getItem('usuario_id');
		if (!usuarioId) {
			setErroChecklist("Usuário não identificado.");
			return;
		}
		// evita cliques simultâneos na mesma habilidade
		if (savingHabIds.has(habilidade.id)) return;

		const possui = habilidadesUsuarioIds.has(habilidade.id);

		// marca como salvando
		setSavingHabIds(prev => {
			const novo = new Set(prev);
			novo.add(habilidade.id);
			return novo;
		});

		try {
			// chama backend
			const res = possui
				? await removerHabilidadeUsuario(usuarioId, habilidade.id)
				: await adicionarHabilidadeUsuario(usuarioId, habilidade.id);

			if (!res.ok) throw new Error('Falha ao atualizar habilidade');

			// sucesso: atualiza set local
			setHabilidadesUsuarioIds(prev => {
				const novo = new Set(prev);
				if (possui) novo.delete(habilidade.id);
				else novo.add(habilidade.id);
				return novo;
			});

			// recarrega compatibilidade real (barra) em background para evitar flicker
			await recarregarCompatibilidadeSilenciosa();
		} catch (e) {
			setErroChecklist(e?.message || "Erro ao atualizar habilidade");
		} finally {
			setSavingHabIds(prev => {
				const novo = new Set(prev);
				novo.delete(habilidade.id);
				return novo;
			});
		}
	}

	// Carrega compatibilidade do usuário com carreiras (barras de progresso)
	useEffect(() => {
		let cancel = false;
		(async () => {
			try {
				const usuarioId = localStorage.getItem('usuario_id');
				if (!usuarioId) {
					if (!cancel) {
						setErroCompat("Usuário não identificado. Faça login novamente.");
						setLoadingCompat(false);
					}
					return;
				}
				const res = await authFetch(`${API_URL}/usuario/${usuarioId}/compatibilidade/top`);
				if (!res.ok) {
					throw new Error(`Erro ${res.status}`);
				}
				const data = await res.json();
				if (!cancel) setTopCarreiras(Array.isArray(data) ? data : []);
			} catch (e) {
				if (!cancel) setErroCompat("Não foi possível carregar sua compatibilidade agora.");
			} finally {
				if (!cancel) setLoadingCompat(false);
			}
		})();
		return () => { cancel = true };
	}, [API_URL]);

    // HTML
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">

			{/* HEADER */}
			<header className="w-full border-b border-slate-800 bg-slate-950/80">
				<div className="w-90% ml-10 mr-10 px-4 h-16 flex items-center justify-between">
					<Link to="/homeUsuario" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
						Home
					</Link>
					<div className="flex items-center gap-3">
					<Link
	                    to="/usuario/cadastro-habilidade"
	                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
	                >
	                    Cadastrar Habilidade
	                </Link>
					<Link
						to="/usuario/editar-perfil"
						className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
					>
						<img src={perfilIcon} alt="Perfil" className="w-5 h-5" />
						<span>Editar Perfil</span>
					</Link>
					<button
						onClick={logoutRedirecionar}
						className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">
						Sair
					</button>
					</div>
				</div>
			</header>

			{/* CONTEÚDO PRINCIPAL */}
			<main className="max-w-6xl mx-auto px-4 py-10">

				{/* destaque de recomendação */}
				<div className="mb-8">
					{loading ? (
						<div className="rounded-md border border-slate-800 bg-slate-900/40 p-4 text-slate-400">Carregando recomendação…</div>
					) : erro ? (
						<div className="rounded-md border border-rose-800 bg-rose-900/30 p-4 text-rose-200">{erro}</div>
					) : carreiraId == null ? (
						<div className="rounded-md border border-amber-800 bg-amber-900/30 p-4 text-amber-200">
							Defina sua carreira no <Link to="/usuario/editar-perfil" className="underline">perfil</Link> para ver o curso mais recomendado.
						</div>
					) : melhorCurso ? (
						<div className="rounded-lg border border-indigo-700 bg-indigo-900/20 p-4 text-center">
							<p className="text-sm text-indigo-200">Para sua carreira: <span className="font-medium text-indigo-100">{carreiraNome || '—'}</span></p>
							<h2 className="text-xl font-semibold text-slate-100">Curso recomendado: <span className="text-indigo-300">{melhorCurso.nome}</span></h2>
							<p className="text-slate-300 text-sm mt-1">Score: {formatScore(melhorCurso.score)}</p>
						</div>
					) : (
						<div className="rounded-md border border-slate-800 bg-slate-900/40 p-4 text-slate-300">
							Ainda não há cursos mapeados para sua carreira.
						</div>
					)}
				</div>

				{/* título */}
				<h1 className="text-2xl font-semibold text-center">Olá{nome ? `, ${nome}` : ''}!</h1>

				{/* descrição */}
				<p className="mt-2 text-slate-300 text-center">Bem-vindo à sua Home de usuário.</p>

				{/* Compatibilidade com Carreiras */}
				<section className="mt-10">
					<h2 className="text-xl font-medium mb-4 text-center">SUAS CARREIRAS MAIS COMPATÍVEIS</h2>
					<div className="space-y-4">
						{loadingCompat && (
							<p className="text-slate-400">Carregando sua compatibilidade...</p>
						)}
						{!loadingCompat && erroCompat && (
							<p className="text-rose-300">{erroCompat}</p>
						)}
						{!loadingCompat && !erroCompat && topCarreiras.length === 0 && (
							<div className="text-slate-300">
								<p>Nenhuma carreira encontrada ainda.</p>
								<p className="mt-1">Dica: cadastre suas habilidades para ver sua compatibilidade!</p>
								<div className="mt-3">
									<Link to="/usuario/cadastro-habilidade" className="text-indigo-300 underline">Cadastrar habilidades</Link>
								</div>
							</div>
						)}
						{!loadingCompat && !erroCompat && topCarreiras.map((item, idx) => {
							const carreiraIdCard = item.carreira_id;
							const expanded = expandedCarreiras.has(carreiraIdCard);
							const entry = habPorCarreira[carreiraIdCard] || { loading: false, error: '', itens: null };
							return (
								<div key={`${carreiraIdCard}-${idx}`} className="p-4 rounded border border-slate-800 bg-slate-950/50">
									<div className="flex items-center justify-between mb-2">
										<div className="font-medium">{item.carreira_nome ?? 'Carreira'}</div>
										<div className="text-slate-300 text-sm">{item.percentual}%</div>
									</div>
									<ProgressBar value={item.percentual} />
									<div className="mt-2 flex items-center justify-between gap-2">
										<span className="text-slate-400 text-sm">Compatibilidade ponderada pelas habilidades exigidas na carreira.</span>
										<button
											type="button"
											onClick={() => toggleExpandCarreira(carreiraIdCard)}
											className="inline-flex items-center gap-2 px-2 py-1 bg-transparent border-0 rounded-md transition-colors group"
										>
											<svg className={`w-5 h-5 text-indigo-300 transition-transform ${expanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
											<span className="text-slate-200 font-medium transition-colors group-hover:text-indigo-300">Ver habilidades</span>
										</button>
									</div>

									{/* Lista expandida de habilidades da carreira */}
									{expanded && (
										<div className="mt-3 rounded-md border border-slate-800 bg-slate-900/40">
											{entry.loading ? (
												<div className="p-4 text-slate-400">Carregando habilidades…</div>
											) : entry.error ? (
												<div className="p-4 text-rose-300">{entry.error}</div>
											) : !entry.itens || entry.itens.length === 0 ? (
												<div className="p-4 text-slate-400">Nenhuma habilidade mapeada para esta carreira.</div>
											) : (
												<div className="p-3">
													{erroChecklist && <div className="mb-2 text-sm text-rose-300">{erroChecklist}</div>}
													<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
														{entry.itens.map(h => {
															const possui = habilidadesUsuarioIds.has(h.id);
															const salvando = savingHabIds.has(h.id);
															return (
																<div key={h.id} className="flex items-center gap-3 p-3 rounded bg-transparent">
																	<button
																		type="button"
																		onClick={() => handleToggleHabilidade(carreiraIdCard, h)}
																		disabled={salvando}
																		className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-transparent ${salvando ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800/30'} transition-colors group`}
																		aria-pressed={possui}
																		aria-label={`${possui ? 'Remover' : 'Adicionar'} habilidade ${h.nome}`}
																		title={salvando ? 'Salvando...' : (possui ? 'Clique para remover' : 'Clique para adicionar')}
																	>
																		{possui ? (
																			// bolinha preenchida com as cores da barra de progresso
																			<span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
																		) : (
																			// círculo vazado (sem bordas no botão)
																			<svg
																				className="w-4 h-4 text-slate-500 transition-colors group-hover:text-slate-300"
																				viewBox="0 0 24 24"
																				fill="none"
																				stroke="currentColor"
																				strokeWidth="2"
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				aria-hidden="true"
																			>
																				<circle cx="12" cy="12" r="8" />
																			</svg>
																		)}
																	</button>
																	<div className={`${salvando ? 'opacity-60' : ''}`}>
																		<div className="text-slate-200 font-medium">{h.nome}</div>
																		<div className="text-xs text-slate-400">Frequência: {h.frequencia}</div>
																	</div>
																</div>
															);
														})}
													</div>
												</div>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</section>
			</main>
		</div>
	);
}
