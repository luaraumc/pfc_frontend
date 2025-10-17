import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useMemo, useState } from "react"; // estados, memos e efeitos
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token
import lapisIcon from "../../../images/lapis.png"; // ícone de edição

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de administração de habilidades
export default function AdminHabilidade() {

  // Estados principais
  const navigate = useNavigate(); // navegação de páginas (voltar)
  const [habilidades, setHabilidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Filtros e paginação
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(20);

  // Atualizar Habilidade
  const [atualizarId, setAtualizarId] = useState("");
  const [atualizarNome, setAtualizarNome] = useState("");
  const [atualizarCategoriaId, setAtualizarCategoriaId] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [mensagemAtualizar, setMensagemAtualizar] = useState("");
  const [erroAtualizar, setErroAtualizar] = useState("");

  // Carrega lista de habilidades
  async function carregar() {
    try {
      setCarregando(true);
      const res = await authFetch(`${API_URL}/habilidade/`); // chama backend
      if (!res.ok) throw new Error(`Falha ao listar (HTTP ${res.status})`);
      const data = await res.json(); // converte resposta em JSON
      setHabilidades(Array.isArray(data) ? data : []); // garante que é array
      setErro("");
    } catch (e) {
      setErro(e.message || "Erro ao listar habilidades");
    } finally { setCarregando(false); }
  }

  // Carregar categorias para o select
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);
  async function carregarCategorias() {
    try {
      const res = await authFetch(`${API_URL}/habilidade/categorias`);
      if (!res.ok) return setCategoriasDisponiveis([]);
      const data = await res.json();
      setCategoriasDisponiveis(Array.isArray(data) ? data : []);
    } catch (_) {
      setCategoriasDisponiveis([]);
    }
  }

  // Carrega habilidades ao montar a tela
  useEffect(() => { carregar(); carregarCategorias(); }, []);

  // Deleta uma habilidade
  async function deletar(habilidadeId) {
    try {
      const res = await authFetch(`${API_URL}/habilidade/deletar/${habilidadeId}`, { method: "DELETE" }); // chama backend
      const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
      if (!res.ok) throw new Error(data?.detail || data?.message || `Falha ao deletar (HTTP ${res.status})`);
      setMensagem(data?.message || "Habilidade deletada");
      setHabilidades(prev => prev.filter(h => Number(h.id) !== Number(habilidadeId))); // remove item da lista local
    } catch (e) {
      setErro(e.message || "Erro ao deletar habilidade");
    }
  }

  // Seleciona uma habilidade no painel de atualização
  function aoSelecionarAtualizar(e) {
    const id = e.target.value; // id selecionado
    setAtualizarId(id);
    setMensagemAtualizar(""); setErroAtualizar("");
    if (!id) { setAtualizarNome(""); return; } // se voltar para "Selecione", limpa
    const hab = habilidades.find(h => String(h.id) === String(id)); // busca no array
  setAtualizarNome(hab?.nome || ""); // preenche nome
  setAtualizarCategoriaId(hab?.categoria_id ? String(hab.categoria_id) : "");
  }

  // Submete atualização ao backend
  async function aoSubmeterAtualizar(e) {
    e.preventDefault(); // evita reload da página
    if (!atualizarId) return; // não submete sem item selecionado
    setErroAtualizar(""); setMensagemAtualizar("");
    try {
      setAtualizando(true);
      const payload = {
        ...(atualizarNome.trim() ? { nome: atualizarNome.trim() } : {}),
        ...(atualizarCategoriaId ? { categoria_id: Number(atualizarCategoriaId) } : {}),
      }; // monta payload
      // chama backend
      const res = await authFetch(`${API_URL}/habilidade/atualizar/${atualizarId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload) // converte para JSON
      });
      const data = await res.json().catch(() => ({})); // converte resposta em JSON, se falhar retorna objeto vazio
      if (!res.ok) {
        const msg = data?.detail || data?.message || `Falha ao atualizar (HTTP ${res.status})`;
        throw new Error(msg);
      }
      setMensagemAtualizar("Habilidade atualizada com sucesso");
      setHabilidades(prev => prev.map(h => (
        Number(h.id) === Number(atualizarId)
          ? {
              ...h,
              ...(payload.nome ? { nome: payload.nome } : {}),
              ...(payload.categoria_id ? {
                categoria_id: payload.categoria_id,
                categoria: categoriasDisponiveis.find(c => Number(c.id) === Number(payload.categoria_id))?.nome ?? h.categoria,
              } : {}),
            }
          : h
      )));
    } catch (e) {
      setErroAtualizar(e.message || "Erro ao atualizar habilidade");
    } finally {
      setAtualizando(false);
    }
  }

  // Ação: clicar no lápis para editar no painel lateral
  function aoClicarEditar(h) {
    if (!h?.id) return;
    setAtualizarId(String(h.id));
  setAtualizarNome(h?.nome || "");
  setAtualizarCategoriaId(h?.categoria_id ? String(h.categoria_id) : "");
    setMensagemAtualizar("");
    setErroAtualizar("");
    // rola até o painel
    const el = document.getElementById('painel-atualizar-habilidade');
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Derivar categorias únicas a partir das habilidades carregadas
  const categorias = useMemo(() => {
    const set = new Set((habilidades || []).map(h => h?.categoria).filter(Boolean));
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base', numeric: true }));
  }, [habilidades]);

  // Lista filtrada (por texto e categoria)
  const listaFiltrada = useMemo(() => {
    let arr = Array.isArray(habilidades) ? habilidades : [];
    if (busca.trim()) {
      const q = busca.trim().toLocaleLowerCase('pt-BR');
      arr = arr.filter(h => (h?.nome ?? '').toLocaleLowerCase('pt-BR').includes(q));
    }
    if (filtroCategoria) {
      arr = arr.filter(h => String(h?.categoria) === String(filtroCategoria));
    }
    return arr;
  }, [habilidades, busca, filtroCategoria]);

  // Resetar página quando filtros mudarem
  useEffect(() => { setPagina(1); }, [busca, filtroCategoria, tamanhoPagina]);

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

  function limparFiltros() {
    setBusca("");
    setFiltroCategoria("");
    setPagina(1);
    setTamanhoPagina(20);
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
          <Link to="/admin/carreira" className="text-lg font-medium text-white hover:text-indigo-200">
            Carreiras
          </Link>
          <Link to="/admin/habilidade" className="text-lg font-medium underline decoration-slate-500 decoration-3 underline-offset-8 text-indigo-300 hover:text-indigo-200">
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
          <button onClick={logoutRedirecionar} className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Sair</button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="ml-8 mr-8 mx-auto px-4 py-5">

        {/* BOTÃO VOLTAR */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">
          <span aria-hidden>←</span> Voltar
        </button>

        {/* título */}
        <h1 className="text-2xl font-semibold text-center mb-8">Gerenciar Habilidades</h1>

        {/* Lista e painel lateral */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          <div className="flex-1 w-full">
            {/* feedback */}
            {carregando && <p className="text-slate-400">Carregando…</p>}
            {!!mensagem && !carregando && (<div className="mb-3 p-3 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-sm">{mensagem}</div>)}
            {!!erro && !carregando && (<div className="p-3 rounded border border-red-600 bg-red-900 text-red-100 text-sm">{erro}</div>)}

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
                  <label className="block text-sm text-slate-300 mb-1">Categoria</label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
                    disabled={carregando}
                  >
                    <option value="">Todas</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Itens por página</label>
                  <select
                    value={tamanhoPagina}
                    onChange={(e) => setTamanhoPagina(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
                  >
                    {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="md:col-span-4 flex items-center justify-between text-sm text-slate-400">
                  <span>
                    {totalItens > 0
                      ? `Exibindo ${inicio + 1}–${fim} de ${totalItens} resultados`
                      : 'Nenhum resultado'}
                  </span>
                  <button onClick={limparFiltros} className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Limpar filtros</button>
                </div>
              </div>
            )}

            {/* lista de habilidades com paginação */}
            {!carregando && !erro && (
              listaFiltrada.length === 0 ? (
                <p className="text-slate-400">Nenhuma habilidade encontrada.</p>
              ) : (
                <>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-lg border border-slate-800 bg-slate-800">
                    {listaPaginada.map(h => (
                      <li key={h.id ?? h.nome} className="bg-slate-950 p-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{h.nome ?? `Habilidade #${h.id}`}</p>
                            {h.id && (
                              <button
                                type="button"
                                onClick={() => aoClicarEditar(h)}
                                className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-800"
                                title="Editar"
                                aria-label={`Editar ${h.nome}`}
                              >
                                <img src={lapisIcon} alt="Editar" className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {h?.categoria && (<p className="text-xs text-slate-400">{h.categoria}</p>)}
                        </div>
                        {h.id && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => deletar(h.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-700 text-red-200 hover:bg-red-900/40" title="Excluir">
                              Excluir
                            </button>
                          </div>
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

            <div id="painel-atualizar-habilidade" className="bg-slate-950 border border-slate-800 rounded-lg p-5 sticky top-6">
              <h2 className="text-lg font-semibold text-indigo-300 tracking-wide text-center">Editar Habilidade</h2>
              <form onSubmit={aoSubmeterAtualizar} className="mt-4 space-y-3">
                <div>
                  <label className="block text-base text-slate-200 mb-1">Selecionar habilidade</label>
                  <select value={atualizarId} onChange={aoSelecionarAtualizar} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200">
                    <option value="">Selecione...</option>
                    {[...habilidades]
                      .sort((a, b) => (a?.nome ?? '').localeCompare(b?.nome ?? '', 'pt-BR', { sensitivity: 'base', numeric: true }))
                      .map(h => (
                        <option key={h.id} value={h.id}>{h.nome ?? `Habilidade #${h.id}`}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base text-slate-200 mb-1">Novo nome</label>
                  <input
                    type="text"
                    value={atualizarNome}
                    onChange={(e) => setAtualizarNome(e.target.value)}
                    placeholder="Digite o novo nome"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 mb-3"
                    disabled={!atualizarId}
                  />
                </div>
                <div>
                  <label className="block text-base text-slate-200 mb-1">Categoria</label>
                  <select
                    value={atualizarCategoriaId}
                    onChange={(e) => setAtualizarCategoriaId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
                    disabled={!atualizarId}
                  >
                    <option value="">Selecione...</option>
                    {categoriasDisponiveis.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                {!!mensagemAtualizar && (
                  <div className="p-2 rounded border border-emerald-700 bg-emerald-900 text-emerald-100 text-xs">{mensagemAtualizar}</div>
                )}
                {!!erroAtualizar && (
                  <div className="p-2 rounded border border-red-600 bg-red-900 text-red-100 text-xs">{erroAtualizar}</div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!atualizarId || !atualizarNome.trim() || atualizando}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500  disabled:cursor-not-allowed"
                  >
                    {atualizando ? "Salvando…" : "Salvar alterações"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAtualizarId(""); setAtualizarNome(""); setMensagemAtualizar(""); setErroAtualizar(""); }}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
                  >
                    Limpar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

