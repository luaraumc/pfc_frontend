import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário
import { logoutRedirecionar } from "../../utils/auth"; // logout e redirecionamento

// Página inicial do usuário administrador
export default function HomeAdmin() {
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

        <main className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-semibold text-center">Home do Administrador</h1>
            <p className="mt-2 text-slate-300 text-center">Gerencie carreiras, habilidades, vagas, cursos e conhecimentos.</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Link
                    to="/admin/carreira"
                    className="block rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-900 p-6 text-slate-200 shadow-sm"
                >
                    <h2 className="text-xl font-medium">Gerenciar Carreiras</h2>
                    <p className="mt-1 text-slate-400 text-sm">Cadastre, edite e remova carreiras.</p>
                </Link>

                <Link
                    to="/admin/curso"
                    className="block rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-900 p-6 text-slate-200 shadow-sm"
                >
                    <h2 className="text-xl font-medium">Gerenciar Cursos</h2>
                    <p className="mt-1 text-slate-400 text-sm">Cadastre, edite e remova cursos.</p>
                    <p className="mt-1 text-slate-400 text-sm">Cadastre, edite e remova conhecimentos.</p>
                </Link>

                <Link
                    to="/admin/vaga"
                    className="block rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-900 p-6 text-slate-200 shadow-sm"
                >
                    <h2 className="text-xl font-medium">Gerenciar Vagas</h2>
                    <p className="mt-1 text-slate-400 text-sm">Cadastre vagas para extrair habilidades.</p>
                </Link>
            </div>
            
        </main>
        </div>
    );
}
