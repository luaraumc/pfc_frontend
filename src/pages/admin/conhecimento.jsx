import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useState } from "react"; // estados e efeitos
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de administração de conhecimentos
export default function AdminConhecimento() {

  // Estados principais
  const navigate = useNavigate(); // navegação de páginas (voltar)
  const [conhecimentos, setConhecimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

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

  // Cadastrar um novo conhecimento
  async function cadastrarConhecimento(e) {
    e.preventDefault(); // evita reload da página
    setErroCriar(""); setMensagemCriar("");
    try {
      setCriando(true);
      // chama backend
      const res = await authFetch(`${API_URL}/conhecimento/cadastro`, {
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

  // HTML
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* HEADER */}
      <header className="w-full border-b border-slate-800 bg-slate-950/80">
        <div className="w-90% ml-10 mr-10 px-4 h-16 flex items-center justify-between">
          <Link to="/homeAdmin" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
            PFC - Admin
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
        <h1 className="text-2xl font-semibold text-center mb-8">Gerenciar Conhecimentos</h1>

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

            {/* lista de conhecimentos */}
            {!carregando && !erro && (
              conhecimentos.length === 0 ? (
                <p className="text-slate-400">Nenhum conhecimento cadastrado.</p>
              ) : (
                <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
                  {conhecimentos.map(k => (
                    <li key={k.id ?? k.nome} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{k.nome ?? `Conhecimento #${k.id}`}</p>
                      </div>
                      {k.id && (
                        <button onClick={() => deletarConhecimento(k.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-700 text-red-200 hover:bg-red-900/40" title="Excluir">
                          Excluir
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>

          {/* Painel lateral */}
          <div className="w-full lg:w-96 self-start">
            <button onClick={() => window.location.reload()} className="mb-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800" title="Atualizar a página">
              <span aria-hidden>↻</span> Atualizar
            </button>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 sticky top-6">
              <div className="flex flex-col gap-3">
                <button onClick={() => { setModoPainel(modoPainel === "criar" ? "nenhum" : "criar"); setErroCriar(""); setMensagemCriar(""); }} className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainel === "criar" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
                  Cadastrar Conhecimento
                </button>
                <button onClick={() => { setModoPainel(modoPainel === "atualizar" ? "nenhum" : "atualizar"); setErroAtualizar(""); setMensagemAtualizar(""); }} className={`px-3 py-2 rounded-md text-sm font-medium border transition ${modoPainel === "atualizar" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
                  Editar Conhecimento
                </button>
              </div>

              {modoPainel === "criar" && (
                <form onSubmit={cadastrarConhecimento} className="space-y-4">
                  <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Novo Conhecimento</h2>
                  {erroCriar && <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroCriar}</div>}
                  {mensagemCriar && <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemCriar}</div>}
                  <div>
                    <label className="block text-xs mb-1">Nome</label>
                    <input value={novoNome} onChange={e => setNovoNome(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
                  </div>
                  <button disabled={criando} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium">
                    {criando ? "Salvando..." : "Cadastrar"}
                  </button>
                </form>
              )}

              {modoPainel === "atualizar" && (
                <form onSubmit={atualizarConhecimento} className="space-y-4">
                  <h2 className="text-sm font-semibold text-indigo-300 tracking-wide mt-4">Atualizar Conhecimento</h2>
                  {erroAtualizar && <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{erroAtualizar}</div>}
                  {mensagemAtualizar && <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{mensagemAtualizar}</div>}
                  <div>
                    <label className="block text-xs mb-1">Selecionar conhecimento</label>
                    <select value={atualizarId} onChange={aoSelecionarAtualizar} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required>
                      <option value="">Selecione…</option>
                      {conhecimentos.map(k => (<option key={k.id} value={k.id}>{k.nome}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Nome</label>
                    <input value={atualizarNome} onChange={e => setAtualizarNome(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
                  </div>
                  <button disabled={atualizando} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded py-2 text-sm font-medium">
                    {atualizando ? "Atualizando..." : "Salvar Alterações"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
