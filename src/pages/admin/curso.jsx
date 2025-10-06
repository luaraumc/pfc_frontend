import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useState } from "react"; // estados e efeitos
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token
import trashIcon from "../../../images/lixeira.png"; // ícone de lixeira para deletar
import setaIcon from "../../../images/seta.png"; // ícone de seta para expandir

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de administração de cursos
export default function AdminCurso() {
    const navigate = useNavigate(); // navegação de páginas (voltar)

    // Estado principal
    const [cursos, setCursos] = useState([]); // lista de cursos
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [modoPainel, setModoPainel] = useState("nenhum"); // 'nenhum' | 'criar' | 'atualizar' | 'adicionarConhecimento' | 'removerConhecimento' | 'cadastrarConhecimento' | 'deletarConhecimento'
    // Formulário de conhecimento
    const [novoConhecimento, setNovoConhecimento] = useState("");
    const [criandoConhecimento, setCriandoConhecimento] = useState(false);
    const [mensagemConhecimento, setMensagemConhecimento] = useState("");
    const [erroConhecimento, setErroConhecimento] = useState("");
    const [deletarConhecimentoId, setDeletarConhecimentoId] = useState("");
    const [deletandoConhecimento, setDeletandoConhecimento] = useState(false);
    const [mensagemDeletarConhecimento, setMensagemDeletarConhecimento] = useState("");
    const [erroDeletarConhecimento, setErroDeletarConhecimento] = useState("");
    async function aoSubmeterCadastrarConhecimento(e) {
        e.preventDefault();
        setErroConhecimento(""); setMensagemConhecimento("");
        try {
            setCriandoConhecimento(true);
            const payload = { nome: novoConhecimento.trim() };
            const res = await authFetch(`${API_URL}/conhecimento/cadastro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao cadastrar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemConhecimento(data?.message || "Conhecimento cadastrado com sucesso");
            // Usar o ID real retornado pela API e atualizar a lista imediatamente
            if (data?.id) {
                const novoConhecimentoObj = { id: data.id, nome: payload.nome };
                setConhecimentos(prev => [novoConhecimentoObj, ...prev]);
            }
            setNovoConhecimento("");
        } catch (e) {
            setErroConhecimento(e.message ?? "Erro ao cadastrar conhecimento");
        } finally { setCriandoConhecimento(false); }
    }

    async function aoSubmeterDeletarConhecimento(e) {
        e.preventDefault();
        setErroDeletarConhecimento(""); setMensagemDeletarConhecimento("");
        if (!deletarConhecimentoId) return;
        try {
            setDeletandoConhecimento(true);
            const res = await authFetch(`${API_URL}/conhecimento/deletar/${deletarConhecimentoId}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao deletar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemDeletarConhecimento(data?.message || "Conhecimento deletado com sucesso");
            setConhecimentos(prev => prev.filter(k => String(k.id) !== String(deletarConhecimentoId)));
            setDeletarConhecimentoId("");
        } catch (e) {
            setErroDeletarConhecimento(e.message ?? "Erro ao deletar conhecimento");
        } finally { setDeletandoConhecimento(false); }
    }

    // Form criar
    const [novoNome, setNovoNome] = useState("");
    const [novaDescricao, setNovaDescricao] = useState("");
    const [criando, setCriando] = useState(false);
    const [mensagemCriar, setMensagemCriar] = useState("");
    const [erroCriar, setErroCriar] = useState("");

    // Form atualizar
    const [atualizarId, setAtualizarId] = useState("");
    const [atualizarNome, setAtualizarNome] = useState("");
    const [atualizarDescricao, setAtualizarDescricao] = useState("");
    const [atualizando, setAtualizando] = useState(false);
    const [mensagemAtualizar, setMensagemAtualizar] = useState("");
    const [erroAtualizar, setErroAtualizar] = useState("");

    // Pop-up exclusão
    const [cursoExcluir, setCursoExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    // Conhecimentos globais
    const [conhecimentos, setConhecimentos] = useState([]);
    const [conhecimentosErro, setConhecimentosErro] = useState("");
    const [conhecimentosLoading, setConhecimentosLoading] = useState(true);

    // Conhecimentos por curso (expansão)
    const [cursosExpandidos, setCursosExpandidos] = useState([]); // ids abertos
    const [conhecimentosCurso, setConhecimentosCurso] = useState({}); // { [id]: { items: [], loading: bool, error: '' } }

    // Form adicionar conhecimento
    const [adicionarCursoId, setAdicionarCursoId] = useState("");
    const [adicionarConhecimentoId, setAdicionarConhecimentoId] = useState("");
    const [adicionandoConhecimento, setAdicionandoConhecimento] = useState(false);
    const [mensagemAdicionarConhecimento, setMensagemAdicionarConhecimento] = useState("");
    const [erroAdicionarConhecimento, setErroAdicionarConhecimento] = useState("");

    // Form remover conhecimento
    const [removerCursoId, setRemoverCursoId] = useState("");
    const [removerConhecimentoId, setRemoverConhecimentoId] = useState("");
    const [removendoConhecimento, setRemovendoConhecimento] = useState(false);
    const [mensagemRemoverConhecimento, setMensagemRemoverConhecimento] = useState("");
    const [erroRemoverConhecimento, setErroRemoverConhecimento] = useState("");

    // Carrega lista de cursos
    useEffect(() => {
        let ativo = true;
        (async () => {
            try {
                const res = await authFetch(`${API_URL}/curso/`);
                if (!res.ok) throw new Error(`Falha ao listar cursos (HTTP ${res.status})`);
                const data = await res.json();
                if (ativo) setCursos(Array.isArray(data) ? data : []);
            } catch (e) {
                if (ativo) setErro(e.message ?? "Erro ao listar cursos");
            } finally {
                if (ativo) setCarregando(false);
            }
        })();
        return () => {
            ativo = false;
        };
    }, []);

    // Carrega lista de conhecimentos globais
    useEffect(() => {
        let ativo = true;
        (async () => {
            try {
                setConhecimentosLoading(true);
                const res = await authFetch(`${API_URL}/conhecimento/`);
                if (!res.ok) throw new Error(`Falha ao listar conhecimentos (HTTP ${res.status})`);
                const data = await res.json();
                if (ativo) setConhecimentos(Array.isArray(data) ? data : []);
            } catch (e) {
                if (ativo) setConhecimentosErro(e.message || "Erro ao carregar conhecimentos");
            } finally {
                if (ativo) setConhecimentosLoading(false);
            }
        })();
        return () => {
            ativo = false;
        };
    }, []);

    // Alterna expansão e carrega conhecimentos do curso (cache)
    function alternarExpandirCurso(id) {
        setCursosExpandidos(prev => (prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]));
        setConhecimentosCurso(prev => {
            if (prev[id]) return prev;
            return { ...prev, [id]: { items: [], loading: true, error: "" } };
        });
        if (!conhecimentosCurso[id]) {
            (async () => {
                try {
                    const res = await authFetch(`${API_URL}/curso/${id}/conhecimentos`);
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok)
                        throw new Error(
                            data?.detail || data?.message || `Falha ao carregar conhecimentos do curso (HTTP ${res.status})`
                        );
                    setConhecimentosCurso(prev => ({
                        ...prev,
                        [id]: { items: Array.isArray(data) ? data : [], loading: false, error: "" }
                    }));
                } catch (e) {
                    setConhecimentosCurso(prev => ({
                        ...prev,
                        [id]: { items: [], loading: false, error: e.message || "Erro ao carregar" }
                    }));
                }
            })();
        }
    }

    function obterNomeConhecimento(conhecimentoId) {
        const k = conhecimentos.find(k => Number(k.id) === Number(conhecimentoId));
        return k?.nome || `Conhecimento #${conhecimentoId}`;
    }

    function solicitarExclusao(c) {
        setErro("");
        setMensagem("");
        setCursoExcluir({ id: c.id, nome: c.nome });
    }

    async function confirmarExclusao() {
        if (!cursoExcluir) return;
        setExcluindo(true);
        setErro("");
        setMensagem("");
        try {
            const res = await authFetch(`${API_URL}/curso/deletar/${cursoExcluir.id}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao excluir (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setCursos(prev => prev.filter(c => c.id !== cursoExcluir.id));
            setMensagem(data?.message || "Curso deletado com sucesso.");
            setCursoExcluir(null);
        } catch (e) {
            setErro(e.message ?? "Erro ao deletar curso");
        } finally {
            setExcluindo(false);
        }
    }

    function cancelarExclusao() {
        if (excluindo) return;
        setCursoExcluir(null);
    }

    async function aoSubmeterCriar(e) {
        e.preventDefault();
        setErroCriar("");
        setMensagemCriar("");
        try {
            setCriando(true);
            const payload = { nome: novoNome.trim(), descricao: novaDescricao.trim() };
            const res = await authFetch(`${API_URL}/curso/cadastro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao cadastrar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemCriar(data?.message || "Curso cadastrado com sucesso");
            // Usar o ID real retornado pela API
            if (data?.id) {
                setCursos(prev => [{ id: data.id, nome: payload.nome, descricao: payload.descricao }, ...prev]);
            }
            setNovoNome("");
            setNovaDescricao("");
        } catch (e) {
            setErroCriar(e.message ?? "Erro ao cadastrar curso");
        } finally {
            setCriando(false);
        }
    }

    function aoSelecionarAtualizar(e) {
        const id = e.target.value;
        setAtualizarId(id);
        setMensagemAtualizar("");
        setErroAtualizar("");
        if (!id) {
            setAtualizarNome("");
            setAtualizarDescricao("");
            return;
        }
        const curso = cursos.find(c => String(c.id) === id);
        if (curso) {
            setAtualizarNome(curso.nome || "");
            setAtualizarDescricao(curso.descricao || "");
        }
    }

    async function aoSubmeterAtualizar(e) {
        e.preventDefault();
        if (!atualizarId) return;
        setErroAtualizar("");
        setMensagemAtualizar("");
        try {
            setAtualizando(true);
            const payload = { nome: atualizarNome.trim(), descricao: atualizarDescricao.trim() };
            const res = await authFetch(`${API_URL}/curso/atualizar/${atualizarId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao atualizar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemAtualizar(data?.message || "Curso atualizado com sucesso");
            setCursos(prev => prev.map(c => (c.id === Number(atualizarId) ? { ...c, nome: payload.nome, descricao: payload.descricao } : c)));
        } catch (e) {
            setErroAtualizar(e.message ?? "Erro ao atualizar curso");
        } finally {
            setAtualizando(false);
        }
    }

    async function aoSubmeterAdicionarConhecimento(e) {
        e.preventDefault();
        if (!adicionarCursoId || !adicionarConhecimentoId) return;
        setErroAdicionarConhecimento("");
        setMensagemAdicionarConhecimento("");
        try {
            setAdicionandoConhecimento(true);
            const res = await authFetch(
                `${API_URL}/curso/${adicionarCursoId}/adicionar-conhecimento/${adicionarConhecimentoId}`,
                { method: "POST" }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao adicionar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemAdicionarConhecimento("Conhecimento adicionado ao curso");
            setConhecimentosCurso(prev => {
                const entry = prev[adicionarCursoId];
                if (!entry) return prev;
                return { ...prev, [adicionarCursoId]: { ...entry, items: [...entry.items, data], loading: false } };
            });
            setAdicionarConhecimentoId("");
        } catch (e) {
            setErroAdicionarConhecimento(e.message || "Erro ao adicionar");
        } finally {
            setAdicionandoConhecimento(false);
        }
    }

    async function aoSubmeterRemoverConhecimento(e) {
        e.preventDefault();
        if (!removerCursoId || !removerConhecimentoId) return;
        setErroRemoverConhecimento("");
        setMensagemRemoverConhecimento("");
        try {
            setRemovendoConhecimento(true);
            const res = await authFetch(
                `${API_URL}/curso/${removerCursoId}/remover-conhecimento/${removerConhecimentoId}`,
                { method: "DELETE" }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao remover (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemRemoverConhecimento("Conhecimento removido do curso");
            setConhecimentosCurso(prev => {
                const entry = prev[removerCursoId];
                if (!entry) return prev;
                return {
                    ...prev,
                    [removerCursoId]: {
                        ...entry,
                        items: entry.items.filter(it => Number(it.conhecimento_id) !== Number(removerConhecimentoId))
                    }
                };
            });
            setRemoverConhecimentoId("");
        } catch (e) {
            setErroRemoverConhecimento(e.message || "Erro ao remover");
        } finally {
            setRemovendoConhecimento(false);
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

                <h1 className="text-2xl font-semibold text-center mb-8">Gerenciar Cursos</h1>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Listagem */}
                    <div className="flex-1 w-full">
                        {carregando && <p className="text-slate-400">Carregando cursos…</p>}

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
                            cursos.length === 0 ? (
                                <p className="text-slate-400">Nenhum curso cadastrado.</p>
                            ) : (
                                <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
                                    {cursos.map(c => (
                                        <li key={c.id ?? c.nome} className="p-4 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-medium">{c.nome ?? `Curso #${c.id}`}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => alternarExpandirCurso(c.id)}
                                                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800"
                                                        title="Ver conhecimentos"
                                                    >
                                                        <img
                                                            src={setaIcon}
                                                            alt={cursosExpandidos.includes(c.id) ? "Recolher" : "Expandir"}
                                                            className={`w-4 h-4 transition-transform duration-200 ${
                                                                cursosExpandidos.includes(c.id) ? "rotate-180" : "rotate-0"
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                                {c.descricao && <p className="text-sm text-slate-400">{c.descricao}</p>}
                                                {cursosExpandidos.includes(c.id) && (
                                                    <div className="mt-3 ml-4">
                                                        {conhecimentosCurso[c.id]?.loading ? (
                                                            <p className="text-xs text-slate-400">Carregando conhecimentos…</p>
                                                        ) : conhecimentosCurso[c.id]?.error ? (
                                                            <p className="text-xs text-red-400">{conhecimentosCurso[c.id].error}</p>
                                                        ) : (
                                                            <ul className="list-disc pl-5">
                                                                {conhecimentosCurso[c.id]?.items?.length ? (
                                                                    conhecimentosCurso[c.id].items.map(rel => (
                                                                        <li key={rel.id || rel.conhecimento_id} className="text-sm text-slate-200 mb-1 flex items-center gap-2">
                                                                            <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                                                                            {rel.conhecimento_nome || obterNomeConhecimento(rel.conhecimento_id)}
                                                                        </li>
                                                                    ))
                                                                ) : (
                                                                    <li className="text-xs text-slate-400">Nenhum conhecimento associado.</li>
                                                                )}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {c.id && (
                                                <button
                                                    onClick={() => solicitarExclusao(c)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-700 text-red-200 hover:bg-red-900/40"
                                                    title="Excluir curso"
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
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setModoPainel(modoPainel === "criar" ? "nenhum" : "criar");
                                    setMensagemCriar("");
                                    setErroCriar("");
                                }}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition ${
                                    modoPainel === "criar"
                                        ? "bg-indigo-600 border-indigo-500 text-white"
                                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                }`}
                            >
                                Cadastrar Novo Curso
                            </button>
                            <button
                                onClick={() => {
                                    setModoPainel(modoPainel === "atualizar" ? "nenhum" : "atualizar");
                                    setMensagemAtualizar("");
                                    setErroAtualizar("");
                                }}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition ${
                                    modoPainel === "atualizar"
                                        ? "bg-indigo-600 border-indigo-500 text-white"
                                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                }`}
                            >
                                Atualizar Curso
                            </button>
                            <button
                                onClick={() => { setModoPainel(modoPainel === "cadastrarConhecimento" ? "nenhum" : "cadastrarConhecimento"); setMensagemConhecimento(""); setErroConhecimento(""); }}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainel === "cadastrarConhecimento" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
                            >
                                Cadastrar Conhecimento
                            </button>
                            <button
                                onClick={() => { setModoPainel(modoPainel === "deletarConhecimento" ? "nenhum" : "deletarConhecimento"); setMensagemDeletarConhecimento(""); setErroDeletarConhecimento(""); }}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainel === "deletarConhecimento" ? "bg-red-600 border-red-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
                            >
                                Deletar Conhecimento
                            </button>
                            <button
                                onClick={() => {
                                    setModoPainel(
                                        modoPainel === "adicionarConhecimento" ? "nenhum" : "adicionarConhecimento"
                                    );
                                    setErroAdicionarConhecimento("");
                                    setMensagemAdicionarConhecimento("");
                                }}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition ${
                                    modoPainel === "adicionarConhecimento"
                                        ? "bg-indigo-600 border-indigo-500 text-white"
                                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                }`}
                            >
                                Adicionar conhecimento ao curso
                            </button>
                            <button
                                onClick={() => {
                                    setModoPainel(
                                        modoPainel === "removerConhecimento" ? "nenhum" : "removerConhecimento"
                                    );
                                    setErroRemoverConhecimento("");
                                    setMensagemRemoverConhecimento("");
                                }}
                                className={`px-3 py-2 rounded-md text-sm font-medium border transition ${
                                    modoPainel === "removerConhecimento"
                                        ? "bg-indigo-600 border-indigo-500 text-white"
                                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                }`}
                            >
                                Remover conhecimento do curso
                            </button>
                        {modoPainel === "cadastrarConhecimento" && (
                            <form onSubmit={aoSubmeterCadastrarConhecimento} className="space-y-4">
                                <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Cadastrar Conhecimento</h2>
                                {erroConhecimento && (
                                    <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroConhecimento}</div>
                                )}
                                {mensagemConhecimento && (
                                    <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemConhecimento}</div>
                                )}
                                <div>
                                    <label className="block text-xs mb-1">Nome</label>
                                    <input
                                        value={novoConhecimento}
                                        onChange={e => setNovoConhecimento(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                        required
                                    />
                                </div>
                                <button
                                    disabled={criandoConhecimento}
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
                                >
                                    {criandoConhecimento ? "Salvando..." : "Cadastrar"}
                                </button>
                            </form>
                        )}
                        {modoPainel === "deletarConhecimento" && (
                            <form onSubmit={aoSubmeterDeletarConhecimento} className="space-y-4">
                                <h2 className="text-sm font-semibold text-red-300 tracking-wide mt-4">Deletar Conhecimento</h2>
                                {erroDeletarConhecimento && (
                                    <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroDeletarConhecimento}</div>
                                )}
                                {mensagemDeletarConhecimento && (
                                    <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemDeletarConhecimento}</div>
                                )}
                                <div>
                                    <label className="block text-xs mb-1">Conhecimento</label>
                                    <select
                                        value={deletarConhecimentoId}
                                        onChange={e => setDeletarConhecimentoId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                        required
                                    >
                                        <option value="">Selecione…</option>
                                        {conhecimentos.map(k => (
                                            <option key={k.id} value={k.id}>{k.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    disabled={deletandoConhecimento}
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
                                >
                                    {deletandoConhecimento ? "Deletando..." : "Deletar"}
                                </button>
                            </form>
                        )}
                        </div>
                        {modoPainel === "criar" && (
                            <form onSubmit={aoSubmeterCriar} className="space-y-4">
                                <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Novo Curso</h2>
                                {erroCriar && (
                                    <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">
                                        {erroCriar}
                                    </div>
                                )}
                                {mensagemCriar && (
                                    <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">
                                        {mensagemCriar}
                                    </div>
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
                                        required
                                    />
                                </div>
                                <button
                                    disabled={criando}
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
                                >
                                    {criando ? "Salvando..." : "Cadastrar"}
                                </button>
                            </form>
                        )}

                        {modoPainel === "atualizar" && (
                            <form onSubmit={aoSubmeterAtualizar} className="space-y-4">
                                <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Atualizar Curso</h2>
                                {erroAtualizar && (
                                    <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">
                                        {erroAtualizar}
                                    </div>
                                )}
                                {mensagemAtualizar && (
                                    <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">
                                        {mensagemAtualizar}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs mb-1">Selecionar curso</label>
                                    <select
                                        value={atualizarId}
                                        onChange={aoSelecionarAtualizar}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                        required
                                    >
                                        <option value="">Selecione…</option>
                                        {cursos.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nome}
                                            </option>
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
                                        required
                                    />
                                </div>
                                <button
                                    disabled={atualizando}
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
                                >
                                    {atualizando ? "Atualizando..." : "Salvar Alterações"}
                                </button>
                            </form>
                        )}

                        {modoPainel === "adicionarConhecimento" && (
                            <form onSubmit={aoSubmeterAdicionarConhecimento} className="space-y-4">
                                <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Adicionar Conhecimento</h2>
                                {erroAdicionarConhecimento && (
                                    <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">
                                        {erroAdicionarConhecimento}
                                    </div>
                                )}
                                {mensagemAdicionarConhecimento && (
                                    <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">
                                        {mensagemAdicionarConhecimento}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs mb-1">Curso</label>
                                    <select
                                        value={adicionarCursoId}
                                        onChange={e => setAdicionarCursoId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                        required
                                    >
                                        <option value="">Selecione…</option>
                                        {cursos.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs mb-1">Conhecimento</label>
                                    {conhecimentosLoading ? (
                                        <p className="text-xs text-slate-400">Carregando…</p>
                                    ) : conhecimentosErro ? (
                                        <p className="text-xs text-red-400">{conhecimentosErro}</p>
                                    ) : (
                                        <select
                                            value={adicionarConhecimentoId}
                                            onChange={e => setAdicionarConhecimentoId(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                            required
                                        >
                                            <option value="">Selecione…</option>
                                            {conhecimentos.map(k => (
                                                <option key={k.id} value={k.id}>
                                                    {k.nome}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <button
                                    disabled={adicionandoConhecimento}
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
                                >
                                    {adicionandoConhecimento ? "Adicionando..." : "Adicionar"}
                                </button>
                            </form>
                        )}

                        {modoPainel === "removerConhecimento" && (
                            <form onSubmit={aoSubmeterRemoverConhecimento} className="space-y-4">
                                <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Remover Conhecimento</h2>
                                {erroRemoverConhecimento && (
                                    <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">
                                        {erroRemoverConhecimento}
                                    </div>
                                )}
                                {mensagemRemoverConhecimento && (
                                    <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">
                                        {mensagemRemoverConhecimento}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs mb-1">Curso</label>
                                    <select
                                        value={removerCursoId}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setRemoverCursoId(val); // corrigido nome do setter
                                            setRemoverConhecimentoId("");
                                            if (val && !conhecimentosCurso[val]) {
                                                alternarExpandirCurso(Number(val));
                                            }
                                        }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                        required
                                    >
                                        <option value="">Selecione…</option>
                                        {cursos.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs mb-1">Conhecimento (associado)</label>
                                    {!removerCursoId ? (
                                        <p className="text-xs text-slate-500">Selecione um curso primeiro.</p>
                                    ) : conhecimentosCurso[removerCursoId]?.loading ? (
                                        <p className="text-xs text-slate-400">Carregando…</p>
                                    ) : conhecimentosCurso[removerCursoId]?.error ? (
                                        <p className="text-xs text-red-400">{conhecimentosCurso[removerCursoId].error}</p>
                                    ) : (
                                        <select
                                            value={removerConhecimentoId}
                                            onChange={e => setRemoverConhecimentoId(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                            required
                                        >
                                            <option value="">Selecione…</option>
                                            {(conhecimentosCurso[removerCursoId]?.items || []).map(rel => (
                                                <option key={rel.id || rel.conhecimento_id} value={rel.conhecimento_id}>
                                                    {rel.conhecimento_nome || obterNomeConhecimento(rel.conhecimento_id)}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <button
                                    disabled={removendoConhecimento}
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
                                >
                                    {removendoConhecimento ? "Removendo..." : "Remover"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            {cursoExcluir && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-excluir-titulo"
                >
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={cancelarExclusao} />
                    <div className="relative w-full max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-6">
                        <h2 id="modal-excluir-titulo" className="text-lg font-semibold text-red-300 mb-3">
                            Confirmar Exclusão
                        </h2>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                            Tem certeza que deseja excluir o curso <strong className="text-slate-100">{cursoExcluir.nome}</strong>? Esta ação não pode ser desfeita.
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
                                {excluindo ? "Excluindo..." : "Excluir"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
