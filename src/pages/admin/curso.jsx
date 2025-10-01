import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useState } from "react"; // estados e efeitos
import { logoutRedirecionar } from "../../utils/auth"; // logout e redirecionamento
import { authFetch } from "../../utils/auth"; // fetch autenticado
import trashIcon from "../../../images/lixeira.png"; // ícone de lixeira

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function AdminCurso() {
    const navigate = useNavigate(); // navegação de páginas (voltar)
    const [cursos, setCursos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

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

    async function deletarCurso(id, nome) {
        setErro("");
        setMensagem("");
        const confirmar = window.confirm(`Tem certeza que deseja excluir o curso "${nome ?? id}"? Esta ação não pode ser desfeita.`);
        if (!confirmar) return;
        try {
            const res = await authFetch(`${API_URL}/curso/deletar/${id}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.detail || data?.message || `Falha ao excluir (HTTP ${res.status})`;
                throw new Error(msg);
            }
            setCursos((prev) => prev.filter((c) => c.id !== id));
            setMensagem(data?.message || "Curso deletado com sucesso.");
        } catch (e) {
            setErro(e.message ?? "Erro ao deletar curso");
        }
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
                <h1 className="text-2xl font-semibold text-center">Gerenciar Cursos</h1>
                <div className="mt-6 ml-130 mr-130">
                    {carregando && (
                        <p className="text-slate-400">Carregando cursos…</p>
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
                        cursos.length === 0 ? (
                            <p className="text-slate-400">Nenhum curso cadastrado.</p>
                        ) : (
                            <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
                                {cursos.map((c) => (
                                    <li key={c.id ?? c.nome} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{c.nome ?? `Curso #${c.id}`}</p>
                                            {c.descricao && (
                                                <p className="text-sm text-slate-400">{c.descricao}</p>
                                            )}
                                        </div>
                                        {c.id && (
                                            <button
                                                onClick={() => deletarCurso(c.id, c.nome)}
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
            </main>
        </div>
    );
}
