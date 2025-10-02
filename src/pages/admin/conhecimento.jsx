import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useState } from "react"; // estados e efeitos
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token
import trashIcon from "../../../images/lixeira.png"; // ícone de lixeira para deletar

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function AdminConhecimento() {
	const navigate = useNavigate();
	const [conhecimentos, setConhecimentos] = useState([]);
	const [carregando, setCarregando] = useState(true);
	const [erro, setErro] = useState("");
	const [mensagem, setMensagem] = useState("");

	// Painel lateral
	const [modoPainel, setModoPainel] = useState('nenhum'); // nenhum | criar | deletar
	// Criar
	const [novoNome, setNovoNome] = useState('');
	const [erroCriar, setErroCriar] = useState('');
	const [mensagemCriar, setMensagemCriar] = useState('');
	const [criando, setCriando] = useState(false);
	// Deletar
	const [deletarId, setDeletarId] = useState('');
	const [erroDeletar, setErroDeletar] = useState('');
	const [mensagemDeletar, setMensagemDeletar] = useState('');
	const [deletando, setDeletando] = useState(false);

	useEffect(() => {
		let ativo = true;
		(async () => {
			try {
				const res = await authFetch(`${API_URL}/conhecimento/`);
				if (!res.ok) throw new Error(`Falha ao listar conhecimentos (HTTP ${res.status})`);
				const data = await res.json();
				if (ativo) setConhecimentos(Array.isArray(data) ? data : []);
			} catch (e) {
				if (ativo) setErro(e.message || 'Erro ao listar conhecimentos');
			} finally {
				if (ativo) setCarregando(false);
			}
		})();
		return () => { ativo = false; };
	}, []);

	async function aoSubmeterCriar(e) {
		e.preventDefault();
		setErroCriar('');	setMensagemCriar('');
		try {
			setCriando(true);
			const payload = { nome: novoNome.trim() };
			if (!payload.nome) throw new Error('Informe um nome');
			const res = await authFetch(`${API_URL}/conhecimento/cadastro`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha ao cadastrar (HTTP ${res.status})`;
				throw new Error(msg);
			}
			setMensagemCriar(data?.message || 'Conhecimento cadastrado com sucesso');
			// Atualizar lista (não temos id retornado, manter nome)
			setConhecimentos(prev => [{ id: data?.id ?? Math.random(), nome: payload.nome }, ...prev]);
			setNovoNome('');
		} catch (e) {
			setErroCriar(e.message || 'Erro ao cadastrar');
		} finally {
			setCriando(false);
		}
	}

	async function aoSubmeterDeletar(e) {
		e.preventDefault();
		if (!deletarId) return;
		setErroDeletar('');	setMensagemDeletar('');
		try {
			setDeletando(true);
			const res = await authFetch(`${API_URL}/conhecimento/deletar/${deletarId}`, { method: 'DELETE' });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = data?.detail || data?.message || `Falha ao deletar (HTTP ${res.status})`;
				throw new Error(msg);
			}
			setMensagemDeletar(data?.message || 'Conhecimento deletado com sucesso');
			setConhecimentos(prev => prev.filter(c => c.id !== Number(deletarId)));
			setDeletarId('');
		} catch (e) {
			setErroDeletar(e.message || 'Erro ao deletar');
		} finally {
			setDeletando(false);
		}
	}

	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">
			<header className="w-full border-b border-slate-800 bg-slate-950/80">
				<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
					<Link to="/" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
						PFC - Admin
					</Link>
					<button
						onClick={logoutRedirecionar}
						className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
					>
						Sair
					</button>
				</div>
			</header>
			<main className="ml-8 mr-8 mx-auto px-4 py-10">
				<button
					onClick={() => navigate(-1)}
					className="mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
				>
					<span aria-hidden>←</span> Voltar
				</button>
				<h1 className="text-2xl font-semibold text-center mb-8">Gerenciar Conhecimentos</h1>
				<div className="flex flex-col lg:flex-row gap-8 items-start">
					{/* Listagem */}
					<div className="flex-1 w-full">
						{carregando && (
							<p className="text-slate-400">Carregando conhecimentos…</p>
						)}
						{!!mensagem && !carregando && (
							<div className="mb-3 p-3 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">
								{mensagem}
							</div>
						)}
						{!!erro && !carregando && (
							<div className="p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">
								{erro}
							</div>
						)}
						{!carregando && !erro && (
							conhecimentos.length === 0 ? (
								<p className="text-slate-400">Nenhum conhecimento cadastrado.</p>
							) : (
								<ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
									{conhecimentos.map(c => (
										<li key={c.id ?? c.nome} className="p-4 flex items-center justify-between">
											<div>
												<p className="font-medium">{c.nome ?? `Conhecimento #${c.id}`}</p>
											</div>
											{/* Ícone delete direto opcional */}
											{c.id && (
												<button
													onClick={() => { setDeletarId(String(c.id)); setModoPainel('deletar'); setErroDeletar(''); setMensagemDeletar(''); }}
													className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-700 text-red-200 hover:bg-red-900/40"
													title="Marcar para deletar"
												>
													<img src={trashIcon} alt="Excluir" className="w-5 h-5" />
													<span className="hidden sm:inline">Excluir</span>
												</button>
											)}
										</li>
									))}
								</ul>
							)
						)}
					</div>
					{/* Painel lateral */}
					<div className="w-full lg:w-96 bg-slate-950 border border-slate-800 rounded-lg p-5 sticky top-6 self-start">
						<div className="flex flex-col gap-3 mb-6">
							<button
								onClick={() => { setModoPainel(modoPainel === 'criar' ? 'nenhum' : 'criar'); setErroCriar(''); setMensagemCriar(''); }}
								className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainel === 'criar' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
							>
								Cadastrar Conhecimento
							</button>
							<button
								onClick={() => { setModoPainel(modoPainel === 'deletar' ? 'nenhum' : 'deletar'); setErroDeletar(''); setMensagemDeletar(''); }}
								className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainel === 'deletar' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
							>
								Deletar Conhecimento
							</button>
						</div>
						{modoPainel === 'nenhum' && (
							<p className="text-sm text-slate-400">Selecione uma ação para começar.</p>
						)}
						{modoPainel === 'criar' && (
							<form onSubmit={aoSubmeterCriar} className="space-y-4">
								<h2 className="text-sm font-semibold text-indigo-300 tracking-wide">Novo Conhecimento</h2>
								{erroCriar && (
									<div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroCriar}</div>
								)}
								{mensagemCriar && (
									<div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemCriar}</div>
								)}
								<div>
									<label className="block text-xs mb-1">Nome</label>
									<input
										value={novoNome}
										onChange={e => setNovoNome(e.target.value)}
										className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
										required
									/>
								</div>
								<button
									disabled={criando}
									type="submit"
									className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
								>
									{criando ? 'Salvando...' : 'Cadastrar'}
								</button>
							</form>
						)}
						{modoPainel === 'deletar' && (
							<form onSubmit={aoSubmeterDeletar} className="space-y-4">
								<h2 className="text-sm font-semibold text-indigo-300 tracking-wide">Deletar Conhecimento</h2>
								{erroDeletar && (
									<div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroDeletar}</div>
								)}
								{mensagemDeletar && (
									<div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemDeletar}</div>
								)}
								<div>
									<label className="block text-xs mb-1">Selecionar conhecimento</label>
									<select
										value={deletarId}
										onChange={e => { setDeletarId(e.target.value); }}
										className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
										required
									>
										<option value="">Selecione…</option>
										{conhecimentos.map(c => (
											<option key={c.id} value={c.id}>{c.nome}</option>
										))}
									</select>
								</div>
								<button
									disabled={deletando}
									type="submit"
									className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
								>
									{deletando ? 'Deletando...' : 'Excluir'}
								</button>
							</form>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

