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
            <h1 className="text-2xl font-semibold">Home do Administrador</h1>
            <p className="mt-2 text-slate-300">Gerencie usuários, vagas e configurações.</p>
        </main>
        </div>
    );
}
