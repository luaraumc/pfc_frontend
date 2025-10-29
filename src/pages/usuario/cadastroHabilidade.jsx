import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { authFetch, logoutRedirecionar } from "../../utils/auth";
import perfilIcon from "../../../images/perfil.png"; // ícone de perfil

const API_URL = import.meta.env.VITE_API_URL ?? "https://pfcbackend-test.up.railway.app";

// Página: Cadastro de Habilidades do Usuário
export default function CadastroHabilidade() {
	const navigate = useNavigate();

	// Estados principais
	const [habilidadesGlobais, setHabilidadesGlobais] = useState([]);
	const [habilidadesUsuario, setHabilidadesUsuario] = useState([]); // objetos { id, usuario_id, habilidade_id }
	const [loadingGlobais, setLoadingGlobais] = useState(true);
	const [loadingUsuario, setLoadingUsuario] = useState(true);
	const [erroGlobais, setErroGlobais] = useState("");
	const [erroUsuario, setErroUsuario] = useState("");
	const [mensagem, setMensagem] = useState("");

	// Adicionar habilidade
	const [habilidadeParaAdicionar, setHabilidadeParaAdicionar] = useState("");
	const [busca, setBusca] = useState("");
	const [adicionando, setAdicionando] = useState(false);
	const [erroAdicionar, setErroAdicionar] = useState("");

	// Remover habilidade
	const [removendoId, setRemovendoId] = useState(null);
	const [erroRemover, setErroRemover] = useState("");

	// Usuario ID
	const usuarioId = typeof window !== 'undefined' ? localStorage.getItem('usuario_id') : null;

	// Carregar Habilidades Globais
	useEffect(() => {
		let ativo = true;
		(async () => {
			try {
				setLoadingGlobais(true);
				const res = await fetch(`${API_URL}/habilidade/`);
				if (!res.ok) throw new Error(`Falha ao listar habilidades (HTTP ${res.status})`);
				const data = await res.json();
				if (ativo) setHabilidadesGlobais(Array.isArray(data) ? data : []);
			} catch (e) {
				if (ativo) setErroGlobais(e.message || "Erro ao carregar habilidades");
			} finally {
				if (ativo) setLoadingGlobais(false);
			}
		})();
		return () => { ativo = false; };
	}, []);

	// Carregar Habilidades do Usuário
	useEffect(() => {
		if (!usuarioId) { navigate('/login'); return; }
		let ativo = true;
		(async () => {
			try {
				setLoadingUsuario(true);
				const res = await authFetch(`${API_URL}/usuario/${usuarioId}/habilidades`);
				const data = await res.json().catch(() => ([]));
				if (!res.ok) throw new Error(data?.detail || data?.message || `Falha ao listar (HTTP ${res.status})`);
				if (ativo) setHabilidadesUsuario(Array.isArray(data) ? data : []);
			} catch (e) {
				if (ativo) setErroUsuario(e.message || "Erro ao carregar suas habilidades");
			} finally {
				if (ativo) setLoadingUsuario(false);
			}
		})();
		return () => { ativo = false; };
	}, [navigate, usuarioId]);

	// Mapear id->nome para exibir nomes na lista do usuário
	const nomeDaHabilidade = (id) => {
		const h = habilidadesGlobais.find(x => Number(x.id) === Number(id));
		return h?.nome || `Habilidade #${id}`;
	};

	// Habilidades ainda não adicionadas pelo usuário
	const opcoesDisponiveis = useMemo(() => {
		const idsUsuario = new Set(habilidadesUsuario.map(h => Number(h.habilidade_id)));
		return habilidadesGlobais.filter(h => !idsUsuario.has(Number(h.id)));
	}, [habilidadesGlobais, habilidadesUsuario]);

	// Normalização e ranqueamento aproximado
	const normalizar = (s) => (s || "").toString()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();

	const opcoesFiltradas = useMemo(() => {
		const listaBase = opcoesDisponiveis || [];
		const q = normalizar(busca);
		if (!q) return listaBase;
		const tokens = q.split(/\s+/).filter(Boolean);
		return listaBase
			.map(h => {
				const n = normalizar(h.nome);
				let score = 0;
				const idx = n.indexOf(q);
				if (idx >= 0) {
					// match direto favorece prefixos
					score += 100 - Math.min(idx, 99);
				}
				// tokens individuais presentes
				let tokensPres = 0;
				tokens.forEach(t => { if (n.includes(t)) tokensPres += 1; });
				score += tokensPres * 10;
				// cobertura de caracteres (aproximação simples)
				const setN = new Set(n);
				let chars = 0; for (const ch of q) { if (setN.has(ch)) chars += 1; }
				score += Math.min(chars, 10) * 1; // até +10 pts
				return { h, score };
			})
			.filter(x => x.score > 0)
			.sort((a, b) => (b.score - a.score) || String(a.h.nome).localeCompare(String(b.h.nome)))
			.map(x => x.h);
	}, [opcoesDisponiveis, busca]);

	// Adicionar habilidade ao usuário
	async function adicionarHabilidade(e) {
		e.preventDefault();
		setErroAdicionar("");
		setMensagem("");
		if (!habilidadeParaAdicionar || !usuarioId) return;
		try {
			setAdicionando(true);
			const res = await authFetch(`${API_URL}/usuario/${usuarioId}/adicionar-habilidade/${habilidadeParaAdicionar}`, { method: 'POST' });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.detail || data?.message || `Falha ao adicionar (HTTP ${res.status})`);
			// Atualiza lista local
			if (data && data.habilidade_id) {
				setHabilidadesUsuario(prev => [...prev, data]);
			} else {
				// fallback caso não venha schema completo
				setHabilidadesUsuario(prev => [...prev, { id: data?.id, usuario_id: Number(usuarioId), habilidade_id: Number(habilidadeParaAdicionar) }]);
			}
			setMensagem("Habilidade adicionada");
			setHabilidadeParaAdicionar("");
		} catch (e) {
			setErroAdicionar(e.message || "Erro ao adicionar habilidade");
		} finally {
			setAdicionando(false);
		}
	}

	// Remover habilidade do usuário
	async function removerHabilidade(habilidadeId) {
		if (!usuarioId) return;
		setErroRemover("");
		setMensagem("");
		try {
			setRemovendoId(habilidadeId);
			const res = await authFetch(`${API_URL}/usuario/${usuarioId}/remover-habilidade/${habilidadeId}`, { method: 'DELETE' });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.detail || data?.message || `Falha ao remover (HTTP ${res.status})`);
			// Atualiza lista local
			setHabilidadesUsuario(prev => prev.filter(u => Number(u.habilidade_id) !== Number(habilidadeId)));
			setMensagem("Habilidade removida");
		} catch (e) {
			setErroRemover(e.message || "Erro ao remover habilidade");
		} finally {
			setRemovendoId(null);
		}
	}

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

			{/* MAIN */}
			<main className="ml-8 mr-8 mx-auto px-4 py-5">
				<button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">
					<span aria-hidden>←</span> Voltar
				</button>
				<h1 className="text-2xl font-semibold text-center mb-8">Minhas Habilidades</h1>

				<div className="flex flex-col lg:flex-row gap-8 items-start">
					{/* Lista de habilidades do usuário */}
					<div className="flex-1 w-full">
						{(loadingGlobais || loadingUsuario) && (
							<p className="text-slate-400">Carregando…</p>
						)}
						{!!mensagem && !(loadingGlobais || loadingUsuario) && (
							<div className="mb-3 p-3 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">{mensagem}</div>
						)}
						{!!erroUsuario && (
							<div className="p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">{erroUsuario}</div>
						)}
						{!!erroGlobais && (
							<div className="mt-2 p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">{erroGlobais}</div>
						)}

						{!(loadingGlobais || loadingUsuario) && !erroUsuario && !erroGlobais && (
							habilidadesUsuario.length === 0 ? (
								<p className="text-slate-400">Você ainda não adicionou habilidades.</p>
							) : (
								<ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
									{habilidadesUsuario.map(uh => (
										<li key={uh.id ?? uh.habilidade_id} className="p-4 flex items-center justify-between">
											<div>
												<p className="font-medium">{nomeDaHabilidade(uh.habilidade_id)}</p>
											</div>
											<button
												onClick={() => removerHabilidade(uh.habilidade_id)}
												disabled={removendoId === uh.habilidade_id}
												className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-700 text-red-200 hover:bg-red-900/40 disabled:opacity-50"
												title="Remover"
											>
												{removendoId === uh.habilidade_id ? 'Removendo…' : 'Remover'}
											</button>
										</li>
									))}
								</ul>
							)
						)}

						{!!erroRemover && (
							<div className="mt-3 p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">{erroRemover}</div>
						)}
					</div>

					{/* Painel lateral: adicionar habilidade */}
					<div className="w-full lg:w-96 self-start">

						<div className="bg-slate-950 border border-slate-800 rounded-lg p-5 sticky top-6">
							<h2 className="text-lg font-semibold text-indigo-300 tracking-wide text-center">Adicionar Habilidade</h2>
							<form onSubmit={adicionarHabilidade} className="mt-4 space-y-3">
								<div>
									<label className="block text-sm text-slate-300 mb-1">Selecione uma habilidade</label>
									<input
										type="text"
										value={busca}
										onChange={(e) => setBusca(e.target.value)}
										placeholder="Digite para buscar por nome (ex.: python, power bi)"
										className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 mb-2"
									/>
									<select
										value={habilidadeParaAdicionar}
										onChange={(e) => setHabilidadeParaAdicionar(e.target.value)}
										disabled={loadingGlobais || loadingUsuario || opcoesDisponiveis.length === 0}
										className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
									>
										<option value="">{loadingGlobais || loadingUsuario ? 'Carregando…' : ((opcoesFiltradas.length || opcoesDisponiveis.length) ? 'Selecione…' : 'Sem opções disponíveis')}</option>
										{(busca ? opcoesFiltradas : opcoesDisponiveis).map(h => (
											<option key={h.id} value={h.id}>{h.nome}</option>
										))}
									</select>
									{busca && opcoesFiltradas.length === 0 && (
										<p className="text-[11px] text-slate-400 mt-1">Nenhuma habilidade encontrada para “{busca}”.</p>
									)}
								</div>
								{!!erroAdicionar && (
									<div className="p-2 rounded border border-red-600 bg-red-900 text-red-100 text-xs">{erroAdicionar}</div>
								)}
								<button
									type="submit"
									disabled={!habilidadeParaAdicionar || adicionando}
									className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-indigo-700 text-indigo-200 hover:bg-indigo-900/40"
								>
									{adicionando ? 'Adicionando…' : 'Adicionar'}
								</button>
							</form>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

