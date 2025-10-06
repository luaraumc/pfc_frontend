import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário

export default function Home() {
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
				<h1 className="text-3xl font-bold text-slate-100 text-center">Página de vagas</h1>
				<p className="mt-2 text-slate-300 text-center">Página de vagas</p>
			</main>
		</div>
	);
}

