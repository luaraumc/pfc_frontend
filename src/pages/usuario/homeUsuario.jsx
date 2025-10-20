import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário
import { useEffect, useState } from "react"; // useEffect: executar funções | useState: gerenciar estado de componentes
import { logoutRedirecionar, authFetch } from "../../utils/auth"; // logout e chamadas autenticadas
import perfilIcon from "../../../images/perfil.png"; // ícone de perfil

// Página inicial do usuário comum
export default function HomeUsuario() {

	const [nome, setNome] = useState(""); // armazena o nome do usuário
	const [topCarreiras, setTopCarreiras] = useState([]);
	const [loadingCompat, setLoadingCompat] = useState(true);
	const [erroCompat, setErroCompat] = useState("");
	const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	useEffect(() => {
		const n = localStorage.getItem("usuario_nome") || ""; // obtém o nome do localStorage ou string vazia
		setNome(n);

		// Busca todas as carreiras por compatibilidade para o usuário logado
		(async () => {
			try {
				const usuarioId = localStorage.getItem('usuario_id');
				if (!usuarioId) {
					setErroCompat("Usuário não identificado. Faça login novamente.");
					setLoadingCompat(false);
					return;
				}
				const res = await authFetch(`${API_URL}/usuario/${usuarioId}/compatibilidade/top`);
				if (!res.ok) {
					throw new Error(`Erro ${res.status}`);
				}
				const data = await res.json();
				setTopCarreiras(Array.isArray(data) ? data : []);
			} catch (e) {
				setErroCompat("Não foi possível carregar sua compatibilidade agora.");
			} finally {
				setLoadingCompat(false);
			}
		})();

	}, []);

	function ProgressBar({ value }) {
		const pct = Math.max(0, Math.min(100, Number(value) || 0));
		return (
			<div className="w-full bg-slate-800 rounded h-3 overflow-hidden border border-slate-700">
				<div
					className="h-3 bg-gradient-to-r from-indigo-500 to-cyan-400"
					style={{ width: `${pct}%` }}
				/>
			</div>
		);
	}

    // HTML
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">

			{/* HEADER */}
			<header className="w-full border-b border-slate-800 bg-slate-950/80">
				<div className="w-90% ml-10 mr-10 px-4 h-16 flex items-center justify-between">
					<Link to="/homeUsuario" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
						Home
					</Link>
					<div className="flex items-center gap-3">
					<Link
	                    to="/usuario/cadastro-habilidade"
	                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
	                >
	                    Cadastrar Habilidade
	                </Link>
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

				{/* Compatibilidade com Carreiras */}
				<section className="mt-10">
					<h2 className="text-xl font-medium mb-4">Suas carreiras mais compatíveis</h2>
					<div className="space-y-4">
						{loadingCompat && (
							<p className="text-slate-400">Carregando sua compatibilidade...</p>
						)}
						{!loadingCompat && erroCompat && (
							<p className="text-rose-300">{erroCompat}</p>
						)}
						{!loadingCompat && !erroCompat && topCarreiras.length === 0 && (
							<div className="text-slate-300">
								<p>Nenhuma carreira encontrada ainda.</p>
								<p className="mt-1">Dica: cadastre suas habilidades para ver sua compatibilidade!</p>
								<div className="mt-3">
									<Link to="/usuario/cadastro-habilidade" className="text-indigo-300 underline">Cadastrar habilidades</Link>
								</div>
							</div>
						)}
						{!loadingCompat && !erroCompat && topCarreiras.map((item, idx) => (
							<div key={`${item.carreira_id}-${idx}`} className="p-4 rounded border border-slate-800 bg-slate-950/50">
								<div className="flex items-center justify-between mb-2">
									<div className="font-medium">{item.carreira_nome ?? 'Carreira'}</div>
									<div className="text-slate-300 text-sm">{item.percentual}%</div>
								</div>
								<ProgressBar value={item.percentual} />
								<div className="mt-2 text-slate-400 text-sm">
									<span>Compatibilidade ponderada pelas habilidades mais relevantes da carreira.</span>
								</div>
								{Array.isArray(item.habilidades_cobertas) && item.habilidades_cobertas.length > 0 && (
									<div className="mt-2 text-slate-300 text-sm">
										<strong>Suas habilidades que contam aqui:</strong> {item.habilidades_cobertas.join(', ')}
									</div>
								)}
							</div>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}
