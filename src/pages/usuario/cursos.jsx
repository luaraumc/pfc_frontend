import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { logoutRedirecionar } from "../../utils/auth";
import logoRumoTechno from "../../../images/rumotechno-logo.svg";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Estilos CSS em JS para o efeito flip card
const flipCardStyles = `
.perspective-1000 {
	perspective: 1000px;
}

.transform-style-preserve-3d {
	transform-style: preserve-3d;
}

.backface-hidden {
	backface-visibility: hidden;
}

.rotate-y-180 {
	transform: rotateY(180deg);
}
`;

// Injeta os estilos no documento
if (typeof window !== 'undefined') {
	const styleElement = document.createElement('style');
	styleElement.textContent = flipCardStyles;
	if (!document.head.querySelector('[data-flip-card-styles]')) {
		styleElement.setAttribute('data-flip-card-styles', 'true');
		document.head.appendChild(styleElement);
	}
}

export default function Cursos() {
	const [cursos, setCursos] = useState([]);
	const [mapeamento, setMapeamento] = useState(null);
	const [loading, setLoading] = useState(true);
	const [erro, setErro] = useState("");
	const [cursosFlippados, setCursosFlippados] = useState(new Set());

	// Função para scroll suave para o topo
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	// Carrega cursos e mapeamento
	useEffect(() => {
		async function carregarDados() {
			try {
				setLoading(true);

				// Carrega lista de cursos
				const resCursos = await fetch(`${API_URL}/curso/`);
				if (!resCursos.ok) throw new Error("Falha ao carregar cursos");
				const dadosCursos = await resCursos.json();
				setCursos(dadosCursos);

				// Carrega mapeamento curso x carreira
				const resMapeamento = await fetch(`${API_URL}/mapa/`);
				if (!resMapeamento.ok) throw new Error("Falha ao carregar mapeamento");
				const dadosMapeamento = await resMapeamento.json();
				setMapeamento(dadosMapeamento);



			} catch (error) {
				console.error("Erro ao carregar dados:", error);
				setErro(error.message || "Erro ao carregar dados");
			} finally {
				setLoading(false);
			}
		}

		carregarDados();
	}, []);



	// Handle click no card do curso
	const handleCursoClick = (curso) => {
		setCursosFlippados(prev => {
			const newSet = new Set(prev);
			if (newSet.has(curso.id)) {
				newSet.delete(curso.id); // Remove se já estiver flippado
			} else {
				newSet.add(curso.id); // Adiciona ao conjunto de flippados
			}
			return newSet;
		});
	};

	// Obtém as top carreiras para um curso
	const getTopCarreirasPorCurso = (cursoId) => {
		if (!mapeamento?.cursoToCarreiras?.[cursoId]) return [];
		return mapeamento.cursoToCarreiras[cursoId].slice(0, 3); // Top 3
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
				<div className="text-center">
					<div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
					<p>Carregando cursos...</p>
				</div>
			</div>
		);
	}

	if (erro) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
				<div className="text-center">
					<p className="text-red-400 mb-4">{erro}</p>
					<button 
						onClick={() => window.location.reload()} 
						className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
					>
						Tentar novamente
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-900 text-slate-200 pt-16">
            {/* HEADER */}
            <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
                <div className="w-90% ml-10 mr-10 px-4 h-16 flex items-center justify-between">
                    <a
                        href="#topo"
                        onClick={scrollToTop}
                        className="text-xl font-semibold text-indigo-300 hover:text-indigo-200"
                        aria-label="Voltar ao topo"
                    >
                        <img
                            src={logoRumoTechno}
                            alt="RumoTechno"
                            className="h-8 w-auto transition-transform duration-200 ease-out hover:scale-103"
                        />
                    </a>
                    <a className="text-lg font-medium text-white hover:text-indigo-200" href="/homeUsuario" data-discover="true">Meu Progresso</a>
                    <a className="text-lg font-medium text-indigo-200" href="/usuario/cursos" data-discover="true">Cursos</a>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/usuario/editar-perfil"
                            className="px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
                        >
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

			{/* CONTENT */}
			<main className="container mx-auto px-6 py-8 max-w-6xl">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-white mb-2 text-center">Explore os Cursos</h1>
					<p className="text-slate-400 text-center">
						Descubra os conhecimentos que cada curso oferece e as carreiras mais compatíveis.
					</p>
				</div>

				{cursos.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-slate-400">Nenhum curso encontrado.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
						{cursos.map((curso) => {
							const isFlipped = cursosFlippados.has(curso.id);
							const topCarreiras = getTopCarreirasPorCurso(curso.id);

							return (
								<div key={curso.id} className="group h-64">
									{/* Container do Card com perspectiva para o efeito 3D */}
									<div className="relative w-full h-full perspective-1000">
										<div 
											onClick={() => handleCursoClick(curso)}
											className={`
												relative w-full h-full cursor-pointer transition-all duration-700 transform-style-preserve-3d
												${isFlipped ? 'rotate-y-180' : ''}
											`}
											style={{ transformStyle: 'preserve-3d' }}
										>
											{/* Face Frontal do Card */}
											<div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-slate-950/60 to-slate-900/40 border border-slate-700 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 rounded-lg transition-all duration-300 flex flex-col">
												{/* Header com ícone */}
												<div className="flex items-center justify-between p-5 pb-3">
													<div className="flex items-center">
														<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mr-3">
															<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
															</svg>
														</div>
														<div>
															<div className="text-xs font-medium text-indigo-400 uppercase tracking-wide">Bacharel</div>
														</div>
													</div>
													<div className="transform transition-transform duration-300 group-hover:rotate-12">
														<svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
														</svg>
													</div>
												</div>

												{/* Conteúdo Principal */}
												<div className="flex-1 px-5 py-2">
													<h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-3 leading-tight">
														{curso.nome}
													</h3>

													{curso.descricao && (
														<p className="text-slate-300 text-sm leading-relaxed line-clamp-4">
															{curso.descricao}
														</p>
													)}
												</div>

												{/* Footer com CTA */}
												<div className="p-5 pt-3 border-t border-slate-800/50">
													<div className="flex items-center justify-between">
														<div className="flex items-center text-sm text-slate-400 group-hover:text-indigo-400 transition-colors">
															<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
															</svg>
															<span className="font-medium">Ver carreiras compatíveis</span>
														</div>
														<div className="flex items-center text-xs text-slate-500">
															<span>Clique aqui</span>
															<svg className="w-3 h-3 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
															</svg>
														</div>
													</div>
												</div>
											</div>

											{/* Face Traseira do Card */}
											<div 
												className="absolute inset-0 w-full h-full backface-hidden bg-slate-800/80 border border-indigo-500 shadow-lg shadow-indigo-500/20 rounded-lg p-5"
												style={{ transform: 'rotateY(180deg)' }}
											>
												<div className="h-full flex flex-col">
													<div className="flex items-center justify-between mb-3">
														<h4 className="text-base font-semibold text-white flex items-center">
															<svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
															</svg>
															Top Carreiras Compatíveis
														</h4>
														<div className="transform transition-transform duration-300">
															<svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
														</div>
													</div>

													<div className="flex-1">
														{topCarreiras.length > 0 ? (
															<div className="space-y-1.5">
																{topCarreiras.slice(0, 3).map((carreira, index) => (
																	<div 
																		key={carreira.id}
																		className="flex items-center justify-between p-2 bg-slate-950/50 rounded border border-slate-700 hover:border-slate-600 transition-colors"
																	>
																		<div className="flex items-start min-w-0">
																			<div className={`
																				w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3
																				${index === 0 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' :
																				  index === 1 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' :
																				  index === 2 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' :
																				  'bg-slate-700 text-slate-300'}
																			`}>
																				{index + 1}
																			</div>
																			<span className="text-slate-200 font-medium text-sm break-words whitespace-normal leading-snug pr-1">
																				{carreira.nome}
																			</span>
																		</div>
																	</div>
																))}
																{topCarreiras.length > 3 && (
																	<div className="text-center text-xs text-slate-500">
																		+{topCarreiras.length - 3} mais carreiras...
																	</div>
																)}
															</div>
														) : (
															<p className="text-slate-400 text-sm text-center">Nenhuma carreira compatível encontrada.</p>
														)}
													</div>

													<div className="mt-3 text-center">
														<span className="text-xs text-slate-500">Clique novamente para voltar</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</main>
		</div>
	);
}