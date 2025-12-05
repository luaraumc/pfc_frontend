import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useMemo, useState } from "react"; // estados e efeitos
import { authFetch } from "../../utils/auth"; // fetch autenticado com renovação automática de token
import { logoutRedirecionar } from "../../utils/auth"; // logout e redirecionamento
import perfilIcon from "../../../images/perfil.png"; // ícone de perfil
import logoRumoTechno from "../../../images/rumotechno-logo.svg"; // logotipo do site

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Página de edição de perfil
export default function EditarPerfil() {

	// Estados dos campos
	const navigate = useNavigate() // navegação de páginas (voltar)
	const [nome, setNome] = useState('')
	const [usuarioEmail, setUsuarioEmail] = useState('')
	const [carreiraId, setCarreiraId] = useState('')
	const [cursoId, setCursoId] = useState('')
	const [carreiras, setCarreiras] = useState([])
	const [cursos, setCursos] = useState([])
	const [loadingListas, setLoadingListas] = useState(true)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [message, setMessage] = useState(null)
	const [error, setError] = useState(null)
    const [secao, setSecao] = useState('dados') // 'dados' | 'senha' | 'excluir'

	// Alterar senha
	const [senha, setSenha] = useState("");
	const [codigoSenha, setCodigoSenha] = useState('')
	const [novaSenha, setNovaSenha] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showNova, setShowNova] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [senhaMsg, setSenhaMsg] = useState(null)
	const [senhaErr, setSenhaErr] = useState(null)
	const [senhaLoading, setSenhaLoading] = useState(false)

	// Deletar conta
	const [codigoExclusao, setCodigoExclusao] = useState('')
	const [excluirMsg, setExcluirMsg] = useState(null)
	const [excluirErr, setExcluirErr] = useState(null)
	const [excluirLoading, setExcluirLoading] = useState(false)
	const [excluirCodigoLoading, setExcluirCodigoLoading] = useState(false)

	// Menu hambúrguer (header responsivo)
	const [menuAberto, setMenuAberto] = useState(false)

	// Requisitos de senha: mínimo 6 caracteres, 1 maiúscula, 1 caractere especial
		const senhaRequisitos = useMemo(() => {
			return {
				len: senha.length >= 6,
				maiuscula: /[A-Z]/.test(senha),
				especial: /[^A-Za-z0-9]/.test(senha),
				semEspacos: !/\s/.test(senha),
			};
		}, [senha]);

		// Requisitos aplicados à nova senha (campo de atualização de senha)
		const novaSenhaRequisitos = useMemo(() => {
			return {
				len: (novaSenha || '').length >= 6,
				maiuscula: /[A-Z]/.test(novaSenha || ''),
				especial: /[^A-Za-z0-9]/.test(novaSenha || ''),
				semEspacos: !/\s/.test(novaSenha || ''),
			};
		}, [novaSenha]);

	// Validação dos campos do formulário
	function validarCampos() {
		if (!nome.trim()) return "Informe o nome";
        if (!email.trim() || !emailValido) return "Informe um e-mail válido.";
        if (!senha) return "Informe a senha";
        if (!senhaRequisitos.semEspacos) return "A senha não pode conter espaços";
        if (!(senhaRequisitos.len && senhaRequisitos.maiuscula && senhaRequisitos.especial)) {
            return "A senha deve conter no mínimo 6 caracteres, 1 letra maiúscula e 1 caractere especial";
        }
        if (!carreiraId) return "Selecione a carreira";
        if (!cursoId) return "Selecione o curso";
        return null;
	}

	// Carrega dados do usuário
	useEffect(() => {
		const usuarioId = localStorage.getItem('usuario_id') // pega id do usuário do localStorage
		if (!usuarioId) { navigate('/login'); return } // se não tiver id, redireciona para login
		let cancelado = false; // evitar atualização de estado após desmontar
		setLoading(true)
		authFetch(`${API_URL}/usuario/${usuarioId}`) // fetch autenticado para buscar usuario pelo id
			// se sucesso, preenche os campos
			.then(async res => {
				if(!res.ok){
					throw new Error('Falha ao carregar usuário')
				}
				const data = await res.json() // converte resposta em JSON
				if(cancelado) return
				setNome(data.nome || '')
				setCarreiraId(data.carreira_id ?? '')
				setCursoId(data.curso_id ?? '')
				// manter nome em localStorage
				localStorage.setItem('usuario_nome', data.nome || '')
				// armazenar o email do usuário em estado (não exibido) para ações que precisam dele
				setUsuarioEmail(data.email || '')
			})
			.catch(err => setError(err.message))
			.finally(()=> setLoading(false))
		return () => { cancelado = true }
	}, [navigate])

	// Carrega listas de carreiras e cursos
	useEffect(()=> {
		const ctrl = new AbortController() // para cancelar fetch se desmontar
		async function carregar(){
			setLoadingListas(true)
			try {
				// chama backend para carreiras e cursos em paralelo
				const [resCarreira, resCurso] = await Promise.all([
					fetch(`${API_URL}/carreira/`, { signal: ctrl.signal }),
					fetch(`${API_URL}/curso/`, { signal: ctrl.signal })
				])
				if(!resCarreira.ok) throw new Error('Falha ao listar carreiras')
				if(!resCurso.ok) throw new Error('Falha ao listar cursos')
				const [carreirasJson, cursosJson] = await Promise.all([
					resCarreira.json(), resCurso.json() // converte resposta em JSON
				])
				setCarreiras(carreirasJson ?? [])
				setCursos(cursosJson ?? [])
			} catch(e){
				console.warn(e)
			} finally { setLoadingListas(false) }
		}
		carregar()
		return () => ctrl.abort()
	}, [])

	// Atualiza os dados do perfil
	async function handleSubmit(e){
		e.preventDefault() // evita reload da página
		setError(null); setMessage(null)
		const usuarioId = localStorage.getItem('usuario_id') // pega id do usuário do localStorage
		if (!usuarioId) { navigate('/login'); return } // se não tiver id, redireciona para login
		setSaving(true) // inicia salvamento
		try {
			// monta o payload (dados a serem enviados)
			const payload = { nome, carreira_id: carreiraId ? Number(carreiraId) : null, curso_id: cursoId ? Number(cursoId) : null }
			// chama backend
			const resp = await authFetch(`${API_URL}/usuario/atualizar/${usuarioId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload) // converte para JSON
			})
			if(!resp.ok){
				const text = await resp.text();
				let friendly = '';
				try {
					const json = JSON.parse(text);
					const detail = json?.detail;
					if (Array.isArray(detail)) {
						const hasCarreira = detail.some(d => d?.type === 'int_type' && Array.isArray(d.loc) && d.loc.includes('carreira_id'));
						const hasCurso = detail.some(d => d?.type === 'int_type' && Array.isArray(d.loc) && d.loc.includes('curso_id'));
						const msgs = [];
						if (hasCarreira) msgs.push('Selecione uma carreira válida.');
						if (hasCurso) msgs.push('Selecione um curso válido.');
						friendly = msgs.join(' ');
						if (!friendly && detail[0]?.msg) friendly = String(detail[0].msg);
					}
				} catch {}
				if (!friendly) friendly = text || `Erro ${resp.status}`;
				setError(friendly);
				return;
			}
			const data = await resp.json().catch(()=> ({})) // converte resposta em JSON, se falhar retorna objeto vazio
			setMessage(data.message || 'Atualizado com sucesso')
			// atualiza localStorage
			localStorage.setItem('usuario_nome', nome)
		} catch(err){
			setError(err?.message || 'Não foi possível atualizar agora.')
		} finally {
			setSaving(false)
		}
	}

	// Solicita código para alterar senha
	async function solicitarCodigoSenha(e){
		e.preventDefault() // evita reload da página
		setSenhaErr(null); setSenhaMsg(null)
		try {
			setSenhaLoading(true)
			if (!usuarioEmail) throw new Error('Email do usuário não disponível')
			// chama backend
			const resp = await fetch(`${API_URL}/usuario/solicitar-codigo/atualizar-senha`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: usuarioEmail }) // converte para JSON
			})
			if(!resp.ok) throw new Error(await resp.text() || 'Erro ao solicitar código')
			const data = await resp.json().catch(()=> ({})) // converte resposta em JSON, se falhar retorna objeto vazio
			setSenhaMsg(data.message || 'Código enviado para o seu e-mail.')
		} catch(err){
			setSenhaErr(err.message)
		} finally { setSenhaLoading(false) }
	}

	// Confirma a nova senha
	async function confirmarNovaSenha(e) {
		e.preventDefault() // evita reload da página
		setSenhaErr(null); setSenhaMsg(null)
		const usuarioId = localStorage.getItem('usuario_id') // pega id do usuário do localStorage
		if (!usuarioId) { navigate('/login'); return } // se não tiver id, redireciona para login
		if (!codigoSenha || String(codigoSenha).trim().length === 0) { setSenhaErr('Informe o código enviado ao seu e-mail.'); return; }
		if (!novaSenha || !confirmPassword) { setSenhaErr('Informe e confirme a nova senha.'); return; }
		if (novaSenha !== confirmPassword) { setSenhaErr('As senhas não coincidem'); return; }
		try {
			setSenhaLoading(true)
			if (!usuarioEmail) throw new Error('Email do usuário não disponível')
			// chama backend
			const resp = await authFetch(`${API_URL}/usuario/atualizar-senha/${usuarioId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: usuarioEmail, codigo: codigoSenha, nova_senha: (novaSenha||'').replace(/\s/g,'') }) // converte para JSON e remove espaços
			})
			if (!resp.ok) {
				const text = await resp.text();
				let msg = '';
				try {
					const json = JSON.parse(text);
					const detail = json?.detail;
					if (typeof detail === 'string') {
						msg = detail;
					} else if (Array.isArray(detail)) {
						// coletar mensagens referentes à nova_senha ou gerais
						const msgs = detail
							.filter(d => d?.msg)
							.map(d => {
								let m = String(d.msg);
								// remover prefixo do campo se presente
								m = m.replace(/^\s*nova_senha\s*:?\s*/i, '');
								return m;
							})
							.filter(Boolean);
						if (msgs.length) msg = msgs.join(' ');
					}
				} catch {}
				if (!msg) msg = text || `Erro ${resp.status}`;
				// normalizações e mensagens mais amigáveis
				if (/c[oó]digo inválido/i.test(msg)) msg = 'Código inválido. Verifique o código enviado ao seu e-mail e tente novamente.';
				if (/c[oó]digo expirado/i.test(msg)) msg = 'Código expirado. Solicite um novo código e tente novamente.';
				if (/mínimo\s*6/i.test(msg)) msg = 'A nova senha deve ter no mínimo 6 caracteres, 1 letra maiúscula e 1 caractere especial.';
				// garante remoção de qualquer prefixo residual
				msg = msg.replace(/^\s*nova_senha\s*:?\s*/i, '');
				throw new Error(msg);
			}
			const data = await resp.json().catch(() => ({})) // converte resposta em JSON, se falhar retorna objeto vazio
			setSenhaMsg(data.message || 'Senha atualizada')
			setCodigoSenha('')
			setNovaSenha('')
			setConfirmPassword('')
		} catch (err) {
			setSenhaErr(err.message)
		} finally {
			setSenhaLoading(false)
		}
	}

	// Solicita código para exclusão de conta
	async function solicitarCodigoExclusao(e) {
		e.preventDefault() // evita reload da página
		setExcluirErr(null); setExcluirMsg(null)
		try {
			setExcluirCodigoLoading(true)
			if (!usuarioEmail) throw new Error('Email do usuário não disponível')
			// chama backend
			const resp = await fetch(`${API_URL}/usuario/solicitar-codigo/exclusao-conta`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: usuarioEmail }) // converte para JSON
			})
			if (!resp.ok) throw new Error(await resp.text() || 'Erro ao solicitar código')
			const data = await resp.json().catch(() => ({})) // converte resposta em JSON, se falhar retorna objeto vazio
			setExcluirMsg(data.message || 'Código enviado para o seu e-mail.')
		} catch (err) {
			setExcluirErr(err.message)
		} finally {
			setExcluirCodigoLoading(false)
		}
	}

	// Exclui a conta do usuário
	async function excluirConta(e) {
		e.preventDefault() // evita reload da página
		setExcluirErr(null); setExcluirMsg(null)
		const usuarioId = localStorage.getItem('usuario_id') // pega id do usuário do localStorage
		if (!usuarioId) { navigate('/login'); return } // se não tiver id, redireciona para login
		try {
		setExcluirLoading(true)
		// chama backend
		const resp = await authFetch(`${API_URL}/usuario/deletar/${usuarioId}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: usuarioEmail, codigo: codigoExclusao, motivo: 'exclusao_conta' })
		})
		if (!resp.ok) {
			const text = await resp.text();
			let msg = '';
			try {
				const json = JSON.parse(text);
				const detail = json?.detail;
				if (typeof detail === 'string') msg = detail;
				if (Array.isArray(detail) && detail[0]?.msg) msg = String(detail[0].msg);
			} catch {}
			if (!msg) msg = text || `Erro ${resp.status}`;
			// mensagens mais amigáveis
			if (/c[oó]digo inválido/i.test(msg)) msg = 'Código inválido. Verifique o código enviado ao seu e-mail e tente novamente.';
			if (/c[oó]digo expirado/i.test(msg)) msg = 'Código expirado. Solicite um novo código e tente novamente.';
			throw new Error(msg);
		}
		const data = await resp.json().catch(() => ({})) // converte resposta em JSON, se falhar retorna objeto vazio
		setExcluirMsg(data.message || 'Conta excluída')
		// limpa localStorage e redireciona para home após delay de 1.5s
		setTimeout(() => {
			localStorage.clear()
			navigate('/')
		}, 1500)
		} catch (err) {
		setExcluirErr(err.message)
		} finally {
		setExcluirLoading(false)
		}
	}

	// Função para scroll suave para o topo
	const scrollToTop = (e) => {
		e.preventDefault();
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	if(loading){
    	return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">Carregando...</div>
  	}

	// HTML
  	return (
		<div className="min-h-screen bg-slate-900 text-slate-200 pt-16">

			{/* HEADER */}
			<header className="fixed inset-x-0 top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
				<div className="w-90% mx-2 sm:mx-4 md:mx-10 px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between relative">
					<a
						href="#topo"
						onClick={scrollToTop}
						className="text-xl font-semibold text-indigo-300 hover:text-indigo-200"
						aria-label="Voltar ao topo"
					>
						<img
							src={logoRumoTechno}
							alt="RumoTechno"
							className="h-7 sm:h-8 w-auto transition-transform duration-200 ease-out hover:scale-103"
						/>
					</a>
					{/* Navegação central (desktop) */}
					<nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-40">
						<a className="text-lg font-medium text-indigo-200" href="/homeUsuario" data-discover="true">Meu Progresso</a>
						<a className="text-lg font-medium text-white hover:text-indigo-200" href="/usuario/cursos" data-discover="true">Cursos</a>
					</nav>

					{/* Ações à direita (desktop) */}
					<div className="hidden lg:flex items-center gap-3">
						<Link
							to="/usuario/editar-perfil"
							className="px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
						>
							<span>Editar Perfil</span>
						</Link>
						<button
							onClick={logoutRedirecionar}
							className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
						>
							Sair
						</button>
					</div>

					{/* Botão hambúrguer em mobile e tablet */}
					<button
						type="button"
						className="lg:hidden inline-flex items-center justify-center p-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
						aria-controls="menu-mobile"
						aria-expanded={menuAberto}
						onClick={() => setMenuAberto((v) => !v)}
						aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
					>
						{menuAberto ? (
							/* Ícone X */
							<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
						) : (
							/* Ícone hambúrguer */
							<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
						)}
					</button>
				</div>

				{/* Menu colapsável para mobile/tablet */}
				{menuAberto && (
					<div id="menu-mobile" className="lg:hidden border-t border-slate-800 bg-slate-950/95">
						<nav className="px-3 py-3 flex flex-col gap-2">
							<a className="px-2 py-2 rounded text-slate-200 hover:bg-slate-800/50" href="/homeUsuario" data-discover="true" onClick={() => setMenuAberto(false)}>Meu Progresso</a>
							<a className="px-2 py-2 rounded text-slate-200 hover:bg-slate-800/50" href="/usuario/cursos" data-discover="true" onClick={() => setMenuAberto(false)}>Cursos</a>
							<Link
								to="/usuario/editar-perfil"
								className="px-3 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm"
								onClick={() => setMenuAberto(false)}
							>
								<span>Editar Perfil</span>
							</Link>
							<button
								onClick={() => { setMenuAberto(false); logoutRedirecionar(); }}
								className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 text-left"
							>
								Sair
							</button>
						</nav>
					</div>
				)}
			</header>
			

			{/* CONTEÚDO PRINCIPAL */}
			<main className="ml-8 mr-8 mx-auto px-4 py-5">

				{/* BOTÃO VOLTAR */}
				<button
					onClick={() => navigate(-1)}
					className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
					>
					<span aria-hidden>←</span> Voltar
		    	</button>

				{/* título */}
				<h1 className="text-2xl font-semibold mb-6 text-center">Editar Perfil</h1>

				{/* abas de navegação entre seções */}
				<div role="tablist" aria-label="Opções de edição" className="flex justify-center gap-2 mb-7 flex-wrap">
					{[
						{id:'dados', label:'Atualizar dados'},
						{id:'senha', label:'Atualizar senha'},
						{id:'excluir', label:'Excluir conta'}
					].map(t => {
						const ativo = secao === t.id
						return (
							<button
								key={t.id}
								role="tab"
								aria-selected={ativo}
								onClick={()=> { setSecao(t.id); setMessage(null); setError(null); setSenhaMsg(null); setSenhaErr(null); setExcluirMsg(null); setExcluirErr(null); }}
								className={`px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm'}`}
							>
								{t.label}
							</button>
						)
					})}
				</div>

				{/* Seção de Dados */}
				{secao === 'dados' && (
					<form onSubmit={handleSubmit} className="space-y-4 bg-slate-800/40 p-6 rounded border border-slate-700 max-w-xl mx-auto" role="tabpanel" aria-label="Formulário atualizar dados">
						{error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-700 px-3 py-2 rounded">{error}</div>}
						{message && <div className="text-sm text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-3 py-2 rounded">{message}</div>}
						{/* Nome */}
						<div>
							<label className="block text-sm mb-1">Nome</label>
							<input value={nome} onChange={e=>setNome(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
						</div>
						{/* Carreira e Curso */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm mb-1">Carreira</label>
								<select value={carreiraId} onChange={e=>setCarreiraId(e.target.value)} disabled={loadingListas} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
									<option value="">{loadingListas ? 'Carregando…' : 'Selecione…'}</option>
									{carreiras.map(c => (
										<option key={c.id} value={c.id}>{c.nome}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm mb-1">Curso</label>
								<select value={cursoId} onChange={e=>setCursoId(e.target.value)} disabled={loadingListas} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
									<option value="">{loadingListas ? 'Carregando…' : 'Selecione…'}</option>
									{cursos.map(c => (
										<option key={c.id} value={c.id}>{c.nome}</option>
									))}
								</select>
							</div>
						</div>
						{/* Botão Salvar */}
						<button disabled={saving} type="submit" className="w-full bg-indigo-600 disabled:opacity-50 hover:bg-indigo-500 transition-colors px-4 py-2 rounded font-medium">{saving ? 'Salvando...' : 'Salvar'}</button>
					</form>
				)}

				{/* Seção de Senha */}
				{secao === 'senha' && (
					<form onSubmit={confirmarNovaSenha} className="space-y-4 bg-slate-800/40 p-6 rounded border border-slate-700 max-w-xl mx-auto" role="tabpanel" aria-label="Formulário atualizar senha">
						{senhaErr && <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{senhaErr}</div>}
						{senhaMsg && <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{senhaMsg}</div>}
						{/* Email */}
						<div className="text-sm text-slate-300 text-center">O código será enviado para o email cadastrado na sua conta.</div>
						{/* Código */}
						<div className="flex gap-2">
							<button type="button" onClick={solicitarCodigoSenha} disabled={!usuarioEmail || senhaLoading} className="px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm">Enviar Código</button>
							<input placeholder="Código" value={codigoSenha} onChange={e=>setCodigoSenha(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
						</div>
						{/* Nova Senha */}
						<div>
							<label className="block text-xs mb-1">Nova Senha</label>
							<div className="relative">
								<input type={showNova ? 'text' : 'password'} value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} placeholder="Digite a nova senha" onKeyDown={(e)=>{ if(e.key===' ') e.preventDefault(); }} 
								onPaste={(e)=>{ const pasted=(e.clipboardData.getData('text')||'').replace(/\s/g,''); e.preventDefault(); setNovaSenha(prev=>prev? prev + pasted : pasted); }} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
								<button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100" onClick={()=> setShowNova(v=>!v)} aria-label={showNova ? 'Ocultar senha' : 'Mostrar senha'}>
									{showNova ? (
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.74-1.64 1.79-3.17 3.1-4.47M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-1.02 2.27-2.64 4.29-4.67 5.71M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
											<line x1="1" y1="1" x2="23" y2="23"/>
										</svg>
									) : (
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
											<circle cx="12" cy="12" r="3"/>
										</svg>
									)}
								</button>
							</div>
						</div>
						<div className="mt-1 text-xs text-slate-400">
									<ul className="mt-1 space-y-0.5">
										<li className={novaSenhaRequisitos.len ? "text-emerald-400" : undefined}>• Mínimo 6 caracteres</li>
										<li className={novaSenhaRequisitos.maiuscula ? "text-emerald-400" : undefined}>• Pelo menos 1 letra maiúscula</li>
										<li className={novaSenhaRequisitos.especial ? "text-emerald-400" : undefined}>• Pelo menos 1 caractere especial</li>
									</ul>
							</div>
						{/* Confirmar Nova Senha */}
						<div>
							<label className="block text-xs mb-1" htmlFor="confirmPassword">Confirmar Nova Senha</label>
							<div className="relative">
								<input
									id="confirmPassword"
									type={showConfirm ? 'text' : 'password'}
									value={confirmPassword}
									onChange={e=>setConfirmPassword(e.target.value)}
									placeholder="Digite a senha novamente"
									className={`w-full bg-slate-900 rounded px-2 py-2 text-sm border ${confirmPassword && novaSenha !== confirmPassword ? 'border-red-600 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'}`}
									autoComplete="new-password"
								/>
								<button
									type="button"
									className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100"
									onClick={()=> setShowConfirm(v=>!v)}
									aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
								>
									{showConfirm ? (
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.74-1.64 1.79-3.17 3.1-4.47M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-1.02 2.27-2.64 4.29-4.67 5.71M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
											<line x1="1" y1="1" x2="23" y2="23"/>
										</svg>
									) : (
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
											<circle cx="12" cy="12" r="3"/>
										</svg>
									)}
								</button>
							</div>
						</div>
						{/* Botão Confirmar */}
						<button type="submit" disabled={senhaLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded py-2 text-sm">{senhaLoading ? 'Processando...' : 'Atualizar Senha'}</button>
					</form>
				)}

				{/* Seção de Exclusão */}
				{secao === 'excluir' && (
					<form onSubmit={excluirConta} className="space-y-4 bg-slate-800/40 p-6 rounded border border-slate-700 max-w-xl mx-auto" role="tabpanel" aria-label="Formulário excluir conta">
						{excluirErr && <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{excluirErr}</div>}
						{excluirMsg && <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{excluirMsg}</div>}
						<p className="text-sm text-slate-300 leading-snug text-center">ATENÇÃO! Esta ação é definitiva e não poderá ser desfeita.</p>
						{/* Email */}
						<div className="text-sm text-slate-300 text-center">O código será enviado para o email cadastrado na sua conta.</div>
						{/* Código */}
						<div className="flex gap-2">
							<button type="button" onClick={solicitarCodigoExclusao} disabled={!usuarioEmail || excluirCodigoLoading} className="px-4 py-2 rounded-md border border-indigo-600 bg-indigo-500 text-white font-medium hover:bg-indigo-600 shadow-sm">{excluirCodigoLoading ? 'Enviando…' : 'Enviar Código'}</button>
							<input placeholder="Código" value={codigoExclusao} onChange={e=>setCodigoExclusao(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
						</div>
						{/* Botão Excluir */}
						<button type="submit" disabled={excluirLoading} className="w-full items-center gap-2 px-3 py-2 rounded-md bg-red-700 text-red-200 hover:bg-red-900">{excluirLoading ? 'Excluindo...' : 'Excluir Conta'}</button>
					</form>
				)}
			</main>
		</div>
	)
}








