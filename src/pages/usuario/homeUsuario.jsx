import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário
import { useEffect, useState } from "react"; // useEffect: executar funções | useState: gerenciar estado de componentes
import { logoutRedirecionar } from "../../utils/auth"; // logout e redirecionamento

// Página inicial do usuário comum
export default function HomeUsuario() {
	const [nome, setNome] = useState(""); // constante para armazenar o nome do usuário
	useEffect(() => {
		const n = localStorage.getItem("usuario_nome") || ""; // obtém o nome do localStorage ou string vazia
		setNome(n); // atualiza o estado com o nome obtido
	}, []);
    // HTML
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">
			<header className="w-full border-b border-slate-800 bg-slate-950/80">
				<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
					<Link to="/" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
						PFC
					</Link>
						<button
							onClick={logoutRedirecionar}
						    className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">
						    Sair
					    </button>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-4 py-10">
				<h1 className="text-2xl font-semibold">Olá{nome ? `, ${nome}` : ''}!</h1>
				<p className="mt-2 text-slate-300">Bem-vindo à sua Home de usuário.</p>
			</main>
		</div>
	);
}

