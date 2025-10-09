import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário
import { logoutRedirecionar } from "../../utils/auth"; // logout e redirecionamento

// Página inicial do usuário administrador
export default function HomeAdmin() {

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
            <main className="max-w-6xl mx-auto px-4 py-10">

                {/* título */}
                <h1 className="text-2xl font-semibold text-center">Home do Administrador</h1>

                {/* descrição */}
                <p className="mt-2 text-slate-300 text-center">Gerencie carreiras, habilidades, vagas, cursos e conhecimentos.</p>

                {/* links para páginas de gerenciamento */}
                <div className="mt-8 ml-60 mr-60 grid grid-cols-1 sm:grid-cols-1 gap-6">

                    {/* carreiras */}
                    <Link
                        to="/admin/carreira"
                        className="block rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-900 p-6 text-slate-200 shadow-sm"
                    >
                        <h2 className="text-xl font-medium">Gerenciar Carreiras</h2>
                        <p className="mt-1 text-slate-400 text-sm">Cadastre, edite e remova carreiras.</p>
                    </Link>

                    {/* cursos */}
                    <Link
                        to="/admin/curso"
                        className="block rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-900 p-6 text-slate-200 shadow-sm"
                    >
                        <h2 className="text-xl font-medium">Gerenciar Cursos</h2>
                        <p className="mt-1 text-slate-400 text-sm">Cadastre, edite e remova cursos e conhecimentos.</p>
                    </Link>

                    {/* vagas */}
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
