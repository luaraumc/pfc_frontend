import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário
import { useEffect, useState } from "react"; // useEffect: executar funções | useState: gerenciar estado de componentes
import { useNavigate } from "react-router-dom"; // navegação programática
import { getAccessToken, VerificarTokenExpirado, refreshAccessToken, authFetch, transformarJwt } from '../utils/auth'; // funções de autenticação

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página inicial pública
export default function Home() {
	const navigate = useNavigate(); // navegação programática
	const [cursos, setCursos] = useState([]);
	const [carreiras, setCarreiras] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [cursoToCarreiras, setCursoToCarreiras] = useState({}); // {cursoId: [{id,nome,score}]}
	const [carreiraToCursos, setCarreiraToCursos] = useState({}); // {carreiraId: [{id,nome,score}]}

	// Se o usuário já está autenticado, redireciona para a home apropriada
	useEffect(() => {
		let cancel = false;
		async function checarTokenERedirecionar() {
			const token = getAccessToken();
			if (!token) return; // não autenticado
			try {
				let usableToken = token;
				if (VerificarTokenExpirado(token)) {
					await refreshAccessToken();
					usableToken = getAccessToken();
					if (!usableToken) return;
				}
				// tenta inferir perfil a partir do localStorage ou buscando o usuário
				const storedIsAdmin = localStorage.getItem('is_admin');
				if (storedIsAdmin === 'true' || storedIsAdmin === 'false') {
					if (!cancel) navigate(storedIsAdmin === 'true' ? '/homeAdmin' : '/homeUsuario', { replace: true });
					return;
				}
				// se não houver a flag, decodifica token e busca dados do usuário
				const decoded = transformarJwt(usableToken);
				const userId = decoded?.sub ? Number(decoded.sub) : null;
				if (!userId) return;
				const res = await authFetch(`${API_URL}/usuario/${userId}`);
				if (!res.ok) return;
				const user = await res.json().catch(() => ({}));
				const isAdmin = !!user?.admin;
				localStorage.setItem('is_admin', String(isAdmin));
				if (user?.nome) localStorage.setItem('usuario_nome', String(user.nome));
				if (!cancel) navigate(isAdmin ? '/homeAdmin' : '/homeUsuario', { replace: true });
			} catch (e) {
				// se houver falha na renovação, não redireciona e deixa a página pública
				try { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); } catch {}
			}
		}
		checarTokenERedirecionar();
		return () => { cancel = true; };
	}, [API_URL, navigate]);

	function formatScore(v) {
		if (v == null || Number.isNaN(v)) return '0.00';
		return Number(v).toFixed(2);
	}

	function scoreTone(score) {
		if (score >= 0.75) return 'bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/30';
		if (score >= 0.4) return 'bg-amber-600/20 text-amber-300 ring-1 ring-amber-500/30';
		return 'bg-rose-600/20 text-rose-300 ring-1 ring-rose-500/30';
	}

	useEffect(() => {
		let cancel = false;
		async function carregar() {
			try {
				const r = await fetch(`${API_URL}/mapa/`);
				if (!r.ok) throw new Error(`Falha ao carregar mapa (${r.status})`);
				const j = await r.json();
				if (!cancel) {
					setCursos(j.cursos ?? []);
					setCarreiras(j.carreiras ?? []);
					setCursoToCarreiras(j.cursoToCarreiras ?? {});
					setCarreiraToCursos(j.carreiraToCursos ?? {});
				}
			} catch (e) {
				if (!cancel) setError(e?.message || 'Erro ao carregar dados');
			} finally {
				if (!cancel) setLoading(false);
			}
		}
		carregar();
		return () => { cancel = true };
	}, [API_URL]);

	// HTML
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">

			{/* HEADER */}
			<header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
				<div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
					<Link to="/" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
						PFC
					</Link>
					<div className="flex items-center gap-3">
						<Link
							to="/login"
							className="px-4 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
						>
							Entrar
						</Link>
						<Link
							to="/cadastro"
							className="px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
						>
							Cadastre-se
						</Link>
					</div>
				</div>
			</header>

			{/* CONTEÚDO PRINCIPAL */}
			<main className="w-full">
				{/* hero padronizado com tema escuro em largura total */}
				<section
					id="inicio"
					className="relative overflow-hidden bg-slate-950/60 px-4 sm:px-6 md:px-8 py-16 text-center"
				>
					<div className="mx-auto max-w-3xl">
						<h1 className="text-4xl md:text-5xl font-bold leading-tight text-slate-100">
							Descubra sua compatibilidade com o mercado — e a faculdade certa para chegar lá.
						</h1>
						<p className="mt-6 text-lg text-slate-400">
							Saiba exatamente quais habilidades te aproximam da carreira dos seus sonhos,
							com base em dados reais do mercado e da educação.
						</p>
						<div className="mt-8 flex flex-wrap justify-center gap-3">
							<Link
								to="/cadastro"
								className="px-5 py-2.5 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
							>
								Cadastrar agora
							</Link>
							<Link
								to="/login"
								className="px-5 py-2.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
							>
								Entrar na plataforma
							</Link>
						</div>
					</div>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-600/10 via-slate-900/0 to-slate-900/30"
					/>
				</section>

				{/* ===== COMO FUNCIONA ===== */}
				<section id="sobre" className="relative bg-slate-900/40 px-4 sm:px-6 md:px-8 py-16">
					<div className="max-w-5xl mx-auto text-center">
						<h2 className="text-3xl font-bold text-slate-100 mb-6">
							Entenda o que o mercado espera de você.
						</h2>
						<p className="text-slate-400 leading-relaxed mb-4">
							Nosso sistema analisa centenas de vagas reais em plataformas como LinkedIn, Indeed e Catho
							para identificar as habilidades mais requisitadas em cada carreira.
						</p>
						<p className="text-slate-400 leading-relaxed">
							Depois, compara essas habilidades com as que você já possui — revelando o quanto está pronto
							para o mercado e o que ainda precisa desenvolver. Também cruzamos essas informações com as diretrizes
							curriculares do MEC e as disciplinas das principais faculdades, mostrando quais cursos mais
							contribuem para o seu crescimento profissional.
						</p>

						{/* Cards com alternância de cores */}
						<div className="grid md:grid-cols-3 gap-6 mt-12">
							<div className="rounded-md border border-slate-800 odd:bg-slate-900/40 even:bg-slate-950/40 hover:bg-slate-800/40 transition p-6">
								<h3 className="text-lg font-semibold text-slate-100 mb-2">Coleta de Vagas</h3>
								<p className="text-slate-400">
									Buscamos dados em plataformas reais como LinkedIn, Indeed e Catho.
								</p>
							</div>
							<div className="rounded-md border border-slate-800 odd:bg-slate-900/40 even:bg-slate-950/40 hover:bg-slate-800/40 transition p-6">
								<h3 className="text-lg font-semibold text-slate-100 mb-2">Comparação Inteligente</h3>
								<p className="text-slate-400">
									Comparamos as habilidades do mercado com as suas, em tempo real.
								</p>
							</div>
							<div className="rounded-md border border-slate-800 odd:bg-slate-900/40 even:bg-slate-950/40 hover:bg-slate-800/40 transition p-6">
								<h3 className="text-lg font-semibold text-slate-100 mb-2">Recomendação de Faculdades</h3>
								<p className="text-slate-400">
									Indicamos os cursos que mais desenvolvem as habilidades que o mercado exige.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* ===== CTA ===== */}
				<section className="relative overflow-hidden bg-slate-950/60 px-4 sm:px-6 md:px-8 py-16 text-center">
					<div className="max-w-4xl mx-auto">
						<h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-100">
							Construa seu futuro com base em dados reais.
						</h2>
						<p className="text-lg leading-relaxed mb-8 text-slate-400">
							Descubra seu potencial, identifique suas lacunas e escolha a faculdade que vai te levar mais longe.
							<br />O primeiro passo para sua evolução profissional começa agora.
						</p>
						<div className="flex flex-wrap justify-center gap-4">
							<Link
								to="/cadastro"
								className="px-5 py-2.5 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
							>
								Cadastrar agora
							</Link>
							<Link
								to="/login"
								className="px-5 py-2.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
							>
								Entrar na plataforma
							</Link>
						</div>
					</div>
				</section>

				<div className="mt-8 max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
					<section>
						<h2 className="text-xl font-semibold text-slate-100 mb-3 text-center flex items-center justify-center gap-2">
							<svg className="w-5 h-5 text-indigo-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3zm0 2.236L5 8.118v7.764L12 18.764l7-2.882V8.118L12 5.236z"/></svg>
							Cursos
						</h2>
						<div className="rounded-md border border-slate-800 bg-slate-900/40">
							{loading && <div className="p-4 text-slate-400">Carregando cursos…</div>}
							{error && <div className="p-4 text-red-300">{error}</div>}
							{!loading && !error && (
								<ul className="divide-y divide-slate-800">
									{(cursos ?? []).map((c) => (
										<li key={c.id} className="p-3 hover:bg-slate-800/40 transition rounded-md">
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-2">
													<div className="h-6 w-6 rounded-full bg-indigo-500/20 ring-1 ring-indigo-400/30 flex items-center justify-center text-indigo-300 text-xs">C</div>
													<div className="text-slate-200 font-medium">{c.nome}</div>
												</div>
												{Array.isArray(cursoToCarreiras[c.id]) && cursoToCarreiras[c.id].length > 0 ? (
													<span className={`px-2 py-1 rounded-full text-xs font-medium ${scoreTone(cursoToCarreiras[c.id][0].score)}`}>
														Score {formatScore(cursoToCarreiras[c.id][0].score)}
													</span>
												) : null}
											</div>
											<div className="mt-1 text-slate-400 text-sm">
												{Array.isArray(cursoToCarreiras[c.id]) && cursoToCarreiras[c.id].length > 0 ? (
													<>Melhor carreira: <span className="text-slate-200">{cursoToCarreiras[c.id][0].nome}</span></>
												) : (
													<span className="text-slate-500">Sem relações mapeadas</span>
												)}
											</div>
										</li>
									))}
									{(cursos ?? []).length === 0 && (
										<li className="p-3 text-slate-400">Nenhum curso cadastrado.</li>
									)}
								</ul>
							)}
						</div>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-slate-100 mb-3 text-center flex items-center justify-center gap-2">
							<svg className="w-5 h-5 text-indigo-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 7a2 2 0 012-2h3l1-2h5l1 2h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm2 0v11h14V7H5z"/></svg>
							Carreiras
						</h2>
						<div className="rounded-md border border-slate-800 bg-slate-900/40">
							{loading && <div className="p-4 text-slate-400">Carregando carreiras…</div>}
							{error && <div className="p-4 text-red-300">{error}</div>}
							{!loading && !error && (
								<ul className="divide-y divide-slate-800 overflow-auto">
									{(carreiras ?? []).map((c) => (
										<li key={c.id} className="p-3 hover:bg-slate-800/40 transition rounded-md">
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-2">
													<div className="h-6 w-6 rounded-full bg-indigo-500/20 ring-1 ring-indigo-400/30 flex items-center justify-center text-indigo-300 text-xs">R</div>
													<div className="text-slate-200 font-medium">{c.nome}</div>
												</div>
												{Array.isArray(carreiraToCursos[c.id]) && carreiraToCursos[c.id].length > 0 ? (
													<span className={`px-2 py-1 rounded-full text-xs font-medium ${scoreTone(carreiraToCursos[c.id][0].score)}`}>
														Score {formatScore(carreiraToCursos[c.id][0].score)}
													</span>
												) : null}
											</div>
											<div className="mt-1 text-slate-400 text-sm">
												{Array.isArray(carreiraToCursos[c.id]) && carreiraToCursos[c.id].length > 0 ? (
													<>Curso com melhor preparação: <span className="text-slate-200">{carreiraToCursos[c.id][0].nome}</span></>
												) : (
													<span className="text-slate-500">Sem relações mapeadas</span>
												)}
											</div>
										</li>
									))}
									{(carreiras ?? []).length === 0 && (
										<li className="p-3 text-slate-400">Nenhuma carreira cadastrada.</li>
									)}
								</ul>
							)}
						</div>
					</section>
				</div>

				{/* ===== FOOTER ===== */}
				<footer className="w-full px-4 sm:px-6 md:px-8 py-10 bg-slate-950/60 text-slate-400 text-center">
					<p>© 2025 RumoTechno. Todos os direitos reservados.</p>
					<div className="mt-4 flex justify-center gap-6 text-sm">
						<Link to="/privacidade" className="hover:text-slate-200 transition">Política de Privacidade</Link>
					</div>
				</footer>
			</main>
			
		</div>
	);
}
