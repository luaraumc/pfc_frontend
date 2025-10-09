import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e redirecionamento | fetch autenticado com renovação automática de token

// Página de cadastramento de vagas
export default function Vaga() {

	const navigate = useNavigate(); // navegação de páginas (voltar)

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
			<main className="max-w-6xl mx-auto px-4 py-5">

				{/* BOTÃO VOLTAR */}
				<button
					onClick={() => navigate(-1)}
					className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
				>
					<span aria-hidden>←</span> Voltar
				</button>

				{/* título */}
				<h1 className="text-3xl font-bold text-slate-100 text-center">Página de vagas</h1>

				{/* descrição */}
				<p className="mt-2 text-slate-300 text-center">Página de vagas</p>
			</main>
		</div>
	);
}

