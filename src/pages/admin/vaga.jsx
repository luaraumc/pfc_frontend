import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar

export default function Home() {
	const navigate = useNavigate();
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">
			<header className="w-full border-b border-slate-800 bg-slate-950/80">
				<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
					<Link to="/" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
						PFC
					</Link>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-4 py-10">
				{/* Ação: voltar à página anterior */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                    <span aria-hidden>←</span> Voltar
                </button>
				<h1 className="text-3xl font-bold text-slate-100 text-center">Página de vagas</h1>
				<p className="mt-2 text-slate-300 text-center">Página de vagas</p>
			</main>
		</div>
	);
}

