import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário
import { useEffect, useState } from "react"; // useEffect: executar funções | useState: gerenciar estado de componentes
import { logoutRedirecionar } from "../../utils/auth"; // logout e redirecionamento
import perfilIcon from "../../../images/perfil.png"; // ícone de perfil

// Página inicial do usuário comum
export default function HomeUsuario() {

	const [nome, setNome] = useState(""); // armazena o nome do usuário

	useEffect(() => {
		const n = localStorage.getItem("usuario_nome") || ""; // obtém o nome do localStorage ou string vazia
		setNome(n);
	}, []);

    // HTML
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">

			{/* HEADER */}
			<header className="w-full border-b border-slate-800 bg-slate-950/80">
				<div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
					<Link to="/homeUsuario" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
						PFC
					</Link>
					<div className="flex items-center gap-3">
					<Link
						to="/usuario/editar-perfil"
						className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
					>
						<img src={perfilIcon} alt="Perfil" className="w-5 h-5" />
						<span>Editar Perfil</span>
					</Link>
					<button
						onClick={logoutRedirecionar}
						className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">
						Sair
					
					</button>
					</div>
				</div>
			</header>

			{/* CONTEÚDO PRINCIPAL */}
			<main className="max-w-6xl mx-auto px-4 py-10">

				{/* título */}
				<h1 className="text-2xl font-semibold text-center">Olá{nome ? `, ${nome}` : ''}!</h1>

				{/* descrição */}
				<p className="mt-2 text-slate-300 text-center">Bem-vindo à sua Home de usuário.</p>
			</main>
		</div>
	);
}

