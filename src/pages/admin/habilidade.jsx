import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useState } from "react"; // estados e efeitos
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de administração de habilidades
export default function AdminHabilidade() {

  // Estados principais
  const navigate = useNavigate(); // navegação de páginas (voltar)
  const [habilidades, setHabilidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Atualizar Habilidade
  const [atualizarId, setAtualizarId] = useState("");
  const [atualizarNome, setAtualizarNome] = useState("");
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

  // Carrega habilidades ao montar a tela
  useEffect(() => { carregar(); }, []);

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
  }

  // Submete atualização ao backend
  async function aoSubmeterAtualizar(e) {
    e.preventDefault(); // evita reload da página
    if (!atualizarId) return; // não submete sem item selecionado
    setErroAtualizar(""); setMensagemAtualizar("");
    try {
      setAtualizando(true);
      const payload = { nome: atualizarNome.trim() }; // monta payload
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
      setHabilidades(prev => prev.map(h => (Number(h.id) === Number(atualizarId) ? { ...h, nome: payload.nome } : h))); // atualiza item na lista local
    } catch (e) {
      setErroAtualizar(e.message || "Erro ao atualizar habilidade");
    } finally {
      setAtualizando(false);
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
          <Link to="/admin/habilidade" className="text-lg font-medium underline decoration-slate-500 text-slate-300 hover:text-indigo-200">
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

            {/* lista de habilidades */}
            {!carregando && !erro && (
              habilidades.length === 0 ? (
                <p className="text-slate-400">Nenhuma habilidade cadastrada.</p>
              ) : (
                <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
                  {habilidades.map(h => (
                    <li key={h.id ?? h.nome} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{h.nome ?? `Habilidade #${h.id}`}</p>
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
              )
            )}
          </div>

          {/* Painel lateral */}
          <div className="w-full lg:w-96 self-start">

            <div id="painel-atualizar-habilidade" className="bg-slate-950 border border-slate-800 rounded-lg p-5 sticky top-6">
              <h2 className="text-lg font-semibold text-indigo-300 tracking-wide text-center">Atualizar Habilidade</h2>
              <form onSubmit={aoSubmeterAtualizar} className="mt-4 space-y-3">
                <div>
                  <label className="block text-base text-slate-200 mb-1">Selecionar habilidade</label>
                  <select value={atualizarId} onChange={aoSelecionarAtualizar} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200">
                    <option value="">Selecione...</option>
                    {habilidades.map(h => (
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

