import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário
import { useEffect, useState } from "react";

// Página inicial pública
export default function Home() {
	const [cursos, setCursos] = useState([]);
	const [carreiras, setCarreiras] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [cursoToCarreiras, setCursoToCarreiras] = useState({}); // {cursoId: [{id,nome}]}
	const [carreiraToCursos, setCarreiraToCursos] = useState({}); // {carreiraId: [{id,nome}]}

	const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

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
				const [rcursos, rcarreiras, rhabilidades] = await Promise.all([
					fetch(`${API_URL}/curso/`),
					fetch(`${API_URL}/carreira/`),
					fetch(`${API_URL}/habilidade/`)
				]);
				if (!rcursos.ok) throw new Error(`Falha ao buscar cursos (${rcursos.status})`);
				if (!rcarreiras.ok) throw new Error(`Falha ao buscar carreiras (${rcarreiras.status})`);
				if (!rhabilidades.ok) throw new Error(`Falha ao buscar habilidades (${rhabilidades.status})`);
				const [jcursos, jcarreiras, jhabilidades] = await Promise.all([
					rcursos.json(),
					rcarreiras.json(),
					rhabilidades.json()
				]);
				if (!cancel) {
					setCursos(jcursos || []);
					setCarreiras(jcarreiras || []);
					// Após carregar listas base, acumular mapeamentos
					acumularMapeamentos(jcursos || [], jcarreiras || [], jhabilidades || []);
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

	async function acumularMapeamentos(listaCursos, listaCarreiras, listaHabilidades) {
		// Mapa de habilidade_id -> categoria_id para evitar várias chamadas
		const habToCat = new Map((listaHabilidades || []).map(h => [h.id, h.categoria_id]));

		// 1) Para cada curso, buscar seus conhecimentos
		const conhecimentosPorCurso = new Map(); // curso_id -> Set(conhecimento_id)
		await Promise.all((listaCursos || []).map(async (curso) => {
			try {
				const res = await fetch(`${API_URL}/curso/${curso.id}/conhecimentos`);
				if (!res.ok) return;
				const rels = await res.json();
				conhecimentosPorCurso.set(curso.id, new Set((rels || []).map(r => r.conhecimento_id)));
			} catch {}
		}));

		// 2) Para cada conhecimento, buscar suas categorias (com peso)
		const conhecimentoIds = Array.from(new Set(Array.from(conhecimentosPorCurso.values()).flatMap(s => Array.from(s))));
		const catPorConhecimento = new Map(); // conhecimento_id -> Map(categoria_id -> peso)
		await Promise.all(conhecimentoIds.map(async (kid) => {
			try {
				const res = await fetch(`${API_URL}/conhecimento-categoria/${kid}`);
				if (!res.ok) return;
				const rels = await res.json();
				const mapa = new Map();
				for (const r of (rels || [])) {
					const cid = r.categoria_id;
					const peso = typeof r.peso === 'number' && !Number.isNaN(r.peso) ? r.peso : 1;
					mapa.set(cid, (mapa.get(cid) || 0) + peso);
				}
				catPorConhecimento.set(kid, mapa);
			} catch {}
		}));

		// 3) Oferta por curso (via conhecimentos): curso_id -> Map(categoria_id -> somaPeso)
		const ofertaPorCurso = new Map();
		for (const [cursoId, kset] of conhecimentosPorCurso.entries()) {
			const mapa = new Map();
			for (const kid of kset) {
				const m = catPorConhecimento.get(kid) || new Map();
				for (const [cid, peso] of m.entries()) {
					mapa.set(cid, (mapa.get(cid) || 0) + peso);
				}
			}
			ofertaPorCurso.set(cursoId, mapa);
		}

		// 4) Para cada carreira, buscar suas habilidades e mapear para demanda por categoria (com frequencia)
		const demandaPorCarreira = new Map(); // carreira_id -> Map(categoria_id -> demanda)
		await Promise.all((listaCarreiras || []).map(async (carreira) => {
			try {
				const res = await fetch(`${API_URL}/carreira/${carreira.id}/habilidades`);
				if (!res.ok) return;
				const rels = await res.json();
				const mapa = new Map();
				for (const rel of rels || []) {
					const categoriaId = habToCat.get(rel.habilidade_id);
					if (!categoriaId) continue;
					const freq = typeof rel.frequencia === 'number' && !Number.isNaN(rel.frequencia) ? rel.frequencia : 1;
					mapa.set(categoriaId, (mapa.get(categoriaId) || 0) + freq);
				}
				demandaPorCarreira.set(carreira.id, mapa);
			} catch {}
		}));

		// 5) Montar interligações baseadas em score ponderado por categoria
		function scoreCursoCarreira(cursoId, carreiraId) {
			const oferta = ofertaPorCurso.get(cursoId) || new Map();
			const demanda = demandaPorCarreira.get(carreiraId) || new Map();
			let numer = 0;
			let denom = 0;
			for (const [cid, dval] of demanda.entries()) {
				const oval = oferta.get(cid) || 0;
				numer += oval * dval;
				denom += dval;
			}
			if (denom <= 0) return 0;
			return numer / denom; // cobertura média ponderada pela demanda
		}

		const cursoToCarr = {};
		for (const curso of listaCursos || []) {
			const relacionados = (listaCarreiras || [])
				.map(carreira => ({ id: carreira.id, nome: carreira.nome, score: scoreCursoCarreira(curso.id, carreira.id) }))
				.filter(x => x.score > 0)
				.sort((a, b) => b.score - a.score);
			cursoToCarr[curso.id] = relacionados;
		}

		const carreiraToCur = {};
		for (const carreira of listaCarreiras || []) {
			const relacionados = (listaCursos || [])
				.map(curso => ({ id: curso.id, nome: curso.nome, score: scoreCursoCarreira(curso.id, carreira.id) }))
				.filter(x => x.score > 0)
				.sort((a, b) => b.score - a.score);
			carreiraToCur[carreira.id] = relacionados;
		}

		setCursoToCarreiras(cursoToCarr);
		setCarreiraToCursos(carreiraToCur);
	}

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
			<main className="max-w-6xl mx-auto px-4 py-10">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-slate-100">Mapa informativo</h1>
					<p className="mt-2 text-slate-300">Saiba qual curso melhor prepara para cada carreira — sem gráficos, direto ao ponto.</p>
				</div>

				<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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
			</main>
			
		</div>
	);
}

