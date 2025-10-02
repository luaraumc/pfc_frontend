import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useState } from "react"; // estados e efeitos
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token
import trashIcon from "../../../images/lixeira.png"; // ícone de lixeira para deletar

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function AdminCarreira() {
    const navigate = useNavigate(); // navegação de páginas (voltar)
    const [carreiras, setCarreiras] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    // Painel lateral
    // Modo do painel lateral: 'nenhum' | 'criar' | 'atualizar'
    const [modoPainel, setModoPainel] = useState('nenhum');
    // Form criar
    const [novoNome, setNovoNome] = useState('');
    const [novaDescricao, setNovaDescricao] = useState('');
    const [criando, setCriando] = useState(false);
    const [mensagemCriar, setMensagemCriar] = useState('');
    const [erroCriar, setErroCriar] = useState('');
    // Form atualizar
    const [atualizarId, setAtualizarId] = useState('');
    const [atualizarNome, setAtualizarNome] = useState('');
    const [atualizarDescricao, setAtualizarDescricao] = useState('');
    const [atualizando, setAtualizando] = useState(false);
    const [mensagemAtualizar, setMensagemAtualizar] = useState('');
    const [erroAtualizar, setErroAtualizar] = useState('');
    const [carreiraExcluir, setCarreiraExcluir] = useState(null); // {id, nome}
    const [excluindo, setExcluindo] = useState(false);

    useEffect(() => {
        let ativo = true;
        (async () => {
            try {
                const res = await authFetch(`${API_URL}/carreira/`);
                if (!res.ok) throw new Error(`Falha ao listar carreiras (HTTP ${res.status})`);
                const data = await res.json();
                if (ativo) setCarreiras(Array.isArray(data) ? data : []);
            } catch (e) {
                if (ativo) setErro(e.message ?? "Erro ao listar carreiras");
            } finally {
                if (ativo) setCarregando(false);
            }
        })();
        return () => {
            ativo = false;
        };
    }, []);

    function solicitarExclusao(c){
        setErro(''); setMensagem('');
        setCarreiraExcluir({ id: c.id, nome: c.nome });
    }

    async function confirmarExclusao(){
        if(!carreiraExcluir) return;
        setExcluindo(true); setErro(''); setMensagem('');
        try {
            const res = await authFetch(`${API_URL}/carreira/deletar/${carreiraExcluir.id}`, { method: 'DELETE' });
            const data = await res.json().catch(()=> ({}));
            if(!res.ok){
                const msg = data?.detail || data?.message || `Falha ao excluir (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setCarreiras(prev => prev.filter(c => c.id !== carreiraExcluir.id));
            setMensagem(data?.message || 'Carreira deletada com sucesso.');
            setCarreiraExcluir(null);
        } catch(e){
            setErro(e.message ?? 'Erro ao deletar carreira');
        } finally { setExcluindo(false); }
    }

    function cancelarExclusao(){
        if(excluindo) return;
        setCarreiraExcluir(null);
    }

    async function aoSubmeterCriar(e){
        e.preventDefault();
        setErroCriar(''); setMensagemCriar('');
        try {
            setCriando(true);
            const payload = { nome: novoNome.trim(), descricao: novaDescricao.trim() };
            const res = await authFetch(`${API_URL}/carreira/cadastro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(()=> ({}));
            if(!res.ok){
                const msg = data?.detail || data?.message || `Falha ao cadastrar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemCriar(data?.message || 'Carreira cadastrada com sucesso');
            setCarreiras(prev => [{ id: data?.id ?? Math.random(), nome: payload.nome, descricao: payload.descricao }, ...prev]);
            setNovoNome(''); setNovaDescricao('');
        } catch(e){
            setErroCriar(e.message ?? 'Erro ao cadastrar carreira');
        } finally { setCriando(false); }
    }

    function aoSelecionarAtualizar(e){
        const id = e.target.value;
        setAtualizarId(id);
        setMensagemAtualizar(''); setErroAtualizar('');
        if(!id){ setAtualizarNome(''); setAtualizarDescricao(''); return; }
        const carreiraSel = carreiras.find(c => String(c.id) === id);
        if(carreiraSel){
            setAtualizarNome(carreiraSel.nome || '');
            setAtualizarDescricao(carreiraSel.descricao || '');
        }
    }

    async function aoSubmeterAtualizar(e){
        e.preventDefault();
        if(!atualizarId) return;
        setErroAtualizar(''); setMensagemAtualizar('');
        try {
            setAtualizando(true);
            const payload = { nome: atualizarNome.trim(), descricao: atualizarDescricao.trim() };
            const res = await authFetch(`${API_URL}/carreira/atualizar/${atualizarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(()=> ({}));
            if(!res.ok){
                const msg = data?.detail || data?.message || `Falha ao atualizar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemAtualizar(data?.message || 'Carreira atualizada com sucesso');
            setCarreiras(prev => prev.map(c => c.id === Number(atualizarId) ? { ...c, nome: payload.nome, descricao: payload.descricao } : c));
        } catch(e){
            setErroAtualizar(e.message ?? 'Erro ao atualizar carreira');
        } finally { setAtualizando(false); }
    }

    // HTML
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
                <h1 className="text-2xl font-semibold text-center mb-8">Gerenciar Carreiras</h1>
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Listagem */}
                    <div className="flex-1 w-full">
                        {carregando && (
                            <p className="text-slate-400">Carregando carreiras…</p>
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
                            carreiras.length === 0 ? (
                                <p className="text-slate-400">Nenhuma carreira cadastrada.</p>
                            ) : (
                                <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
                                    {carreiras.map((c) => (
                                        <li key={c.id ?? c.nome} className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{c.nome ?? `Carreira #${c.id}`}</p>
                                                {c.descricao && (
                                                    <p className="text-sm text-slate-400">{c.descricao}</p>
                                                )}
                                            </div>
                                            {c.id && (
                                                <button
                                                    onClick={() => solicitarExclusao(c)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-700 text-red-200 hover:bg-red-900/40"
                                                    title="Excluir carreira"
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
                                onClick={() => { setModoPainel(modoPainel === 'criar' ? 'nenhum' : 'criar'); setMensagemCriar(''); setErroCriar(''); }}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainel === 'criar' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                            >
                                Cadastrar Nova Carreira
                            </button>
                            <button
                                onClick={() => { setModoPainel(modoPainel === 'atualizar' ? 'nenhum' : 'atualizar'); setMensagemAtualizar(''); setErroAtualizar(''); }}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainel === 'atualizar' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                            >
                                Atualizar Carreira
                            </button>
                        </div>
                        {modoPainel === 'nenhum' && (
                            <p className="text-sm text-slate-400">Selecione uma ação para começar.</p>
                        )}
                        {modoPainel === 'criar' && (
                            <form onSubmit={aoSubmeterCriar} className="space-y-4">
                                <h2 className="text-sm font-semibold text-indigo-300 tracking-wide">Nova Carreira</h2>
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
                                <div>
                                    <label className="block text-xs mb-1">Descrição</label>
                                    <textarea
                                        value={novaDescricao}
                                        onChange={e => setNovaDescricao(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm resize-y"
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
                        {modoPainel === 'atualizar' && (
                            <form onSubmit={aoSubmeterAtualizar} className="space-y-4">
                                <h2 className="text-sm font-semibold text-indigo-300 tracking-wide">Atualizar Carreira</h2>
                                {erroAtualizar && (
                                    <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroAtualizar}</div>
                                )}
                                {mensagemAtualizar && (
                                    <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemAtualizar}</div>
                                )}
                                <div>
                                    <label className="block text-xs mb-1">Selecionar carreira</label>
                                    <select
                                        value={atualizarId}
                                        onChange={aoSelecionarAtualizar}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                        required
                                    >
                                        <option value="">Selecione…</option>
                                        {carreiras.map(c => (
                                            <option key={c.id} value={c.id}>{c.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs mb-1">Nome</label>
                                    <input
                                        value={atualizarNome}
                                        onChange={e => setAtualizarNome(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1">Descrição</label>
                                    <textarea
                                        value={atualizarDescricao}
                                        onChange={e => setAtualizarDescricao(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm resize-y"
                                    />
                                </div>
                                <button
                                    disabled={atualizando}
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
                                >
                                    {atualizando ? 'Atualizando...' : 'Salvar Alterações'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
                {carreiraExcluir && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-excluir-carreira-titulo"
                    >
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={cancelarExclusao} />
                        <div className="relative w-full max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-6">
                            <h2 id="modal-excluir-carreira-titulo" className="text-lg font-semibold text-red-300 mb-3">Confirmar Exclusão</h2>
                            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                                Tem certeza que deseja excluir a carreira <strong className="text-slate-100">{carreiraExcluir.nome}</strong>? Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={cancelarExclusao}
                                    disabled={excluindo}
                                    className="px-4 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-200 text-sm hover:bg-slate-700 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmarExclusao}
                                    disabled={excluindo}
                                    className="px-4 py-2 rounded-md border border-red-700 bg-red-600/90 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
                                >
                                    {excluindo ? 'Excluindo...' : 'Excluir'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
