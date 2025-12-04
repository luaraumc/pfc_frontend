import { Link } from "react-router-dom";
import logoRumoTechno from "../../images/rumotechno-logo.svg";

export default function Termos() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pt-16">
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
        <h1 className="text-3xl font-bold text-slate-100 mb-4 text-center">Termos de Uso</h1>
        <p className="text-sm text-slate-400 mb-6 text-center">Última atualização: 5 de novembro de 2025</p>

        <section className="mb-8">
          <p className="text-slate-300">
            Estes Termos de Uso regulam o uso da plataforma RumoTechno. Ao utilizar nossos serviços, você concorda com as regras e condições abaixo.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">1. Acesso e Conta</h2>
          <p className="mt-2 text-slate-300">
            Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas na sua conta.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">2. Uso Aceitável</h2>
          <p className="mt-2 text-slate-300">
            Não utilize a plataforma para fins ilegais, maliciosos ou que violem direitos de terceiros.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">3. Conteúdo e Propriedade</h2>
          <p className="mt-2 text-slate-300">
            O conteúdo da plataforma é protegido. O uso deve respeitar as regras e limites de propriedade intelectual.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">4. Limitações e Responsabilidades</h2>
          <p className="mt-2 text-slate-300">
            A plataforma é oferecida "como está". Nos esforçamos para disponibilidade e segurança, mas não garantimos ausência de falhas.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100">5. Alterações</h2>
          <p className="mt-2 text-slate-300">
            Podemos atualizar estes termos para refletir mudanças legais ou operacionais. A versão vigente é a mais recente.
          </p>
        </section>
      </main>

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
