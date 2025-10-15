import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useState } from "react"; // estados e efeitos
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token
import lixeiraIcon from "../../../images/lixeira.png"; // ícone de lixeira para deletar
import setaIcon from "../../../images/seta.png"; // ícone de seta para expandir

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de administração de carreiras
export default function AdminCarreira() {

    // Estados principais
    const navigate = useNavigate(); // navegação de páginas (voltar)
    const [carreiras, setCarreiras] = useState([]); // lista de carreiras
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    // Painel lateral
    const [modoPainel, setModoPainel] = useState('nenhum');

    // Cadastrar Carreira
    const [novoNome, setNovoNome] = useState('');
    const [novaDescricao, setNovaDescricao] = useState('');
    const [criando, setCriando] = useState(false);
    const [mensagemCriar, setMensagemCriar] = useState('');
    const [erroCriar, setErroCriar] = useState('');

    // Atualizar Carreira
    const [atualizarId, setAtualizarId] = useState('');
    const [atualizarNome, setAtualizarNome] = useState('');
    const [atualizarDescricao, setAtualizarDescricao] = useState('');
    const [atualizando, setAtualizando] = useState(false);
    const [mensagemAtualizar, setMensagemAtualizar] = useState('');
    const [erroAtualizar, setErroAtualizar] = useState('');

    // Pop-up Exclusão de Carreira
    const [carreiraExcluir, setCarreiraExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    // Habilidades globais
    const [habilidades, setHabilidades] = useState([]);
    const [habilidadesErro, setHabilidadesErro] = useState("");
    const [habilidadesLoading, setHabilidadesLoading] = useState(true);

    // Habilidades por Carreira
    const [carreirasExpandidas, setCarreirasExpandidas] = useState([]);
    const [habilidadesCarreira, setHabilidadesCarreira] = useState({});

    // Remover Habilidade da Carreira
    const [removerCarreiraId, setRemoverCarreiraId] = useState("");
    const [removerHabilidadeId, setRemoverHabilidadeId] = useState("");
    const [removendoHabilidade, setRemovendoHabilidade] = useState(false);
    const [mensagemRemoverHabilidade, setMensagemRemoverHabilidade] = useState("");
    const [erroRemoverHabilidade, setErroRemoverHabilidade] = useState("");

    // Carrega lista de carreiras
    useEffect(() => {
        let ativo = true; // evitar atualização de estado após desmontar
        (async () => {
            try {
                const res = await authFetch(`${API_URL}/carreira/`); // chama backend
                if (!res.ok) throw new Error(`Falha ao listar carreiras (HTTP ${res.status})`);
                const data = await res.json(); // converte resposta em JSON
                if (ativo) setCarreiras(Array.isArray(data) ? data : []); // garante que é array
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

    // Carrega lista de habilidades
    useEffect(() => {
        let ativo = true; // evitar atualização de estado após desmontar
        (async () => {
            try {
                setHabilidadesLoading(true); // inicia carregamento
                const res = await authFetch(`${API_URL}/habilidade/`); // chama backend
                if (!res.ok) throw new Error(`Falha ao listar habilidades (HTTP ${res.status})`);
                const data = await res.json();  // converte resposta em JSON
                if (ativo) setHabilidades(Array.isArray(data) ? data : []); // garante que é array
            } catch (e) {
                if (ativo) setHabilidadesErro(e.message || "Erro ao carregar habilidades");
            } finally {
                if (ativo) setHabilidadesLoading(false);
            }
        })();
        return () => {
            ativo = false;
        };
    }, []);

    // Alterna expansão e carrega habilidades da carreira (cache)
    function alternarExpandirCarreira(id) {
        setCarreirasExpandidas(estadoAnterior => (estadoAnterior.includes(id) // verifica se já está expandida
            ? estadoAnterior.filter(item => item !== id) // recolhe
            : [...estadoAnterior, id])); // expande
        setHabilidadesCarreira(estadoAnterior => {
            if (estadoAnterior[id]) return estadoAnterior; // já carregado
            return { ...estadoAnterior, [id]: { items: [], loading: true, error: "" } }; // inicia carregamento
        });
        // carrega habilidades se ainda não carregadas
        if (!habilidadesCarreira[id]) {
            (async () => {
                try {
                    const res = await authFetch(`${API_URL}/carreira/${id}/habilidades`); // chama backend
                    const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
                    if (!res.ok)
                        throw new Error(
                            data?.detail || data?.message || `Falha ao carregar habilidades da carreira (HTTP ${res.status})`
                        );
                    // grava no cache as habilidades carregadas de uma carreira
                    setHabilidadesCarreira(estadoAnterior => ({ // garante estado mais recente
                        ...estadoAnterior, // mantém estados anteriores das outras carreiras no cache
                        [id]: { items: Array.isArray(data) ? data : [], loading: false, error: "" } // atualiza só a carreira específica
                    }));
                //  registra um erro ao carregar as habilidades de uma carreira específica sem afetar as demais
                } catch (e) {
                    setHabilidadesCarreira(estadoAnterior => ({ // garante estado mais recente
                        ...estadoAnterior, // mantém estados anteriores das outras carreiras no cache
                        [id]: { items: [], loading: false, error: e.message || "Erro ao carregar" } // atualiza só a carreira específica
                    }));
                }
            })();
        }
    }

    // Exclusão de carreira
    function solicitarExclusao(c){
        setErro(''); setMensagem('');
        setCarreiraExcluir({ id: c.id, nome: c.nome }); // abre modal de confirmação
    }

    // Confirma exclusão de carreira
    async function confirmarExclusao(){
        if(!carreiraExcluir) return; // evita exclusão quando não há carreira selecionada
        setExcluindo(true); setErro(''); setMensagem('');
        try {
            const res = await authFetch(`${API_URL}/carreira/deletar/${carreiraExcluir.id}`, { method: 'DELETE' }); // chama backend
            const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
            if(!res.ok){
                const msg = data?.detail || data?.message || `Falha ao excluir (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setCarreiras(estadoAnterior => estadoAnterior.filter(c => c.id !== carreiraExcluir.id)); // atualiza removendo do array a carreira que foi excluída
            setMensagem(data?.message || 'Carreira deletada com sucesso.');
            setCarreiraExcluir(null); // fecha modal
        } catch(e){
            setErro(e.message ?? 'Erro ao deletar carreira');
        } finally { setExcluindo(false); }
    }

    // Cancela exclusão de carreira
    function cancelarExclusao(){
        if(excluindo) return; // evita fechar modal durante exclusão
        setCarreiraExcluir(null);
    }

    // Cadastrar carreira
    async function cadastrarCarreira(e){
        e.preventDefault(); // evita reload da página
        setErroCriar(''); setMensagemCriar('');
        try {
            setCriando(true);
            const payload = { nome: novoNome.trim(), descricao: novaDescricao.trim() }; // monta o objeto que será enviado ao backend
            // chama backend
            const res = await authFetch(`${API_URL}/carreira/cadastro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) // converte para JSON
            });
            const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
            if(!res.ok){
                const msg = data?.detail || data?.message || `Falha ao cadastrar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemCriar(data?.message || 'Carreira cadastrada com sucesso');
            setCarreiras(estadoAnterior => [{ id: data?.id, nome: payload.nome, descricao: payload.descricao }, ...estadoAnterior]); // update na lista de carreiras inserindo a nova no topo
            setNovoNome(''); setNovaDescricao('');
        } catch(e){
            setErroCriar(e.message ?? 'Erro ao cadastrar carreira');
        } finally { setCriando(false); }
    }

    // Atualizar carreira (chamada ao selecionar carreira para atualizar)
    function aoSelecionarAtualizar(e){
        const id = e.target.value; // id da carreira selecionada
        setAtualizarId(id);
        setMensagemAtualizar(''); setErroAtualizar('');
        if(!id){ setAtualizarNome(''); setAtualizarDescricao(''); return; } // nenhuma carreira válida selecionada, ainda está no “Selecione…”
        const carreiraSel = carreiras.find(c => String(c.id) === id); // busca carreira selecionada
        // preenche campos de nome e descrição
        if(carreiraSel){
            setAtualizarNome(carreiraSel.nome || '');
            setAtualizarDescricao(carreiraSel.descricao || '');
        }
    }

    // Submete atualização de carreira
    async function aoSubmeterAtualizar(e){
        e.preventDefault();
        if(!atualizarId) return; // evita submissão quando não há carreira válida selecionada
        setErroAtualizar(''); setMensagemAtualizar('');
        try {
            setAtualizando(true);
            const payload = { nome: atualizarNome.trim(), descricao: atualizarDescricao.trim() }; // monta o objeto que será enviado ao backend
            // chama backend
            const res = await authFetch(`${API_URL}/carreira/atualizar/${atualizarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) // converte para JSON
            });
            const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
            if(!res.ok){
                const msg = data?.detail || data?.message || `Falha ao atualizar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemAtualizar(data?.message || 'Carreira atualizada com sucesso');
            setCarreiras(estadoAnterior => estadoAnterior.map(c => c.id === Number(atualizarId) ? { ...c, nome: payload.nome, descricao: payload.descricao } : c)); // atualiza a carreira na lista
        } catch(e){
            setErroAtualizar(e.message ?? 'Erro ao atualizar carreira');
        } finally { setAtualizando(false); }
    }

    // Obter o nome da habilidade pelo ID para exibição
    function obterNomeHabilidade(habilidadeId) {
        const habilidade = habilidades.find(h => Number(h.id) === Number(habilidadeId)); // busca habilidade pelo ID
        return habilidade?.nome || `Habilidade #${habilidadeId}`; // retorna nome ou ID se não encontrado
    }

    // Remover habilidade da carreira
    async function RemoverHabilidadeDaCarreira(e) {
        e.preventDefault(); // evita reload da página
        if (!removerCarreiraId || !removerHabilidadeId) return; // valida seleção
        setErroRemoverHabilidade(""); setMensagemRemoverHabilidade("");
        try {
            setRemovendoHabilidade(true);
            const res = await authFetch(
                `${API_URL}/carreira/${removerCarreiraId}/remover-habilidade/${removerHabilidadeId}`,
                { method: "DELETE" }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao remover (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemRemoverHabilidade("Habilidade removida da carreira");
            // Atualiza cache local da carreira removendo o item
            setHabilidadesCarreira(prev => {
                const entry = prev[removerCarreiraId];
                if (!entry) return prev;
                return {
                    ...prev,
                    [removerCarreiraId]: {
                        ...entry,
                        items: (entry.items || []).filter(rel => Number(rel.habilidade_id ?? rel.id) !== Number(removerHabilidadeId))
                    }
                };
            });
            setRemoverHabilidadeId("");
        } catch (e) {
            setErroRemoverHabilidade(e.message || "Erro ao remover habilidade da carreira");
        } finally {
            setRemovendoHabilidade(false);
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
                <Link to="/admin/carreira" className="text-lg font-medium underline decoration-slate-500 decoration-3 underline-offset-8 text-indigo-300 hover:text-indigo-200">
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
                <Link to="/admin/vaga" className="text-lg font-medium text-white hover:text-indigo-200">
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
                <h1 className="text-2xl font-semibold text-center mb-8">Gerenciar Carreiras</h1>

                {/* listagem à esquerda | painel à direita */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    <div className="flex-1 w-full">
                        {/* feedback */}
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

                        {/* lista de carreiras */}
                        {!carregando && !erro && (
                            carreiras.length === 0 ? (
                                <p className="text-slate-400">Nenhuma carreira cadastrada.</p>
                            ) : (
                                <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
                                    {carreiras.map((c) => (
                                        <li key={c.id ?? c.nome} className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {/* nome da carreira */}
                                                    <p className="font-medium">{c.nome ?? `Carreira #${c.id}`}</p>
                                                    {/* expandir habilidades */}
                                                    {c.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => alternarExpandirCarreira(c.id)}
                                                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 ml-1"
                                                            title="Ver habilidades"
                                                        >
                                                            <img
                                                                src={setaIcon}
                                                                alt={carreirasExpandidas.includes(c.id) ? "Recolher" : "Expandir"}
                                                                className={`w-4 h-4 transition-transform duration-200 ${carreirasExpandidas.includes(c.id) ? "rotate-180" : "rotate-0"}`}
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                                {/* excluir carreira */}
                                                {c.id && (
                                                    <button
                                                        onClick={() => solicitarExclusao(c)}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-700 text-red-200 hover:bg-red-900/40"
                                                        title="Excluir carreira"
                                                    >
                                                        <img src={lixeiraIcon} alt="Excluir" className="w-5 h-5" />
                                                        <span className="hidden sm:inline">Excluir</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* descrição da carreira */}
                                            {c.descricao && (
                                                <p className="text-sm text-slate-400 mt-1">{c.descricao}</p>
                                            )}

                                            {/* habilidades associadas */}
                                            {carreirasExpandidas.includes(c.id) && (
                                                <div className="mt-3 ml-4">
                                                    {habilidadesCarreira[c.id]?.loading ? (
                                                        <p className="text-xs text-slate-400">Carregando habilidades…</p>
                                                    ) : habilidadesCarreira[c.id]?.error ? (
                                                        <p className="text-xs text-red-400">{habilidadesCarreira[c.id].error}</p>
                                                    ) : (
                                                        <ul className="list-disc">
                                                            {habilidadesCarreira[c.id]?.items.length > 0 ? (
                                                                habilidadesCarreira[c.id].items.map(hab => (
                                                                    <li key={hab.id || hab.habilidade_id} className="text-sm text-slate-200 mb-1 flex items-center gap-2">
                                                                        <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                                                                        {hab.habilidade_nome || hab.nome || hab.nome_habilidade || hab.nomeHabilidade || (habilidades.find(h => Number(h.id) === Number(hab.habilidade_id ?? hab.id))?.nome) || '-'}
                                                                    </li>
                                                                ))
                                                            ) : (
                                                                <li className="text-xs text-slate-400">Nenhuma habilidade associada.</li>
                                                            )}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )
                        )}
                    </div>

                    {/* painel lateral */}
                    <div className="w-full lg:w-96 self-start">

                        {/* botão atualizar página */}
                        <button
                            onClick={() => window.location.reload()}
                            className="mb-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
                            title="Atualizar a página"
                        >
                            <span aria-hidden>↻</span> Atualizar
                        </button>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 sticky top-6">
                            <div className="flex flex-col gap-3">
                                {/* cadastrar nova carreira */}
                                <button
                                    onClick={() => { setModoPainel(modoPainel === 'criar' ? 'nenhum' : 'criar'); setMensagemCriar(''); setErroCriar(''); if(modoPainel!=='criar') setModoPainel('criar'); }}
                                    className={`px-3 py-2 rounded-md text-base font-medium border transition ${modoPainel === 'criar' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                                >
                                    Cadastrar Carreira
                                </button>
                                {/* Editar carreira */}
                                <button
                                    onClick={() => { setModoPainel(modoPainel === 'atualizar' ? 'nenhum' : 'atualizar'); setMensagemAtualizar(''); setErroAtualizar(''); if(modoPainel!=='atualizar') setModoPainel('atualizar'); }}
                                    className={`px-3 py-2 rounded-md text-base font-medium border transition ${modoPainel === 'atualizar' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                                >
                                    Editar Carreira
                                </button>

                                {/* separador */}
                                <div className="h-px bg-slate-800 my-2" />

                                {/* remover habilidade da carreira */}
                                <button
                                    onClick={() => { setModoPainel(modoPainel === 'removerHabilidade' ? 'nenhum' : 'removerHabilidade'); setErroRemoverHabilidade(''); setMensagemRemoverHabilidade(''); if(modoPainel!=='removerHabilidade') setModoPainel('removerHabilidade'); }}
                                    className={`px-3 py-2 rounded-md text-base font-medium border transition ${modoPainel === 'removerHabilidade' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                                >
                                    Remover Habilidade da Carreira
                                </button>
                            </div>

                            {/* formulário cadastro de carreira */}
                            {modoPainel === 'criar' && (
                                <form onSubmit={cadastrarCarreira} className="space-y-4">
                                    {/* título */}
                                    <h2 className="text-lg font-semibold text-indigo-300 tracking-wide mt-4 text-center">Nova Carreira</h2>
                                    {/* feedback */}
                                    {erroCriar && (
                                        <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroCriar}</div>
                                    )}
                                    {mensagemCriar && (
                                        <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemCriar}</div>
                                    )}
                                    {/* nome */}
                                    <div>
                                        <label className="block text-base mb-1">Nome</label>
                                        <input
                                            value={novoNome}
                                            onChange={e => setNovoNome(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    {/* descrição */}
                                    <div>
                                        <label className="block text-base mb-1">Descrição</label>
                                        <textarea
                                            value={novaDescricao}
                                            onChange={e => setNovaDescricao(e.target.value)}
                                            rows={3}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm resize-y"
                                        />
                                    </div>
                                    {/* botão cadastrar */}
                                    <button
                                        disabled={criando}
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-base font-medium"
                                    >
                                        {criando ? 'Salvando...' : 'Cadastrar'}
                                    </button>
                                </form>
                            )}

                            {/* formulário atualização de carreira */}
                            {modoPainel === 'atualizar' && (
                                <form onSubmit={aoSubmeterAtualizar} className="space-y-4">
                                    {/* título */}
                                    <h2 className="text-lg font-semibold text-indigo-300 tracking-wide mt-4 text-center">Editar Carreira</h2>
                                    {/* feedback */}
                                    {erroAtualizar && (
                                        <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroAtualizar}</div>
                                    )}
                                    {mensagemAtualizar && (
                                        <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemAtualizar}</div>
                                    )}
                                    {/* seleção de carreira */}
                                    <div>
                                        <label className="block text-base mb-1">Selecionar carreira</label>
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
                                    {/* nome */}
                                    <div>
                                        <label className="block text-base mb-1">Novo nome</label>
                                        <input
                                            value={atualizarNome}
                                            onChange={e => setAtualizarNome(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    {/* descrição */}
                                    <div>
                                        <label className="block text-base mb-1">Nova descrição</label>
                                        <textarea
                                            value={atualizarDescricao}
                                            onChange={e => setAtualizarDescricao(e.target.value)}
                                            rows={3}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm resize-y"
                                        />
                                    </div>
                                    {/* botão atualizar */}
                                    <button
                                        disabled={atualizando}
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-base font-medium"
                                    >
                                        {atualizando ? 'Atualizando...' : 'Salvar Alterações'}
                                    </button>
                                </form>
                            )}

                            {/* formulário remover habilidade da carreira */}
                            {modoPainel === 'removerHabilidade' && (
                                <form onSubmit={RemoverHabilidadeDaCarreira} className="space-y-4">
                                    {/* título */}
                                    <h2 className="text-lg font-semibold text-indigo-300 tracking-wide mt-4 text-center">Remover Habilidade da Carreira</h2>
                                    {/* feedback */}
                                    {erroRemoverHabilidade && (
                                        <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroRemoverHabilidade}</div>
                                    )}
                                    {mensagemRemoverHabilidade && (
                                        <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemRemoverHabilidade}</div>
                                    )}
                                    {/* seleção de carreira */}
                                    <div>
                                        <label className="block text-base mb-1">Carreira</label>
                                        <select
                                            value={removerCarreiraId}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setRemoverCarreiraId(val);
                                                setRemoverHabilidadeId("");
                                                if (val && !habilidadesCarreira[val]) {
                                                    alternarExpandirCarreira(Number(val));
                                                }
                                            }}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                            required
                                        >
                                            <option value="">Selecione…</option>
                                            {carreiras.map(c => (
                                                <option key={c.id} value={c.id}>{c.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* seleção de habilidade associada */}
                                    <div>
                                        <label className="block text-base mb-1">Habilidade Associada</label>
                                        {!removerCarreiraId ? (
                                            <p className="text-base text-slate-500">Selecione uma carreira primeiro.</p>
                                        ) : habilidadesCarreira[removerCarreiraId]?.loading ? (
                                            <p className="text-base text-slate-400">Carregando…</p>
                                        ) : habilidadesCarreira[removerCarreiraId]?.error ? (
                                            <p className="text-base text-red-400">{habilidadesCarreira[removerCarreiraId].error}</p>
                                        ) : (
                                            <select
                                                value={removerHabilidadeId}
                                                onChange={e => setRemoverHabilidadeId(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                                required
                                            >
                                                <option value="">Selecione…</option>
                                                {(habilidadesCarreira[removerCarreiraId]?.items || []).map(rel => (
                                                    <option key={rel.id || rel.habilidade_id} value={rel.habilidade_id ?? rel.id}>
                                                        {rel.habilidade_nome || rel.nome || obterNomeHabilidade(rel.habilidade_id ?? rel.id)}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    {/* botão enviar */}
                                    <button
                                        disabled={removendoHabilidade}
                                        type="submit"
                                        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded py-2 text-base font-medium"
                                    >
                                        {removendoHabilidade ? "Removendo..." : "Remover"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* confirmação de exclusão */}
                {carreiraExcluir && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-excluir-carreira-titulo"
                    >
                        {/* fundo escuro/blur */}
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={cancelarExclusao} />
                        
                        <div className="relative w-full max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-6">
                            {/* título */}
                            <h2 id="modal-excluir-carreira-titulo" className="text-lg font-semibold text-red-300 mb-3">Confirmar Exclusão</h2>
                            {/* mensagem de confirmação */}
                            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                                Tem certeza que deseja excluir a carreira <strong className="text-slate-100">{carreiraExcluir.nome}</strong>? Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex justify-end gap-3">
                                {/* botão cancelar */}
                                <button
                                    onClick={cancelarExclusao}
                                    disabled={excluindo}
                                    className="px-4 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-200 text-sm hover:bg-slate-700 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                {/* botão confirmar */}
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
