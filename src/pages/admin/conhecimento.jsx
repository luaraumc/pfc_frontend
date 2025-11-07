import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useMemo, useState } from "react"; // estados, memos e efeitos
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token
import lapisIcon from "../../../images/lapis.png"; // ícone de edição
import logoRumoTechno from "../../../images/rumotechno-logo.svg"; // logo RumoTechno

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de administração de conhecimentos
export default function AdminConhecimento() {

  // Estados principais
  const navigate = useNavigate(); // navegação de páginas (voltar)
  const [conhecimentos, setConhecimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Pop-up Exclusão de Conhecimento
  const [conhecimentoExcluir, setConhecimentoExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  // Lista ordenada alfabeticamente (para selects, etc.)
  const conhecimentosOrdenados = useMemo(() => {
    const arr = Array.isArray(conhecimentos) ? [...conhecimentos] : [];
    return arr.sort((a, b) => (a?.nome ?? "").localeCompare(b?.nome ?? "", 'pt-BR', { sensitivity: 'base', numeric: true }));
  }, [conhecimentos]);

  // Filtro e paginação
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(20);

  // Painel
  const [modoPainel, setModoPainel] = useState("nenhum");

  // Criar Conhecimento
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [erroCriar, setErroCriar] = useState("");
  const [mensagemCriar, setMensagemCriar] = useState("");

  // Atualizar Conhecimento
  const [atualizarId, setAtualizarId] = useState("");
  const [atualizarNome, setAtualizarNome] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [erroAtualizar, setErroAtualizar] = useState("");
  const [mensagemAtualizar, setMensagemAtualizar] = useState("");

  // Vincular/Editar categorias do conhecimento
  const [categorias, setCategorias] = useState([]);
  const [kcConhecimentoId, setKcConhecimentoId] = useState("");
  const [kcRelacoes, setKcRelacoes] = useState([]);
  const [kcCarregando, setKcCarregando] = useState(false);
  const [kcErro, setKcErro] = useState("");
  const [kcMsg, setKcMsg] = useState("");
  const [kcCategoriaId, setKcCategoriaId] = useState("");
  const [kcPeso, setKcPeso] = useState("");
  const [kcEditId, setKcEditId] = useState("");
  const [kcEditCategoriaId, setKcEditCategoriaId] = useState("");
  const [kcEditPeso, setKcEditPeso] = useState("");

  // Carrega lista de conhecimentos
  async function carregarConhecimentos() {
    try {
      setCarregando(true);
      const res = await authFetch(`${API_URL}/conhecimento/`); // chama backend
      if (!res.ok) throw new Error(`Falha ao listar (HTTP ${res.status})`);
      const data = await res.json(); // converte resposta em JSON
      setConhecimentos(Array.isArray(data) ? data : []);
      setErro("");
    } catch (e) {
      setErro(e.message || "Erro ao listar conhecimentos");
    } finally {
      setCarregando(false);
    }
  }

  // Carrega conhecimentos ao montar a tela
  useEffect(() => { carregarConhecimentos(); }, []);

  // Carrega lista de categorias (para o painel de categorias)
  async function carregarCategorias() {
    try {
      const res = await authFetch(`${API_URL}/habilidade/categorias`);
      if (!res.ok) throw new Error(`Falha ao listar categorias (HTTP ${res.status})`);
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (e) {
      // Mostra erro apenas dentro do painel
      setCategorias([]);
    }
  }

  // Carrega relações de um conhecimento
  async function carregarRelacoesConhecimento(conhecimentoId) {
    if (!conhecimentoId) return;
    try {
      setKcCarregando(true); setKcErro("");
      const res = await authFetch(`${API_URL}/conhecimento-categoria/${conhecimentoId}`);
      if (!res.ok) throw new Error(`Falha ao listar relações (HTTP ${res.status})`);
      const data = await res.json();
      setKcRelacoes(Array.isArray(data) ? data : []);
    } catch (e) {
      setKcErro(e.message || "Erro ao listar relações");
      setKcRelacoes([]);
    } finally {
      setKcCarregando(false);
    }
  }

  // Lista filtrada
  const listaFiltrada = useMemo(() => {
    let arr = Array.isArray(conhecimentos) ? conhecimentos : [];
    if (busca.trim()) {
      const q = busca.trim().toLocaleLowerCase('pt-BR');
      arr = arr.filter(k => (k?.nome ?? '').toLocaleLowerCase('pt-BR').includes(q));
    }
    return arr;
  }, [conhecimentos, busca]);

  // Reset de página quando filtro ou tamanho mudarem
  useEffect(() => { setPagina(1); }, [busca, tamanhoPagina]);

  // Paginação
  const totalItens = listaFiltrada.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / tamanhoPagina));
  const paginaClamped = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (paginaClamped - 1) * tamanhoPagina;
  const fim = Math.min(inicio + tamanhoPagina, totalItens);
  const listaPaginada = useMemo(() => {
    return [...listaFiltrada]
      .sort((a, b) => (a?.nome ?? '').localeCompare(b?.nome ?? '', 'pt-BR', { sensitivity: 'base', numeric: true }))
      .slice(inicio, fim);
  }, [listaFiltrada, inicio, fim]);

  // Quando abrir o painel de categorias, buscar categorias (uma vez)
  useEffect(() => {
    if (modoPainel === "categorias" && categorias.length === 0) {
      carregarCategorias();
    }
  }, [modoPainel]);

  // Quando selecionar um conhecimento no painel de categorias, carrega relações
  useEffect(() => {
    if (modoPainel === "categorias" && kcConhecimentoId) {
      carregarRelacoesConhecimento(kcConhecimentoId);
    } else if (modoPainel !== "categorias") {
      // limpamos estados específicos quando sai do painel
      setKcConhecimentoId("");
      setKcRelacoes([]);
      setKcCategoriaId("");
      setKcPeso("");
      setKcMsg("");
      setKcErro("");
      setKcEditId("");
    }
  }, [modoPainel, kcConhecimentoId]);

  const categoriasPorId = useMemo(() => {
    const map = new Map();
    (categorias || []).forEach(c => map.set(String(c.id), c.nome));
    return map;
  }, [categorias]);

  const categoriasDisponiveisParaAdicionar = useMemo(() => {
    const jaVinc = new Set((kcRelacoes || []).map(r => String(r.categoria_id)));
    return (categorias || []).filter(c => !jaVinc.has(String(c.id)));
  }, [categorias, kcRelacoes]);

  // Adicionar relação conhecimento-categoria
  async function kcAdicionarRelacao(e) {
    e.preventDefault();
    if (!kcConhecimentoId || !kcCategoriaId) return;
    try {
      setKcErro(""); setKcMsg("");
      const body = { conhecimento_id: Number(kcConhecimentoId), categoria_id: Number(kcCategoriaId) };
      if (kcPeso !== "" && kcPeso !== null) body.peso = Number(kcPeso);
      const res = await authFetch(`${API_URL}/conhecimento-categoria/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || data?.message || `Falha ao vincular (HTTP ${res.status})`);
      setKcMsg("Vinculado com sucesso");
      setKcCategoriaId(""); setKcPeso("");
      await carregarRelacoesConhecimento(kcConhecimentoId);
    } catch (e) {
      setKcErro(e.message || "Erro ao vincular");
    }
  }

  function kcIniciarEdicao(rel) {
    setKcEditId(String(rel.id));
    setKcEditCategoriaId(String(rel.categoria_id));
    setKcEditPeso(rel.peso ?? "");
    setKcMsg(""); setKcErro("");
  }

  async function kcSalvarEdicao(rel) {
    if (!kcEditId) return;
    try {
      setKcErro(""); setKcMsg("");
      const payload = {};
      if (kcEditCategoriaId !== "") payload.categoria_id = Number(kcEditCategoriaId);
      // permitir limpar peso
      if (kcEditPeso === "" || kcEditPeso === null) payload.peso = null; else payload.peso = Number(kcEditPeso);
      const res = await authFetch(`${API_URL}/conhecimento-categoria/${kcEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || data?.message || `Falha ao editar (HTTP ${res.status})`);
      setKcMsg("Relação atualizada");
      setKcEditId("");
      await carregarRelacoesConhecimento(kcConhecimentoId);
    } catch (e) {
      setKcErro(e.message || "Erro ao salvar edição");
    }
  }

  async function kcRemover(rel) {
    try {
      setKcErro(""); setKcMsg("");
      const res = await authFetch(`${API_URL}/conhecimento-categoria/${kcConhecimentoId}/${rel.categoria_id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || data?.message || `Falha ao remover (HTTP ${res.status})`);
      setKcMsg("Relação removida");
      await carregarRelacoesConhecimento(kcConhecimentoId);
    } catch (e) {
      setKcErro(e.message || "Erro ao remover");
    }
  }

  function limparFiltros() {
    setBusca("");
    setPagina(1);
    setTamanhoPagina(20);
  }

  // Cadastrar um novo conhecimento
  async function cadastrarConhecimento(e) {
    e.preventDefault(); // evita reload da página
    setErroCriar(""); setMensagemCriar("");
    try {
      setCriando(true);
      // chama backend
      const res = await authFetch(`${API_URL}/conhecimento/cadastro/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome.trim() }) // converte para JSON
      });
      const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
      if (!res.ok) throw new Error(data?.detail || data?.message || `Falha ao cadastrar (HTTP ${res.status})`);
      setMensagemCriar(data?.message || "Conhecimento cadastrado");
      setNovoNome("");
      await carregarConhecimentos();
    } catch (e) {
      setErroCriar(e.message || "Erro ao cadastrar conhecimento");
    } finally { setCriando(false); }
  }

  // Seleciona conhecimento no painel de atualização
  function aoSelecionarAtualizar(e) {
    const id = e.target.value; // id selecionado
    setAtualizarId(id);
    setMensagemAtualizar(""); setErroAtualizar("");
    if (!id) { setAtualizarNome(""); return; } // se voltar para "Selecione", limpa
    const k = conhecimentos.find(k => String(k.id) === String(id)); // busca no array
    setAtualizarNome(k?.nome || ""); // preenche nome
  }

  // Submete atualização ao backend
  async function atualizarConhecimento(e) {
    e.preventDefault(); // evita reload da página
    if (!atualizarId) return; // não submete sem item selecionado
    try {
      setAtualizando(true);
      const payload = { nome: atualizarNome.trim() }; // monta payload
      // chama backend
      const res = await authFetch(`${API_URL}/conhecimento/atualizar/${atualizarId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload) // converte para JSON
      });
      const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
      if (!res.ok) throw new Error(data?.detail || data?.message || `Falha ao atualizar (HTTP ${res.status})`);
      setMensagemAtualizar(data?.message || "Conhecimento atualizado");
      setConhecimentos(prev => prev.map(k => String(k.id) === String(atualizarId) ? { ...k, nome: payload.nome } : k)); // atualiza item na lista local
    } catch (e) {
      setErroAtualizar(e.message || "Erro ao atualizar conhecimento");
    } finally { setAtualizando(false); }
  }

  // Ação: clicar no lápis para editar no painel lateral
  function aoClicarEditar(k) {
    if (!k?.id) return;
    setModoPainel("atualizar");
    setAtualizarId(String(k.id));
    setAtualizarNome(k?.nome || "");
    setMensagemAtualizar("");
    setErroAtualizar("");
    const el = document.getElementById('painel-editar-conhecimento');
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Deletar um conhecimento
  async function deletarConhecimento(id) {
    if (!id) return; // não tenta sem id
    try {
      const res = await authFetch(`${API_URL}/conhecimento/deletar/${id}`, { method: "DELETE" }); // chama backend
      const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
      if (!res.ok) throw new Error(data?.detail || data?.message || `Falha ao deletar (HTTP ${res.status})`);
      setMensagem(data?.message || "Conhecimento deletado");
      setConhecimentos(prev => prev.filter(k => Number(k.id) !== Number(id))); // remove item da lista local
    } catch (e) {
      setErro(e.message || "Erro ao deletar conhecimento");
    }
  }

  // Fluxo de confirmação de exclusão
  function solicitarExclusao(k) {
    setConhecimentoExcluir(k || null);
    setErro("");
    setMensagem("");
  }

  async function confirmarExclusao() {
    if (!conhecimentoExcluir?.id) return;
    try {
      setExcluindo(true);
      await deletarConhecimento(conhecimentoExcluir.id);
      setConhecimentoExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }

  function cancelarExclusao() {
    setConhecimentoExcluir(null);
  }

  // HTML
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* HEADER */}
      <header className="w-full border-b border-slate-800 bg-slate-950/80">
        <div className="w-90% ml-10 mr-10 px-4 h-16 flex items-center justify-between">
          <Link to="/homeAdmin" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
            <img src={logoRumoTechno} alt="RumoTechno" className="h-8 w-auto transition-transform duration-200 ease-out hover:scale-103" />
          </Link>
          <Link to="/admin/carreira" className="text-lg font-medium text-white hover:text-indigo-200">
            Carreiras
          </Link>
          <Link to="/admin/habilidade" className="text-lg font-medium text-white hover:text-indigo-200">
            Habilidades
          </Link>
          <Link to="/admin/curso" className="text-lg font-medium text-white hover:text-indigo-200">
            Cursos
          </Link>
          <Link to="/admin/conhecimento" className="text-lg font-medium underline decoration-slate-500 decoration-3 underline-offset-8 text-indigo-300 hover:text-indigo-200">
            Conhecimentos
          </Link>
          <Link to="/admin/vaga" className="text-lg font-medium text-white hover:text-indigo-200">
            Vagas
          </Link>
          <button onClick={logoutRedirecionar} className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Sair</button>
        </div>
      </header>
      <main className="ml-8 mr-8 mx-auto px-4 py-5">

        {/* BOTÃO VOLTAR */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">
          <span aria-hidden>←</span> Voltar
        </button>

        {/* título */}
        <h1 className="text-2xl font-semibold text-center mb-4">Gerenciar Conhecimentos</h1>

        <h2 className="text-xl text-center mb-8">
          Caro administrador, para gerenciar os cursos e os conhecimentos, utilize as{' '}
          <a
            href="https://portal.mec.gov.br/escola-de-gestores-da-educacao-basica/323-secretarias-112877938/orgaos-vinculados-82187207/18689-computacao"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-indigo-300 hover:text-indigo-200"
          >
            Diretrizes Curriculares Nacionais
          </a>{' '}
            dos cursos de graduação em Computação.
        </h2>

        {/* lista e painel lateral */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          <div className="flex-1 w-full">

            {/* feedback */}
            {carregando && <p className="text-slate-400">Carregando…</p>}
            {!!mensagem && !carregando && (
              <div className="mb-3 p-3 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">{mensagem}</div>
            )}
            {!!erro && !carregando && (
              <div className="p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">{erro}</div>
            )}

            {/* filtros */}
            {!carregando && (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-300 mb-1">Buscar por nome</label>
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Digite parte do nome"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Itens por página</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={tamanhoPagina}
                      onChange={(e) => setTamanhoPagina(Number(e.target.value))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
                    >
                      {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <button onClick={limparFiltros} className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 whitespace-nowrap">Limpar filtros</button>
                  </div>
                </div>
                <div className="md:col-span-4 flex items-center justify-start text-sm text-slate-400">
                  <span>
                    {totalItens > 0
                      ? `Exibindo ${inicio + 1}–${fim} de ${totalItens} resultados`
                      : 'Nenhum resultado'}
                  </span>
                </div>
              </div>
            )}

            {/* lista de conhecimentos (paginada) */}
            {!carregando && !erro && (
              listaFiltrada.length === 0 ? (
                <p className="text-slate-400">Nenhum conhecimento encontrado.</p>
              ) : (
                <>
                  <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
                    {listaPaginada.map(k => (
                      <li key={k.id ?? k.nome} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{k.nome ?? `Conhecimento #${k.id}`}</p>
                            {k.id && (
                              <button
                                type="button"
                                onClick={() => aoClicarEditar(k)}
                                className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-800"
                                title="Editar"
                                aria-label={`Editar ${k.nome}`}
                              >
                                <img src={lapisIcon} alt="Editar" className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {k.id && (
                          <button onClick={() => solicitarExclusao(k)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-700 text-red-200 hover:bg-red-900/40" title="Excluir">
                            Excluir
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {/* paginação */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                      className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                      onClick={() => setPagina(p => Math.max(1, p - 1))}
                      disabled={paginaClamped <= 1}
                    >Anterior</button>
                    <span className="text-sm text-slate-400">Página {paginaClamped} de {totalPaginas}</span>
                    <button
                      className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                      onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaClamped >= totalPaginas}
                    >Próxima</button>
                  </div>
                </>
              )
            )}
          </div>

          {/* Painel lateral */}
          <div className="w-full lg:w-96 self-start">

            <div id="painel-editar-conhecimento" className="bg-slate-950 border border-slate-800 rounded-lg p-5 sticky top-6">
              <div className="flex flex-col gap-3">
                <button onClick={() => { setModoPainel(modoPainel === "criar" ? "nenhum" : "criar"); setErroCriar(""); setMensagemCriar(""); }} className={`px-3 py-2 rounded-md text-base font-medium border transition ${modoPainel === "criar" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
                  Cadastrar Conhecimento
                </button>
                <button onClick={() => { setModoPainel(modoPainel === "atualizar" ? "nenhum" : "atualizar"); setErroAtualizar(""); setMensagemAtualizar(""); }} className={`px-3 py-2 rounded-md text-base font-medium border transition ${modoPainel === "atualizar" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
                  Editar Conhecimento
                </button>
                <button onClick={() => { setModoPainel(modoPainel === "categorias" ? "nenhum" : "categorias"); }} className={`px-3 py-2 rounded-md text-base font-medium border transition ${modoPainel === "categorias" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
                  Vincular Categorias
                </button>
              </div>

              {modoPainel === "criar" && (
                <form onSubmit={cadastrarConhecimento} className="space-y-4">
                  <h2 className="text-base font-semibold text-indigo-300 tracking-wide mt-4 text-center">Novo Conhecimento</h2>
                  {erroCriar && <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroCriar}</div>}
                  {mensagemCriar && <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemCriar}</div>}
                  <div>
                    <label className="block text-base mb-1">Nome</label>
                    <input value={novoNome} onChange={e => setNovoNome(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
                  </div>
                  <button disabled={criando} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-base font-medium">
                    {criando ? "Salvando..." : "Cadastrar"}
                  </button>
                </form>
              )}

              {modoPainel === "atualizar" && (
                <form onSubmit={atualizarConhecimento} className="space-y-4">
                  <h2 className="text-base font-semibold text-indigo-300 tracking-wide mt-4 text-center">Editar Conhecimento</h2>
                  {erroAtualizar && <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroAtualizar}</div>}
                  {mensagemAtualizar && <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemAtualizar}</div>}
                  <div>
                    <label className="block text-base mb-1">Selecionar conhecimento</label>
                    <select value={atualizarId} onChange={aoSelecionarAtualizar} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required>
                      <option value="">Selecione…</option>
                      {conhecimentosOrdenados.map(k => (<option key={k.id} value={k.id}>{k.nome}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-base mb-1">Novo nome</label>
                    <input value={atualizarNome} onChange={e => setAtualizarNome(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
                  </div>
                  <button disabled={atualizando} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-base font-medium">
                    {atualizando ? "Atualizando..." : "Salvar Alterações"}
                  </button>
                </form>
              )}

              {modoPainel === "categorias" && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-indigo-300 tracking-wide mt-4 text-center">Categoria do Conhecimento</h2>
                  {kcErro && <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{kcErro}</div>}
                  {kcMsg && <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{kcMsg}</div>}

                  <div>
                    <label className="block text-base mb-1">Selecionar conhecimento</label>
                    <select value={kcConhecimentoId} onChange={e => { setKcConhecimentoId(e.target.value); }} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm">
                      <option value="">Selecione…</option>
                      {conhecimentosOrdenados.map(k => (<option key={k.id} value={k.id}>{k.nome}</option>))}
                    </select>
                  </div>

                  {kcConhecimentoId && (
                    <>
                      <form onSubmit={kcAdicionarRelacao} className="space-y-2">
                        <div>
                          <label className="block text-base mb-1">Categoria</label>
                          <select value={kcCategoriaId} onChange={e => setKcCategoriaId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required>
                            <option value="">Selecione…</option>
                            {categoriasDisponiveisParaAdicionar.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-base mb-1">Peso (0 a 3)</label>
                          <input
                            type="number"
                            min={0}
                            max={3}
                            value={kcPeso}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === "") { setKcPeso(""); return; }
                              const num = Number(val);
                              if (Number.isNaN(num)) return;
                              const clamped = Math.min(3, Math.max(0, num));
                              setKcPeso(String(clamped));
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                          />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 rounded py-2 text-base font-medium">Vincular</button>
                      </form>

                      <div className="mt-4">
                        <h3 className="block text-base mb-1">Relações</h3>
                        {kcCarregando ? (
                          <p className="text-slate-400">Carregando…</p>
                        ) : (
                          (kcRelacoes || []).length === 0 ? (
                            <p className="text-slate-400">Nenhuma categoria vinculada.</p>
                          ) : (
                            <ul className="divide-y divide-slate-800 rounded border border-slate-800">
                              {kcRelacoes.map(rel => (
                                <li key={rel.id} className="p-3 flex flex-col gap-2">
                                  {String(kcEditId) === String(rel.id) ? (
                                    <div className="flex flex-col gap-2">
                                      <div>
                                        <label className="block text-xs text-slate-400">Categoria</label>
                                        <select value={kcEditCategoriaId} onChange={e => setKcEditCategoriaId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm">
                                          {(categorias || []).map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs text-slate-400">Peso (0 a 3)</label>
                                        <input
                                          type="number"
                                          min={0}
                                          max={3}
                                          value={kcEditPeso}
                                          onChange={e => {
                                            const val = e.target.value;
                                            if (val === "") { setKcEditPeso(""); return; }
                                            const num = Number(val);
                                            if (Number.isNaN(num)) return;
                                            const clamped = Math.min(3, Math.max(0, num));
                                            setKcEditPeso(String(clamped));
                                          }}
                                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => kcSalvarEdicao(rel)} className="px-3 py-2 rounded-md border border-emerald-700 text-emerald-200 hover:bg-emerald-900/40">Salvar</button>
                                        <button type="button" onClick={() => setKcEditId("")} className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Cancelar</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="text-sm">
                                        <div className="font-medium">{categoriasPorId.get(String(rel.categoria_id)) || `Categoria #${rel.categoria_id}`}</div>
                                        <div className="text-slate-400">Peso: {rel.peso ?? '—'}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => kcIniciarEdicao(rel)} className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Editar</button>
                                        <button type="button" onClick={() => kcRemover(rel)} className="px-3 py-2 rounded-md border border-red-700 text-red-200 hover:bg-red-900/40">Remover</button>
                                      </div>
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Modal de confirmação de exclusão */}
      {!!conhecimentoExcluir && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={cancelarExclusao}></div>
          <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg max-w-sm w-full z-10">
            <div className="p-5">
              {/* título */}
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Confirmar Exclusão</h2>
              {/* mensagem */}
              <p className="text-sm text-slate-400 mb-6">
                Tem certeza que deseja excluir o conhecimento "
                <span className="font-medium text-slate-200">{conhecimentoExcluir?.nome ?? `#${conhecimentoExcluir?.id}`}</span>"?
              </p>
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
                  disabled={excluindo}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition flex items-center gap-2 disabled:opacity-80"
                >
                  {excluindo && (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path fill="currentColor" d="M4 12h16M12 4v16" />
                    </svg>
                  )}
                  {excluindo ? "Excluindo..." : "Excluir Conhecimento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
