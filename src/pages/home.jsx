import { Link } from "react-router-dom"; // criar links de navegação para redirecionar o usuário
import { useEffect } from "react"; // useEffect: executar funções
import { useNavigate } from "react-router-dom"; // navegação programática
import { getAccessToken, VerificarTokenExpirado, refreshAccessToken, authFetch, transformarJwt } from '../utils/auth'; // funções de autenticação

// Imagens locais dentro de src/imagens (ajuste para ../images se sua pasta for "images")
import coletaIcon from '../../images/icon-coleta-vagas.png';
import compareIcon from '../../images/compare.png';
import recomendationIcon from '../../images/recomendation.png';
// Nova ilustração do header
import headerIllustration from '../../images/ilustracao-header.svg';

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página inicial pública
export default function Home() {
	const navigate = useNavigate(); // navegação programática

	// Se o usuário já está autenticado, redireciona para a home apropriada
	useEffect(() => {
		let cancel = false;
		async function checarTokenERedirecionar() {
			const token = getAccessToken();
			if (!token) return; // não autenticado
			try {
				let usableToken = token;
				if (VerificarTokenExpirado(token)) {
					await refreshAccessToken();
					usableToken = getAccessToken();
					if (!usableToken) return;
				}
				// tenta inferir perfil a partir do localStorage ou buscando o usuário
				const storedIsAdmin = localStorage.getItem('is_admin');
				if (storedIsAdmin === 'true' || storedIsAdmin === 'false') {
					if (!cancel) navigate(storedIsAdmin === 'true' ? '/homeAdmin' : '/homeUsuario', { replace: true });
					return;
				}
				// se não houver a flag, decodifica token e busca dados do usuário
				const decoded = transformarJwt(usableToken);
				const userId = decoded?.sub ? Number(decoded.sub) : null;
				if (!userId) return;
				const res = await authFetch(`${API_URL}/usuario/${userId}`);
				if (!res.ok) return;
				const user = await res.json().catch(() => ({}));
				const isAdmin = !!user?.admin;
				localStorage.setItem('is_admin', String(isAdmin));
				if (user?.nome) localStorage.setItem('usuario_nome', String(user.nome));
				if (!cancel) navigate(isAdmin ? '/homeAdmin' : '/homeUsuario', { replace: true });
			} catch (e) {
				// se houver falha na renovação, não redireciona e deixa a página pública
				try { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); } catch {}
			}
		}
		checarTokenERedirecionar();
		return () => { cancel = true; };
	}, [API_URL, navigate]);

	// HTML
	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">

			{/* HEADER */}
			<header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
				<div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
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
							className="px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
						>
							Cadastre-se
						</Link>
					</div>
				</div>
			</header>

			{/* CONTEÚDO PRINCIPAL */}
			<main className="w-full">
				{/* hero padronizado com tema escuro em largura total */}
				<section
					id="inicio"
					className="relative overflow-hidden bg-slate-950/60 px-4 sm:px-6 md:px-8 py-16"
				>
					<div className="mx-auto max-w-6xl">
						<div className="grid md:grid-cols-2 items-center gap-10">
							<div className="text-center md:text-left">
								<h1 className="text-4xl md:text-5xl font-bold leading-tight text-slate-100">
									Descubra sua compatibilidade com o mercado — e a faculdade certa para chegar lá.
								</h1>
								<p className="mt-6 text-lg text-slate-400">
									Saiba exatamente quais habilidades te aproximam da carreira dos seus sonhos,
									com base em dados reais do mercado e da educação.
								</p>
								<div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
									<Link
										to="/cadastro"
										className="px-5 py-2.5 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
									>
										Cadastrar agora
									</Link>
									<Link
										to="/login"
										className="px-5 py-2.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
									>
										Entrar na plataforma
									</Link>
								</div>
							</div>
							<div className="flex justify-center md:justify-end">
								<img
									src={headerIllustration}
									alt="Ilustração representando carreira e educação"
									className="w-full max-w-md md:max-w-lg h-auto object-contain drop-shadow-sm"
									loading="lazy"
									onError={(e) => { e.currentTarget.style.display = 'none'; }}
								/>
							</div>
						</div>
					</div>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-600/10 via-slate-900/0 to-slate-900/30"
					/>
				</section>

				{/* ===== COMO FUNCIONA ===== */}
				<section id="sobre" className="relative bg-slate-900/40 px-4 sm:px-6 md:px-8 py-16">
					<div className="max-w-5xl mx-auto text-center">
						<h2 className="text-3xl font-bold text-slate-100 mb-6">
							Entenda o que o mercado espera de você.
						</h2>
						<p className="text-slate-400 leading-relaxed mb-4">
							Nosso sistema analisa centenas de vagas reais em plataformas como LinkedIn, Indeed e Catho
							para identificar as habilidades mais requisitadas em cada carreira.
						</p>
						<p className="text-slate-400 leading-relaxed">
							Depois, compara essas habilidades com as que você já possui — revelando o quanto está pronto
							para o mercado e o que ainda precisa desenvolver. Também cruzamos essas informações com as diretrizes
							curriculares do MEC e as disciplinas das principais faculdades, mostrando quais cursos mais
							contribuem para o seu crescimento profissional.
						</p>

						{/* Cards com alternância de cores */}
						<div className="grid md:grid-cols-3 gap-6 mt-12">
							<div className="rounded-md border border-slate-800 odd:bg-slate-900/40 even:bg-slate-950/40 hover:bg-slate-800/40 transition p-6">
								<h3 className="text-lg font-semibold text-slate-100 mb-2">Coleta de Vagas</h3>
								<img src={coletaIcon} alt="Ícone de coleta de vagas" className="mx-auto mb-3 h-12 w-12 object-contain" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
								<p className="text-slate-400">
									Buscamos dados em plataformas reais como LinkedIn, Indeed e Catho.
								</p>
							</div>
							<div className="rounded-md border border-slate-800 odd:bg-slate-900/40 even:bg-slate-950/40 hover:bg-slate-800/40 transition p-6">
								<h3 className="text-lg font-semibold text-slate-100 mb-2">Comparação Inteligente</h3>
								<img src={compareIcon} alt="Ícone de comparação inteligente" className="mx-auto mb-3 h-12 w-12 object-contain" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
								<p className="text-slate-400">
									Comparamos as habilidades do mercado com as suas, em tempo real.
								</p>
							</div>
							<div className="rounded-md border border-slate-800 odd:bg-slate-900/40 even:bg-slate-950/40 hover:bg-slate-800/40 transition p-6">
								<h3 className="text-lg font-semibold text-slate-100 mb-2 ">Recomendação de Faculdades</h3>
								<img
									src={recomendationIcon}
									alt="Ícone de recomendação de faculdades"
									className="mx-auto mb-3 h-12 w-12 object-contain"
									loading="lazy"
									onError={(e) => { e.currentTarget.style.display = 'none'; }}
								/>
								<p className="text-slate-400">
									Recomendamos cursos e instituições alinhados às competências que faltam para seu objetivo.
								</p>
							</div>
						</div>
					</div>
				</section>
				{/* ===== CTA ===== */}
				<section className="relative overflow-hidden bg-slate-950/60 px-4 sm:px-6 md:px-8 py-16 text-center">
					<div className="max-w-4xl mx-auto">
						<h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-100">
							Pronto para começar?
						</h2>
						<p className="text-lg leading-relaxed mb-8 text-slate-400">
							Descubra seu potencial, identifique suas lacunas e escolha a faculdade que vai te levar mais longe.
							<br />O primeiro passo para sua evolução profissional começa agora.
						</p>
						<div className="flex flex-wrap justify-center gap-4">
							<Link
								to="/cadastro"
								className="px-5 py-2.5 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
							>
								Cadastrar agora
							</Link>
							<Link
								to="/login"
								className="px-5 py-2.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
							>
								Entrar na plataforma
							</Link>
						</div>
					</div>
				</section>
				{/* ===== FOOTER ===== */}
				<footer className="w-full px-4 sm:px-6 md:px-8 py-10 bg-slate-950 border-t border-slate-800 text-slate-400 text-center">
					<p>© 2025 RumoTechno. Todos os direitos reservados.</p>
					<div className="mt-4 flex justify-center gap-6 text-sm">
						<Link to="/privacidade" className="hover:text-slate-200 transition">Política de Privacidade</Link>
					</div>
				</footer>
			</main>
			
		</div>
	);
}
