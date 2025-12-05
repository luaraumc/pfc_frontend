import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { logoutRedirecionar, authFetch } from "../../utils/auth";
import logoRumoTechno from "../../../images/rumotechno-logo.svg";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página inicial do usuário comum
export default function HomeUsuario() {

	const [nome, setNome] = useState("");
	const [carreiraId, setCarreiraId] = useState(null);
	const [habilidadesUsuarioIds, setHabilidadesUsuarioIds] = useState(new Set());
	const [nomePorHabilidadeId, setNomePorHabilidadeId] = useState(new Map());
	const [expandedCarreiras, setExpandedCarreiras] = useState(new Set());
	const [habPorCarreira, setHabPorCarreira] = useState({});
	const [topCarreiras, setTopCarreiras] = useState([]);
	const [loadingCompat, setLoadingCompat] = useState(true);	
	const [erroCompat, setErroCompat] = useState("");
	const [ordemCongeladaIds, setOrdemCongeladaIds] = useState(null);
	const [savingHabIds, setSavingHabIds] = useState(new Set());
	const [erroChecklist, setErroChecklist] = useState("");
	const [buscaHabPorCarreira, setBuscaHabPorCarreira] = useState({});
	const [melhorCursoPorCarreira, setMelhorCursoPorCarreira] = useState(new Map());
	const [buscaGlobal, setBuscaGlobal] = useState("");
	// Controle do menu hambúrguer para tablet/mobile
	const [menuAberto, setMenuAberto] = useState(false);

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
		(async () => {
			try {
				const n = localStorage.getItem("usuario_nome") || "";
				const usuarioId = localStorage.getItem('usuario_id');
				setNome(n);
				if (!usuarioId) return;
				const rUser = await fetch(`${API_URL}/usuario/${usuarioId}`);
				if (!rUser.ok) return;
				const user = await rUser.json();
				if (cancel) return;
				setCarreiraId(user?.carreira_id ?? null);
			} catch {}
		})();
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
			const itens = (lista || [])
				.filter(rel => (rel.frequencia ?? 0) >= 3) // filtra habilidades com frequência >= 3
				.map(rel => ({
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

	// Helper: reordena mantendo carreira do usuário no topo e demais na ordem congelada
	function ordenarCarreiras(lista) {
		if (!Array.isArray(lista) || lista.length === 0) return [];
		const mapa = new Map(lista.map((it) => [it.carreira_id, it]));
		const temCarreiraUsuario = carreiraId != null && mapa.has(carreiraId);
		const fixo = temCarreiraUsuario ? [mapa.get(carreiraId)] : [];
		// Se ainda não congelamos a ordem, congele agora com base na lista inicial
		if (!ordemCongeladaIds) {
			const idsBase = lista
				.map((it) => it.carreira_id)
				.filter((id) => id !== carreiraId);
			setOrdemCongeladaIds(idsBase);
			const restos = idsBase.map((id) => mapa.get(id)).filter(Boolean);
			return [...fixo, ...restos];
		}
		// Use a ordem congelada e, se surgir id novo, coloque ao final
		const restosCongelados = ordemCongeladaIds
			.map((id) => mapa.get(id))
			.filter(Boolean);
		const extras = lista
			.filter((it) => it.carreira_id !== carreiraId && !ordemCongeladaIds.includes(it.carreira_id));
		return [...fixo, ...restosCongelados, ...extras];
	}	

	// Atualização silenciosa (sem alterar loading/placeholder) para evitar flicker
	async function recarregarCompatibilidadeSilenciosa() {
		try {
			const usuarioId = localStorage.getItem('usuario_id');
			if (!usuarioId) return;
			const res = await authFetch(`${API_URL}/usuario/${usuarioId}/compatibilidade/top`);
			if (!res.ok) return;
			const data = await res.json();
			const ordenada = ordenarCarreiras(Array.isArray(data) ? data : []);
			setTopCarreiras(ordenada);
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

	// Toggle global (fora do contexto de uma carreira específica)
	async function handleToggleHabilidadeGlobal(habilidade) {
		setErroChecklist("");
		const usuarioId = localStorage.getItem('usuario_id');
		if (!usuarioId) {
			setErroChecklist("Usuário não identificado.");
			return;
		}
		if (savingHabIds.has(habilidade.id)) return;
		const possui = habilidadesUsuarioIds.has(habilidade.id);
		setSavingHabIds(prev => { const s = new Set(prev); s.add(habilidade.id); return s; });
		try {
			const res = possui
				? await removerHabilidadeUsuario(usuarioId, habilidade.id)
				: await adicionarHabilidadeUsuario(usuarioId, habilidade.id);
			if (!res.ok) throw new Error('Falha ao atualizar habilidade');
			setHabilidadesUsuarioIds(prev => { const s = new Set(prev); if (possui) s.delete(habilidade.id); else s.add(habilidade.id); return s; });
			await recarregarCompatibilidadeSilenciosa();
		} catch (e) {
			setErroChecklist(e?.message || "Erro ao atualizar habilidade");
		} finally {
			setSavingHabIds(prev => { const s = new Set(prev); s.delete(habilidade.id); return s; });
		}
	}

	// Toggle do checklist
	async function handleToggleHabilidade(habilidade) {
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
				if (!cancel) {
					const ordenada = ordenarCarreiras(Array.isArray(data) ? data : []);
					setTopCarreiras(ordenada);
				}
			} catch (e) {
				if (!cancel) setErroCompat("Não foi possível carregar sua compatibilidade agora.");
			} finally {
				if (!cancel) setLoadingCompat(false);
			}
		})();
		return () => { cancel = true };
	}, [API_URL, carreiraId]);

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

	// Rolagem suave para o topo ao clicar na logo
	const scrollToTop = (e) => {
		e.preventDefault();
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	// HTML
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200 pt-14 sm:pt-16">

			{/* HEADER */}
			<header className="fixed inset-x-0 top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
				<div className="w-90% mx-2 sm:mx-4 md:mx-10 px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between relative">
					<a
						href="#topo"
						onClick={scrollToTop}
						className="text-xl font-semibold text-indigo-300 hover:text-indigo-200"
						aria-label="Voltar ao topo"
					>
						<img
							src={logoRumoTechno}
							alt="RumoTechno"
							className="h-7 sm:h-8 w-auto transition-transform duration-200 ease-out hover:scale-103"
						/>
					</a>
					{/* Navegação central (desktop) */}
					<nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-40">
						<a className="text-lg font-medium text-indigo-200" href="/homeUsuario" data-discover="true">Meu Progresso</a>
						<a className="text-lg font-medium text-white hover:text-indigo-200" href="/usuario/cursos" data-discover="true">Cursos</a>
					</nav>

					{/* Ações à direita (desktop) */}
					<div className="hidden lg:flex items-center gap-3">
						<Link
							to="/usuario/editar-perfil"
							className="px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
						>
							<span>Editar Perfil</span>
						</Link>
						<button
							onClick={logoutRedirecionar}
							className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">
							Sair
						</button>
					</div>

					{/* Botão hambúrguer em mobile e tablet */}
					<button
						type="button"
						className="lg:hidden inline-flex items-center justify-center p-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
						aria-controls="menu-mobile"
						aria-expanded={menuAberto}
						onClick={() => setMenuAberto((v) => !v)}
						aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
					>
						{menuAberto ? (
							/* Ícone X */
							<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
						) : (
							/* Ícone hambúrguer */
							<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
						)}
					</button>
				</div>

				{/* Menu colapsável para mobile/tablet */}
				{menuAberto && (
					<div id="menu-mobile" className="lg:hidden border-t border-slate-800 bg-slate-950/95">
						<nav className="px-3 py-3 flex flex-col gap-2">
							<a className="px-2 py-2 rounded text-slate-200 hover:bg-slate-800/50" href="/homeUsuario" data-discover="true" onClick={() => setMenuAberto(false)}>Meu Progresso</a>
							<a className="px-2 py-2 rounded text-slate-200 hover:bg-slate-800/50" href="/usuario/cursos" data-discover="true" onClick={() => setMenuAberto(false)}>Cursos</a>
							<Link
								to="/usuario/editar-perfil"
								className="px-3 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
								onClick={() => setMenuAberto(false)}
							>
								<span>Editar Perfil</span>
							</Link>
							<button
								onClick={() => { setMenuAberto(false); logoutRedirecionar(); }}
								className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 text-left"
							>
								Sair
							</button>
						</nav>
					</div>
				)}
			</header>

			{/* CONTEÚDO PRINCIPAL */}
			<main className="max-w-6xl mx-auto px-4 py-8">

				{/* título */}
				<h1 className="text-3xl font-bold text-white mb-4 text-center">Olá{nome ? `, ${nome}` : ''}!</h1>

				{/* descrição */}
				<p className="mt-2 text-slate-300 text-center">Cadastre suas habilidades e veja quais carreiras de TI mais combinam com você</p>
				<p className="text-slate-300 text-center">
					Nosso sistema compara suas habilidades com as mais procuradas no mercado e mostra o quanto você está preparado para cada área.
				</p>

				{/* Compatibilidade com Carreiras */}
				<section className="mt-10">
					<div className="space-y-4">
						{loadingCompat && (
							<div className="min-h-[160px] flex items-center justify-center text-slate-300">
								<div className="text-center">
									<div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
									<p>Carregando sua compatibilidade...</p>
								</div>
							</div>
						)}
						{!loadingCompat && erroCompat && (
							<p className="text-rose-300">{erroCompat}</p>
						)}
						{!loadingCompat && !erroCompat && topCarreiras.length === 0 && (
							<div className="text-slate-300">
								<p>Nenhuma carreira encontrada ainda.</p>
								<p className="mt-1">Dica: cadastre suas habilidades para ver sua compatibilidade!</p>
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
														<label className="block text-sm text-slate-300 mb-1 ml-1">Buscar por nome:</label>
														<input
															type="text"
															placeholder="Digite parte do nome"
															value={buscaHabPorCarreira[carreiraIdCard] || ''}
															onChange={(e) =>
																setBuscaHabPorCarreira(prev => ({ ...prev, [carreiraIdCard]: e.target.value }))
															}
															className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
														/>
														<label className="block text-sm text-slate-400 mt-2 text-right mr-1">A frequência é a quantidade de vezes que a habilidade apareceu em 50 vagas cadastradas.</label>
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
																			onClick={() => handleToggleHabilidade(h)}
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
																			<div className="text-xs text-slate-400 flex items-center gap-1">
																				<span>Frequência: {h.frequencia}</span>
																			</div>
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

				{/* Cadastro rápido por busca global de habilidades */}
				<section className="mt-12 mb-20">
					<h2 className="text-xl font-semibold text-slate-200 text-center">Adicionar habilidade por busca</h2>
					<p className="text-slate-400 text-sm mt-1 text-center">Encontre e cadastre uma habilidade.</p>
					<div className="mt-3">
						<input
							type="text"
							placeholder="Digite o nome da habilidade (ex.: Python, React, SQL)"
							value={buscaGlobal}
							onChange={(e) => setBuscaGlobal(e.target.value)}
							className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
						/>
					</div>

					{buscaGlobal.trim() && (
						<div className="mt-3">
							{(() => {
								const termo = buscaGlobal.trim().toLowerCase();
								const todas = Array.from(nomePorHabilidadeId.entries()).map(([id, nome]) => ({ id, nome }));
								const filtradas = todas
									.filter(h => (h.nome || '').toLowerCase().includes(termo))
									.slice(0, 12);
								if (filtradas.length === 0) {
									return <div className="text-slate-400 text-sm">Nenhuma habilidade corresponde à busca.</div>;
								}
								return (
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
										{filtradas.map(h => {
											const possui = habilidadesUsuarioIds.has(h.id);
											const salvando = savingHabIds.has(h.id);
											return (
												<div key={`g-${h.id}`} className="flex items-center gap-3 p-3 rounded bg-transparent">
													<button
														type="button"
														onClick={() => handleToggleHabilidadeGlobal(h)}
														disabled={salvando}
														className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-transparent ${salvando ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800/30'} transition-colors group`}
														aria-pressed={possui}
														aria-label={`${possui ? 'Remover' : 'Adicionar'} habilidade ${h.nome}`}
														title={salvando ? 'Salvando...' : (possui ? 'Clique para remover' : 'Clique para adicionar')}
													>
														{possui ? (
															<span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
														) : (
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
													</div>
												</div>
											);
										})}
									</div>
								);
							})()}
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
