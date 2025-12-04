import { Link } from "react-router-dom";
import logoRumoTechno from "../../images/rumotechno-logo.svg";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pt-16">
      {/* HEADER (mesmo padrão da Home) */}
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200">
            <img src={logoRumoTechno} alt="RumoTechno" className="h-8 w-auto transition-transform duration-200 ease-out hover:scale-103" />
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

      <main className="max-w-3xl mx-auto px-4 py-10 leading-relaxed">
        <h1 className="text-3xl font-bold text-slate-100 mb-2 text-center">Política de Privacidade</h1>
        <p className="text-sm text-slate-400 mb-2 text-center">v1.0</p>
        <p className="text-sm text-slate-400 mb-6 text-center">Última atualização: 5 de novembro de 2025</p>

        <section className="mb-8">
          <p className="text-slate-300">
            Valorizamos sua privacidade. Aqui explicamos de forma direta como coletamos, usamos,
            compartilhamos e protegemos seus dados pessoais ao utilizar nossos serviços, em
            conformidade com a Lei Geral de Proteção de Dados Pessoais.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">1. Quem somos</h2>
          <p className="mt-2 text-slate-300">
            A Rumo Techno é um sistema de apoio à decisão para a escolha de carreira em tecnologia.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">2. Dados pessoais que coletamos</h2>
          <p className="mt-2 text-slate-300">Podemos coletar, conforme seu uso da plataforma:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-300">
            <li>Dados de cadastro: nome, e-mail e senha (armazenada de forma segura).</li>
            <li>Perfil profissional: habilidades técnicas e carreira de interesse.</li>
            <li>Formação acadêmica: curso de bacharelado.</li>
            <li>Dados de navegação: cookies.</li>
          </ul>
          <p className="mt-3 text-slate-300">
            Em regra, não solicitamos dados sensíveis. Se necessário, utilizaremos base legal adequada
            e comunicaremos com transparência.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">3. Como utilizamos seus dados</h2>
          <p className="mt-2 text-slate-300">Usamos seus dados para:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-300">
            <li>Executar e melhorar nossos serviços.</li>
            <li>Gerenciar sua conta e perfil.</li>
            <li>Realizar análises e métricas.</li>
            <li>Personalizar experiência e recomendações.</li>
            <li>Prevenir fraudes, garantir segurança e cumprir obrigações legais.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">4. Bases legais</h2>
          <p className="mt-2 text-slate-300">
            Utilizamos bases legais previstas na Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">5. Cookies</h2>
          <p className="mt-2 text-slate-300">
            Usamos cookies para funcionamento. Você pode gerenciá-los no seu navegador (a desativação pode afetar funcionalidades).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">6. Compartilhamento de dados</h2>
          <p className="mt-2 text-slate-300">
            Compartilhamos dados com provedores para viabilizar o serviço, sempre com salvaguardas adequadas.
            Também podemos compartilhar para cumprir obrigações legais e proteger direitos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">7. Retenção e descarte</h2>
          <p className="mt-2 text-slate-300">
            Guardamos os dados pelo tempo necessário às finalidades e exigências legais. Depois, realizamos
            descarte seguro ou anonimização, quando aplicável.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">8. Segurança da informação</h2>
          <p className="mt-2 text-slate-300">
            Adotamos medidas técnicas e administrativas para proteger seus dados.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">9. Seus direitos</h2>
          <p className="mt-2 text-slate-300">
            Você pode solicitar: confirmação e acesso; correção; anonimização; eliminação de dados 
            tratados com consentimento; informações sobre compartilhamento; e revogar consentimento. 
            Para exercer qualquer um desses direitos, entre em contato pelo e-mail{" "}
            <a href="mailto:adm.rumotechno@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline">adm.rumotechno@gmail.com</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">10. Sites e serviços de terceiros</h2>
          <p className="mt-2 text-slate-300">
            Podemos oferecer links para sites de terceiros. Eles têm suas próprias políticas de privacidade;
            recomendamos a leitura antes de usá-los.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">11. Alterações desta política</h2>
          <p className="mt-2 text-slate-300">
            Podemos atualizar esta política para refletir mudanças legais ou operacionais. A versão vigente
            é a mais recente e traz a data no topo desta página.
          </p>
        </section>

      </main>

      {/* FOOTER (mesmo padrão da Home) */}
      <footer className="w-full px-4 sm:px-6 md:px-8 py-10 bg-slate-950 border-t border-slate-800 text-slate-400 text-center">
        <p>© 2025 RumoTechno. Todos os direitos reservados.</p>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <Link to="/privacidade" className="hover:text-slate-200 transition">Política de Privacidade</Link>
          <Link to="/termos" className="hover:text-slate-200 transition">Termos de Uso</Link>
        </div>
      </footer>
    </div>
  );
}
