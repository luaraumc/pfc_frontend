import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useState } from "react"; // estados e efeitos
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token
import lixeiraIcon from "../../../images/lixeira.png"; // ícone de lixeira para deletar
import setaIcon from "../../../images/seta.png"; // ícone de seta para expandir

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de administração de cursos
export default function AdminCurso() {

    // Estados principais
    const navigate = useNavigate(); // navegação de páginas (voltar)
    const [cursos, setCursos] = useState([]); // lista de cursos
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    // Painéis Laterais
    const [modoPainelCurso, setModoPainelCurso] = useState("nenhum");
    const [modoPainelConhecimento, setModoPainelConhecimento] = useState("nenhum");

    // Cadastrar Curso
    const [novoNome, setNovoNome] = useState("");
    const [novaDescricao, setNovaDescricao] = useState("");
    const [criando, setCriando] = useState(false);
    const [mensagemCriar, setMensagemCriar] = useState("");
    const [erroCriar, setErroCriar] = useState("");

    // Atualizar Curso
    const [atualizarId, setAtualizarId] = useState("");
    const [atualizarNome, setAtualizarNome] = useState("");
    const [atualizarDescricao, setAtualizarDescricao] = useState("");
    const [atualizando, setAtualizando] = useState(false);
    const [mensagemAtualizar, setMensagemAtualizar] = useState("");
    const [erroAtualizar, setErroAtualizar] = useState("");

    // Pop-up Exclusão de Curso
    const [cursoExcluir, setCursoExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);
    
    // Conhecimentos globais
    const [conhecimentos, setConhecimentos] = useState([]);
    const [conhecimentosErro, setConhecimentosErro] = useState("");
    const [conhecimentosLoading, setConhecimentosLoading] = useState(true);

    // Conhecimentos por curso
    const [cursosExpandidos, setCursosExpandidos] = useState([]);
    const [conhecimentosCurso, setConhecimentosCurso] = useState({});

    // Adicionar Conhecimento ao Curso
    const [adicionarCursoId, setAdicionarCursoId] = useState("");
    const [adicionarConhecimentoId, setAdicionarConhecimentoId] = useState("");
    const [adicionandoConhecimento, setAdicionandoConhecimento] = useState(false);
    const [mensagemAdicionarConhecimento, setMensagemAdicionarConhecimento] = useState("");
    const [erroAdicionarConhecimento, setErroAdicionarConhecimento] = useState("");

    // Remover Conhecimento do Curso
    const [removerCursoId, setRemoverCursoId] = useState("");
    const [removerConhecimentoId, setRemoverConhecimentoId] = useState("");
    const [removendoConhecimento, setRemovendoConhecimento] = useState(false);
    const [mensagemRemoverConhecimento, setMensagemRemoverConhecimento] = useState("");
    const [erroRemoverConhecimento, setErroRemoverConhecimento] = useState("");

    // Carrega lista de cursos
    useEffect(() => {
        let ativo = true; // evitar atualização de estado após desmontar
        (async () => {
            try {
                const res = await authFetch(`${API_URL}/curso/`); // chama backend
                if (!res.ok) throw new Error(`Falha ao listar cursos (HTTP ${res.status})`);
                const data = await res.json(); // converte resposta em JSON
                if (ativo) setCursos(Array.isArray(data) ? data : []);  // garante que é array
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

    // Carrega lista de conhecimentos
    useEffect(() => {
        let ativo = true; // evitar atualização de estado após desmontar
        (async () => {
            try {
                setConhecimentosLoading(true); // inicia carregamento
                const res = await authFetch(`${API_URL}/conhecimento/`); // chama backend
                if (!res.ok) throw new Error(`Falha ao listar conhecimentos (HTTP ${res.status})`);
                const data = await res.json(); // converte resposta em JSON
                if (ativo) setConhecimentos(Array.isArray(data) ? data : []); // garante que é array
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

    // ======================================= CURSO =======================================

    // Alterna expansão e carrega conhecimentos do curso (cache)
    function alternarExpandirCurso(id) {
        setCursosExpandidos(estadoAnterior => (estadoAnterior.includes(id) // verifica se já está expandido
        ? estadoAnterior.filter(item => item !== id) // recolhe
        : [...estadoAnterior, id])); // expande
        setConhecimentosCurso(estadoAnterior => {
            if (estadoAnterior[id]) return estadoAnterior; // já carregado
            return { ...estadoAnterior, [id]: { items: [], loading: true, error: "" } }; // inicia carregamento
        });
        // carrega conhecimentos se ainda não carregados
        if (!conhecimentosCurso[id]) {
            (async () => {
                try {
                    const res = await authFetch(`${API_URL}/curso/${id}/conhecimentos`); // chama backend
                    const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
                    if (!res.ok)
                        throw new Error(
                            data?.detail || data?.message || `Falha ao carregar conhecimentos do curso (HTTP ${res.status})`
                        );
                    // grava no cache os conhecimentos carregados de um curso
                    setConhecimentosCurso(estadoAnterior => ({ // garante estado mais recente
                        ...estadoAnterior, // mantém estados anteriores dos outros cursos no cache
                        [id]: { items: Array.isArray(data) ? data : [], loading: false, error: "" } // atualiza só o curso específico
                    }));
                } catch (e) {
                    setConhecimentosCurso(estadoAnterior => ({ // garante estado mais recente
                        ...estadoAnterior, // mantém estados anteriores dos outros cursos no cache
                        [id]: { items: [], loading: false, error: e.message || "Erro ao carregar" } // atualiza só o curso específico
                    }));
                }
            })();
        }
    }

    // Exclusão de curso
    function solicitarExclusao(c) {
        setErro(""); setMensagem("");
        setCursoExcluir({ id: c.id, nome: c.nome }); // abre modal de confirmação
    }

    // Confirma exclusão de curso
    async function confirmarExclusao() {
        if (!cursoExcluir) return; // evita exclusão quando não há curso selecionado
        setExcluindo(true); setErro(""); setMensagem("");
        try {
            const res = await authFetch(`${API_URL}/curso/deletar/${cursoExcluir.id}`, { method: "DELETE" }); // chama backend
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao excluir (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setCursos(estadoAnterior => estadoAnterior.filter(c => c.id !== cursoExcluir.id)); // atualiza removendo do array o curso que foi excluído
            setMensagem(data?.message || "Curso deletado com sucesso.");
            setCursoExcluir(null);
        } catch (e) {
            setErro(e.message ?? "Erro ao deletar curso");
        } finally {
            setExcluindo(false);
        }
    }

    // Cancela exclusão de curso
    function cancelarExclusao() {
        if (excluindo) return; // evita fechar modal durante exclusão
        setCursoExcluir(null);
    }

    // Cadastrar curso
    async function cadastrarCurso(e) {
        e.preventDefault(); // evita reload da página
        setErroCriar(""); setMensagemCriar("");
        try {
            setCriando(true);
            const payload = { nome: novoNome.trim(), descricao: novaDescricao.trim() }; // monta o objeto que será enviado ao backend
            // chama backend
            const res = await authFetch(`${API_URL}/curso/cadastro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload) // converte para JSON
            });
            const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao cadastrar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemCriar(data?.message || "Curso cadastrado com sucesso");
            if (data?.id) {
                setCursos(estadoAnterior => [{ id: data.id, nome: payload.nome, descricao: payload.descricao }, ...estadoAnterior]); // update na lista de cursos inserindo o novo no topo
            }
            setNovoNome(""); setNovaDescricao("");
        } catch (e) {
            setErroCriar(e.message ?? "Erro ao cadastrar curso");
        } finally {
            setCriando(false);
        }
    }

    // Atualizar curso (chamado ao selecionar curso para atualizar)
    function aoSelecionarAtualizar(e) {
        const id = e.target.value; // id do curso selecionada
        setAtualizarId(id);
        setMensagemAtualizar(""); setErroAtualizar("");
        if (!id) { setAtualizarNome(""); setAtualizarDescricao(""); return; } // nenhum curso válido selecionado, ainda está no “Selecione…”
        const curso = cursos.find(c => String(c.id) === id); // busca curso selecionado
        // preenche campos de nome e descrição
        if (curso) {
            setAtualizarNome(curso.nome || "");
            setAtualizarDescricao(curso.descricao || "");
        }
    }

    // Submeter atualização de curso
    async function aoSubmeterAtualizar(e) {
        e.preventDefault();
        if (!atualizarId) return; // evita submissão quando não há curso válido selecionado
        setErroAtualizar(""); setMensagemAtualizar("");
        try {
            setAtualizando(true);
            const payload = { nome: atualizarNome.trim(), descricao: atualizarDescricao.trim() }; // monta o objeto que será enviado ao backend
            // chama backend
            const res = await authFetch(`${API_URL}/curso/atualizar/${atualizarId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload) // converte para JSON
            });
            const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao atualizar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemAtualizar(data?.message || "Curso atualizado com sucesso");
            setCursos(estadoAnterior => estadoAnterior.map(c => (c.id === Number(atualizarId) ? { ...c, nome: payload.nome, descricao: payload.descricao } : c))); // atualiza o curso na lista
        } catch (e) {
            setErroAtualizar(e.message ?? "Erro ao atualizar curso");
        } finally {
            setAtualizando(false);
        }
    }

    // ======================================= CONHECIMENTO =======================================

    // Obter o nome do conhecimento pelo ID para exibição
    function obterNomeConhecimento(conhecimentoId) {
        const conhecimento = conhecimentos.find(conhecimento => Number(conhecimento.id) === Number(conhecimentoId)); // busca conhecimento pelo ID
        return conhecimento?.nome || `Conhecimento #${conhecimentoId}`; // retorna nome ou ID se não encontrado
    }

    // Adicionar conhecimento ao curso
    async function AdicionarConhecimentoAoCurso(e) {
        e.preventDefault(); // evita reload da página
        if (!adicionarCursoId || !adicionarConhecimentoId) return; // evita submissão quando não há curso ou conhecimento válidos selecionados
        setErroAdicionarConhecimento(""); setMensagemAdicionarConhecimento("");
        try {
            setAdicionandoConhecimento(true);
            // chama backend
            const res = await authFetch(
                `${API_URL}/curso/${adicionarCursoId}/adicionar-conhecimento/${adicionarConhecimentoId}`,
                { method: "POST" }
            );
            const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao adicionar (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemAdicionarConhecimento("Conhecimento adicionado ao curso");
            // atualiza o cache de conhecimentos do curso adicionando o conhecimento associado
            setConhecimentosCurso(estadoAnterior => {
                const entry = estadoAnterior[adicionarCursoId];
                if (!entry) return estadoAnterior;
                return { ...estadoAnterior, [adicionarCursoId]: { ...entry, items: [...entry.items, data], loading: false } };
            });
            setAdicionarConhecimentoId("");
            // Força atualização da lista de conhecimentos
            setConhecimentosLoading(false);
            setConhecimentosErro("");
        } catch (e) {
            setErroAdicionarConhecimento(e.message || "Erro ao adicionar");
        } finally {
            setAdicionandoConhecimento(false);
        }
    }

    // Remover conhecimento do curso
    async function RemoverConhecimentoDoCurso(e) {
        e.preventDefault(); // evita reload da página
        if (!removerCursoId || !removerConhecimentoId) return; // evita submissão quando não há curso ou conhecimento válidos selecionados
        setErroRemoverConhecimento(""); setMensagemRemoverConhecimento("");
        try {
            setRemovendoConhecimento(true);
            // chama backend
            const res = await authFetch(
                `${API_URL}/curso/${removerCursoId}/remover-conhecimento/${removerConhecimentoId}`,
                { method: "DELETE" }
            );
            const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao remover (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setMensagemRemoverConhecimento("Conhecimento removido do curso");
            // atualiza o cache de conhecimentos do curso removendo o conhecimento desassociado
            setConhecimentosCurso(estadoAnterior => {
                const entry = estadoAnterior[removerCursoId];
                if (!entry) return estadoAnterior;
                return {
                    ...estadoAnterior,
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

    // HTML
    return (
        <div className="min-h-screen bg-slate-900 text-slate-200">
            
            {/* HEADER */}
			<header className="w-full border-b border-slate-800 bg-slate-950/80">
				<div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
				<Link to="/homeAdmin" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
					PFC - Admin
				</Link>
				<Link to="/admin/carreira" className="text-lg font-medium text-white hover:text-indigo-200">
					Carreiras
				</Link>
				<Link to="/admin/curso" className="text-lg font-medium text-white hover:text-indigo-200">
					Cursos
				</Link>
                <Link to="/admin/conhecimento" className="text-lg font-medium text-white hover:text-indigo-200">
                    Conhecimentos
                </Link>
                <Link to="/admin/habilidade" className="text-lg font-medium text-white hover:text-indigo-200">
                    Habilidades
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
                <h1 className="text-2xl font-semibold text-center mb-8">Gerenciar Cursos</h1>

                {/* listagem à esquerda | painel à direita */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    <div className="flex-1 w-full">
                        {/* feedback */}
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

                        {/* lista de cursos */}
                        {!carregando && !erro && (
                            cursos.length === 0 ? (
                                <p className="text-slate-400">Nenhum curso cadastrado.</p>
                            ) : (
                                <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
                                    {cursos.map(c => (
                                        <li key={c.id ?? c.nome} className="p-4 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    {/* nome do curso */}
                                                    <p className="font-medium">{c.nome ?? `Curso #${c.id}`}</p>
                                                    {/* expandir conhecimentos */}
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

                                                {/* descrição do curso */}
                                                {c.descricao && <p className="text-sm text-slate-400">{c.descricao}</p>}

                                                {/* conhecimentos associados */}
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

                                            {/* excluir curso */}
                                            {c.id && (
                                                <button
                                                    onClick={() => solicitarExclusao(c)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-700 text-red-200 hover:bg-red-900/40"
                                                    title="Excluir curso"
                                                >
                                                    <img src={lixeiraIcon} alt="Excluir" className="w-5 h-5" />
                                                    <span className="hidden sm:inline">Excluir</span>
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )
                        )}
                    </div>

                    {/* Painel Lateral: Curso + Conhecimentos por Curso */}
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
                                {/* cadastrar novo curso */}
                                <button
                                    onClick={() => { setModoPainelCurso(modoPainelCurso === "criar" ? "nenhum" : "criar"); setMensagemCriar(""); setErroCriar(""); }}
                                    className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainelCurso === "criar"? "bg-indigo-600 border-indigo-500 text-white": "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
                                >
                                    Cadastrar Novo Curso
                                </button>
                                {/* atualizar curso */}
                                <button
                                    onClick={() => {setModoPainelCurso(modoPainelCurso === "atualizar" ? "nenhum" : "atualizar"); setMensagemAtualizar(""); setErroAtualizar(""); }}
                                    className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainelCurso === "atualizar"? "bg-indigo-600 border-indigo-500 text-white": "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
                                >
                                    Atualizar Curso
                                </button>

                                {/* separador */}
                                <div className="h-px bg-slate-800 my-2" />

                                {/* Gerenciar Conhecimentos por Curso */}
                                <button
                                    onClick={() => { setModoPainelConhecimento(modoPainelConhecimento === "adicionar" ? "nenhum" : "adicionar"); setMensagemAdicionarConhecimento(""); setErroAdicionarConhecimento(""); }}
                                    className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainelConhecimento === "adicionar"? "bg-indigo-600 border-indigo-500 text-white": "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
                                >
                                    Adicionar Conhecimento ao Curso
                                </button>
                                <button
                                    onClick={() => { setModoPainelConhecimento(modoPainelConhecimento === "remover" ? "nenhum" : "remover"); setMensagemRemoverConhecimento(""); setErroRemoverConhecimento(""); }}
                                    className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainelConhecimento === "remover"? "bg-indigo-600 border-indigo-500 text-white": "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
                                >
                                    Remover Conhecimento do Curso
                                </button>
                            </div>

                            {/* formulario cadastro de conhecimento */}
                            {/* Removidos os formulários de CRUD de conhecimento desta página */}

                            {/* formulario cadastro de curso */}
                            {modoPainelCurso === "criar" && (
                                <form onSubmit={cadastrarCurso} className="space-y-4">
                                    {/* título */}
                                    <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Novo Curso</h2>
                                    {/* feedback */}
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
                                    {/* nome */}
                                    <div>
                                        <label className="block text-xs mb-1">Nome</label>
                                        <input
                                            value={novoNome}
                                            onChange={e => setNovoNome(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    {/* descrição */}
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
                                    {/* botão enviar */}
                                    <button
                                        disabled={criando}
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
                                    >
                                        {criando ? "Salvando..." : "Cadastrar"}
                                    </button>
                                </form>
                            )}

                            {/* formulario atualizar curso */}
                            {modoPainelCurso === "atualizar" && (
                                <form onSubmit={aoSubmeterAtualizar} className="space-y-4">
                                    {/* título */}
                                    <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Atualizar Curso</h2>
                                    {/* feedback */}
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
                                    {/* seleção de curso */}
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
                                    {/* nome */}
                                    <div>
                                        <label className="block text-xs mb-1">Nome</label>
                                        <input
                                            value={atualizarNome}
                                            onChange={e => setAtualizarNome(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    {/* descrição */}
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
                                    {/* botão enviar */}
                                    <button
                                        disabled={atualizando}
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
                                    >
                                        {atualizando ? "Atualizando..." : "Salvar Alterações"}
                                    </button>
                                </form>
                            )}

                            {/* formulario adicionar conhecimento ao curso */}
                            {modoPainelConhecimento === "adicionar" && (
                                <form onSubmit={AdicionarConhecimentoAoCurso} className="space-y-4">
                                    {/* título */}
                                    <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Adicionar Conhecimento</h2>
                                    {/* feedback */}
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
                                    {/* seleção de curso */}
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
                                    {/* seleção de conhecimento */}
                                    <div>
                                        <label className="block text-xs mb-1">Conhecimento</label>
                                        {conhecimentosLoading ? (
                                            <p className="text-xs text-slate-400">Carregando…</p>
                                        ) : conhecimentosErro ? (
                                            <p className="text-xs text-red-400">{conhecimentosErro}</p>
                                        ) : conhecimentos.length === 0 ? (
                                            <p className="text-xs text-slate-500">Nenhum conhecimento disponível.</p>
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
                                    {/* botão enviar */}
                                    <button
                                        disabled={adicionandoConhecimento}
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium"
                                    >
                                        {adicionandoConhecimento ? "Adicionando..." : "Adicionar"}
                                    </button>
                                </form>
                            )}

                            {/* formulario remover conhecimento do curso */}
                            {modoPainelConhecimento === "remover" && (
                                <form onSubmit={RemoverConhecimentoDoCurso} className="space-y-4">
                                    {/* título */}
                                    <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Remover Conhecimento</h2>
                                    {/* feedback */}
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
                                    {/* seleção de curso */}
                                    <div>
                                        <label className="block text-xs mb-1">Curso</label>
                                        <select
                                            value={removerCursoId}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setRemoverCursoId(val);
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
                                    {/* seleção de conhecimento */}
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
                                    {/* botão enviar */}
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
                </div>
            </main>

            {/* confirmação de exclusão */}
            {cursoExcluir && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg max-w-sm w-full z-10">
                        <div className="p-5">
                            {/* título */}
                            <h2 className="text-lg font-semibold text-slate-200 mb-4">Confirmar Exclusão</h2>
                            {/* mensagem */}
                            <p className="text-sm text-slate-400 mb-6">
                                Tem certeza que deseja excluir o curso "<span className="font-medium text-slate-200">{cursoExcluir.nome}</span>"?
                            </p>
                            {/* feedback */}
                            {erro && (
                                <div className="mb-4 text-sm text-red-400">
                                    {erro}
                                </div>
                            )}
                            {mensagem && (
                                <div className="mb-4 text-sm text-emerald-400">
                                    {mensagem}
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                {/* botão cancelar */}
                                <button
                                    onClick={cancelarExclusao}
                                    className="px-4 py-2 rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
                                >
                                    Cancelar
                                </button>
                                {/* botão confirmar */}
                                <button
                                    onClick={confirmarExclusao}
                                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition flex items-center gap-2"
                                >
                                    {excluindo && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path fill="currentColor" d="M4 12h16M12 4v16" />
                                    </svg>}
                                    {excluindo ? "Excluindo..." : "Excluir Curso"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
