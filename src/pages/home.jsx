import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário

export default function Home() {
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">
			<header className="w-full border-b border-slate-800 bg-slate-950/80">
				<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
					<Link to="/" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
						PFC
					</Link>
					<div className="flex items-center gap-3">
						<Link
							to="/login"
							className="px-4 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
						>
							Entrar
						</Link>
						<Link
							to="/cadastro"
							className="px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600"
						>
							Cadastre-se
						</Link>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-4 py-10">
				<h1 className="text-3xl font-bold text-slate-100">Bem-vindo</h1>
				<p className="mt-2 text-slate-300">Esta é a página inicial.</p>
			</main>
		</div>
	);
}

