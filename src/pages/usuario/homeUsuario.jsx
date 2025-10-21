import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário
import { useEffect, useState } from "react"; // useEffect: executar funções | useState: gerenciar estado de componentes
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento + fetch autenticado
import perfilIcon from "../../../images/perfil.png"; // ícone de perfil

// Página inicial do usuário comum
export default function HomeUsuario() {

	const [nome, setNome] = useState(""); // armazena o nome do usuário
	const [carreiraId, setCarreiraId] = useState(null); // carreira escolhida pelo usuário
	const [melhorCurso, setMelhorCurso] = useState(null); // { id, nome, score }
	const [loading, setLoading] = useState(true);
	const [erro, setErro] = useState(null);
	const [habilidadesCarreira, setHabilidadesCarreira] = useState([]); // [{id, nome, frequencia}]
	const [habilidadesUsuarioIds, setHabilidadesUsuarioIds] = useState(new Set());
	const [habLoading, setHabLoading] = useState(false);
	const [habError, setHabError] = useState(null);
	const [expandeHabilidades, setExpandeHabilidades] = useState(false);

	const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	function formatScore(v) {
		if (v == null || Number.isNaN(v)) return '0.00';
		return Number(v).toFixed(2);
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

				if (!cid) {
					setMelhorCurso(null);
					return; // usuário sem carreira definida
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

	// Carrega habilidades (carreira e do usuário) quando já temos carreiraId e usuarioId
	useEffect(() => {
		let cancel = false;
		async function carregarHabilidades() {
			if (!carreiraId) return; // nada a fazer sem carreira
			const usuarioId = localStorage.getItem('usuario_id');
			if (!usuarioId) return;
			setHabLoading(true);
			setHabError(null);
			try {
				// 1) Lista de habilidades da carreira (com frequencia)
				const rCarreira = await fetch(`${API_URL}/carreira/${carreiraId}/habilidades`);
				if (!rCarreira.ok) throw new Error('Falha ao carregar habilidades da carreira');
				const listaCarreira = await rCarreira.json(); // [{id, carreira_id, habilidade_id, frequencia}]

				// 2) Lista de habilidades do usuário (auth)
				const rUserHabs = await authFetch(`${API_URL}/usuario/${usuarioId}/habilidades`);
				if (!rUserHabs.ok) throw new Error('Falha ao carregar habilidades do usuário');
				const listaUsuario = await rUserHabs.json(); // [{id, usuario_id, habilidade_id}]
				const idsUsuario = new Set(listaUsuario.map(h => h.habilidade_id));

				// 3) Mapa de nomes de habilidades
				const rHabs = await fetch(`${API_URL}/habilidade/`);
				if (!rHabs.ok) throw new Error('Falha ao carregar catálogo de habilidades');
				const todas = await rHabs.json(); // [{id, nome, categoria_id, ...}]
				const nomePorId = new Map(todas.map(h => [h.id, h.nome]));

				// Monta lista final com nome e frequencia
				const final = (listaCarreira || []).map(rel => ({
					id: rel.habilidade_id,
					nome: nomePorId.get(rel.habilidade_id) ?? `Habilidade #${rel.habilidade_id}`,
					frequencia: rel.frequencia ?? 0,
				})).sort((a,b) => (b.frequencia||0) - (a.frequencia||0));

				if (!cancel) {
					setHabilidadesCarreira(final);
					setHabilidadesUsuarioIds(idsUsuario);
				}
			} catch (e) {
				if (!cancel) setHabError(e?.message || 'Erro ao carregar habilidades');
			} finally {
				if (!cancel) setHabLoading(false);
			}
		}
		carregarHabilidades();
		return () => { cancel = true };
	}, [API_URL, carreiraId]);

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
						<div className="rounded-lg border border-indigo-700 bg-indigo-900/20 p-4">
							<p className="text-sm text-indigo-200">Para sua carreira</p>
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

				{/* Habilidades da carreira (com seta para expandir) */}
				{carreiraId && (
					<section className="mt-8 max-w-3xl mx-auto">
						<button
							type="button"
							onClick={() => setExpandeHabilidades(v => !v)}
							className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-md hover:bg-slate-800"
						>
							<div className="flex items-center gap-2">
								<svg className={`w-5 h-5 text-indigo-300 transition-transform ${expandeHabilidades ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
								<span className="text-slate-200 font-medium">Habilidades da sua carreira</span>
							</div>
							<span className="text-xs text-slate-400">{expandeHabilidades ? 'recolher' : 'expandir'}</span>
						</button>

						{expandeHabilidades && (
							<div className="mt-3 rounded-md border border-slate-800 bg-slate-900/40">
								{habLoading ? (
									<div className="p-4 text-slate-400">Carregando habilidades…</div>
								) : habError ? (
									<div className="p-4 text-rose-300">{habError}</div>
								) : (habilidadesCarreira?.length ?? 0) === 0 ? (
									<div className="p-4 text-slate-400">Nenhuma habilidade mapeada para esta carreira.</div>
								) : (
									<ul className="divide-y divide-slate-800">
										{habilidadesCarreira.map(h => {
											const possui = habilidadesUsuarioIds.has(h.id);
											return (
												<li key={h.id} className="flex items-center justify-between gap-3 p-3">
													<div className="flex items-center gap-3">
														<span className={`inline-flex items-center justify-center w-6 h-6 rounded border ${possui ? 'bg-emerald-600/20 border-emerald-500/50' : 'bg-slate-800/40 border-slate-700'}`}>
															{possui ? (
																<svg className="w-4 h-4 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
															) : (
																<svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>
															)}
														</span>
														<div>
															<div className="text-slate-200 font-medium">{h.nome}</div>
															<div className="text-xs text-slate-400">Frequência na carreira: {h.frequencia}</div>
														</div>
													</div>
												</li>
											);
										})}
									</ul>
								)}
							</div>
						)}
					</section>
				)}
			</main>
		</div>
	);
}
