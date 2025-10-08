import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar

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

				{/* BOTÃO VOLTAR */}
				<button
					onClick={() => navigate("/homeAdmin")}
					className="mt-6 mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
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

