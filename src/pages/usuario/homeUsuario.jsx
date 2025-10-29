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
	// NOVO: estado de busca por nome por carreira
	const [buscaHabPorCarreira, setBuscaHabPorCarreira] = useState({});
	// novo: mapa carreira_id -> melhor curso
	const [melhorCursoPorCarreira, setMelhorCursoPorCarreira] = useState(new Map());

	// Busca de habilidades por carreira (texto -> por carreira_id)
	// const [buscaHabPorCarreira, setBuscaHabPorCarreira] = useState({});

	const API_URL = import.meta.env.VITE_API_URL ?? 'https://pfcbackend-production-668a.up.railway.app';

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
				const rMapa = await fetch(`${API_URL}/mapa/`);
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

	// novo: carregar mapa de cursos e montar carreira_id -> melhor curso
	useEffect(() => {
		let cancel = false;
		(async () => {
			try {
				const rMapa = await fetch(`${API_URL}/mapa`);
				if (!rMapa.ok) return;
				const mapa = await rMapa.json();
				if (cancel) return;
				const ct = mapa?.carreiraToCursos ?? {};
				const m = new Map();
				for (const [cid, lista] of Object.entries(ct)) {
					if (Array.isArray(lista) && lista.length > 0) {
						m.set(Number(cid), lista[0]); // primeiro curso como recomendado
					}
				}
				setMelhorCursoPorCarreira(m);
			} catch {}
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

				{/* título */}
				<h1 className="text-2xl font-semibold text-center">Olá{nome ? `, ${nome}` : ''}!</h1>

				{/* descrição */}
				<p className="mt-2 text-slate-300 text-center">Veja as carreiras de TI que mais combinam com você.</p>

				{/* Compatibilidade com Carreiras */}
				<section className="mt-10">
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
							// gradiente único por card
							const starGradId = `starGrad-${carreiraIdCard}`;
							// filtro por nome da habilidade para este card
							const buscaHab = (buscaHabPorCarreira[carreiraIdCard] || '').trim().toLowerCase();
							const itensFiltrados = Array.isArray(entry.itens)
								? (buscaHab ? entry.itens.filter(h => (h?.nome || '').toLowerCase().includes(buscaHab)) : entry.itens)
								: [];
							// novo: curso recomendado deste card
							const recCurso = melhorCursoPorCarreira.get(carreiraIdCard);

							return (
								<div
									key={`${carreiraIdCard}-${idx}`}
									className="p-4 rounded bg-slate-950/50 shadow-lg shadow-slate-900/40"
								>
									<div className="flex items-center justify-between mb-2">
										<div className="font-medium flex items-center gap-2">
											<span>{item.carreira_nome ?? 'Carreira'}</span>
											{item.carreira_id === carreiraId && (
												<svg className="w-4 h-4" viewBox="0 0 24 24" aria-label="Carreira preferencial" title="Carreira preferencial">
													<defs>
														<linearGradient id={starGradId} x1="0%" y1="0%" x2="100%" y2="0%">
															<stop offset="0%" stopColor="#6366F1" /> {/* indigo-500 */}
															<stop offset="100%" stopColor="#22D3EE" /> {/* cyan-400 */}
														</linearGradient>
													</defs>
													<path fill={`url(#${starGradId})`} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
												</svg>
											)}
										</div>
										<div className="text-slate-300 text-sm">{item.percentual}%</div>
									</div>
									<ProgressBar value={item.percentual} />

									{/* novo: curso recomendado por carreira */}
									{recCurso && (
										<div className="mt-2 text-slate-300 text-sm">
											Faculdade recomendada: <span className="text-indigo-300">{recCurso.nome}</span>
										</div>
									)}

									<div className="mt-2 flex items-center justify-between gap-2">
										<span className="text-slate-400 text-sm">Veja as habilidades exigidas na carreira.</span>
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

													{/* NOVO: Buscar por nome (estilo página admin) */}
													<div className="mb-3">
														<label className="block text-sm text-slate-300 mb-1">Buscar por nome</label>
														<input
															type="text"
															placeholder="Digite parte do nome"
															value={buscaHabPorCarreira[carreiraIdCard] || ''}
															onChange={(e) =>
																setBuscaHabPorCarreira(prev => ({ ...prev, [carreiraIdCard]: e.target.value }))
															}
															className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
														/>
													</div>

													{itensFiltrados.length === 0 ? (
														<div className="text-slate-400 text-sm">Nenhuma habilidade corresponde à busca.</div>
													) : (
														<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
															{itensFiltrados.map(h => {
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
													)}
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
