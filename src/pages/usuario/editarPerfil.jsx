import { Link, useNavigate } from "react-router-dom"; // criar links de navegação para redirecionar o usuário e voltar
import { useEffect, useState } from "react"; // estados e efeitos
import { authFetch } from "../../utils/auth"; // fetch autenticado com renovação automática de token
import { logoutRedirecionar } from "../../utils/auth"; // logout e redirecionamento
import perfilIcon from "../../../images/perfil.png"; // ícone de perfil

const API_URL = import.meta.env.VITE_API_URL ?? 'https://pfcbackend-production-668a.up.railway.app'

// Página de edição de perfil
export default function EditarPerfil() {

	// Estados dos campos
	const navigate = useNavigate() // navegação de páginas (voltar)
	const [nome, setNome] = useState('')
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
	const [emailSenha, setEmailSenha] = useState('')
	const [codigoSenha, setCodigoSenha] = useState('')
	const [novaSenha, setNovaSenha] = useState('')
	const [senhaMsg, setSenhaMsg] = useState(null)
	const [senhaErr, setSenhaErr] = useState(null)
	const [senhaLoading, setSenhaLoading] = useState(false)

	// Deletar conta
	const [emailExclusao, setEmailExclusao] = useState('')
	const [codigoExclusao, setCodigoExclusao] = useState('')
	const [excluirMsg, setExcluirMsg] = useState(null)
	const [excluirErr, setExcluirErr] = useState(null)
	const [excluirLoading, setExcluirLoading] = useState(false)

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
				// manter nome e email em localStorage
				localStorage.setItem('usuario_nome', data.nome || '')
				localStorage.setItem('usuario_email', data.email || '')
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
			localStorage.setItem('usuario_email', email)
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
			// chama backend
			const resp = await fetch(`${API_URL}/usuario/solicitar-codigo/atualizar-senha`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: emailSenha }) // converte para JSON
			})
			if(!resp.ok) throw new Error(await resp.text() || 'Erro ao solicitar código')
			const data = await resp.json().catch(()=> ({})) // converte resposta em JSON, se falhar retorna objeto vazio
			setSenhaMsg(data.message || 'Código enviado para o email')
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
		try {
		setSenhaLoading(true)
		// chama backend
		const resp = await authFetch(`${API_URL}/usuario/atualizar-senha/${usuarioId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: emailSenha, codigo: codigoSenha, nova_senha: novaSenha }) // converte para JSON
		})
		if (!resp.ok) throw new Error(await resp.text() || 'Erro ao atualizar senha')
		const data = await resp.json().catch(() => ({})) // converte resposta em JSON, se falhar retorna objeto vazio
		setSenhaMsg(data.message || 'Senha atualizada')
		setCodigoSenha('')
		setNovaSenha('')
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
		setExcluirLoading(true)
		// chama backend
		const resp = await fetch(`${API_URL}/usuario/solicitar-codigo/exclusao-conta`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: emailExclusao }) // converte para JSON
		})
		if (!resp.ok) throw new Error(await resp.text() || 'Erro ao solicitar código')
		const data = await resp.json().catch(() => ({})) // converte resposta em JSON, se falhar retorna objeto vazio
		setExcluirMsg(data.message || 'Código enviado')
		} catch (err) {
		setExcluirErr(err.message)
		} finally {
		setExcluirLoading(false)
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
			body: JSON.stringify({ email: emailExclusao, codigo: codigoExclusao, motivo: 'exclusao_conta' })
		})
		if (!resp.ok) throw new Error(await resp.text() || 'Erro ao excluir conta')
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

	if(loading){
    	return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">Carregando...</div>
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
								className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${ativo ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
							>
								{t.label}
							</button>
						)
					})}
				</div>

				{/* Seção de Dados */}
				{secao === 'dados' && (
					<form onSubmit={handleSubmit} className="space-y-4 bg-slate-800/40 p-6 rounded border border-slate-700 max-w-md mx-auto" role="tabpanel" aria-label="Formulário atualizar dados">
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
					<form onSubmit={confirmarNovaSenha} className="space-y-4 bg-slate-800/40 p-6 rounded border border-slate-700 max-w-md mx-auto" role="tabpanel" aria-label="Formulário atualizar senha">
						{senhaErr && <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{senhaErr}</div>}
						{senhaMsg && <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-600 px-2 py-1 rounded">{senhaMsg}</div>}
						{/* Email */}
						<div>
							<label className="block text-xs mb-1">Email</label>
							<input type="email" value={emailSenha} onChange={e=>setEmailSenha(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
						</div>
						{/* Código */}
						<div className="flex gap-2">
							<button onClick={solicitarCodigoSenha} disabled={!emailSenha || senhaLoading} className="px-3 py-2 bg-indigo-600 disabled:opacity-40 rounded text-xs hover:bg-indigo-500">Enviar Código</button>
							<input placeholder="Código" value={codigoSenha} onChange={e=>setCodigoSenha(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
						</div>
						{/* Nova Senha */}
						<div>
							<label className="block text-xs mb-1">Nova Senha</label>
							<input type="password" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
						</div>
						{/* Botão Confirmar */}
						<button type="submit" disabled={senhaLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded py-2 text-sm">{senhaLoading ? 'Processando...' : 'Atualizar Senha'}</button>
					</form>
				)}

				{/* Seção de Exclusão */}
				{secao === 'excluir' && (
					<form onSubmit={excluirConta} className="space-y-4 bg-slate-800/40 p-6 rounded border border-slate-700 max-w-md mx-auto" role="tabpanel" aria-label="Formulário excluir conta">
						{excluirErr && <div className="text-xs text-red-400 bg-red-950/40 border border-red-700 px-2 py-1 rounded">{excluirErr}</div>}
						{excluirMsg && <div className="text-xs text-amber-300 bg-amber-900/30 border border-amber-600 px-2 py-1 rounded">{excluirMsg}</div>}
						<p className="text-xs text-slate-300 leading-snug text-center">ATENÇÃO! Esta ação é definitiva e não poderá ser desfeita.</p>
						{/* Email */}
						<div>
							<label className="block text-xs mb-1">Email</label>
							<input type="email" value={emailExclusao} onChange={e=>setEmailExclusao(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
						</div>
						{/* Código */}
						<div className="flex gap-2">
							<button onClick={solicitarCodigoExclusao} disabled={!emailExclusao || excluirLoading} className="px-3 py-2 bg-red-600 disabled:opacity-40 rounded text-xs hover:bg-red-500">Enviar Código</button>
							<input placeholder="Código" value={codigoExclusao} onChange={e=>setCodigoExclusao(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm" required />
						</div>
						{/* Botão Excluir */}
						<button type="submit" disabled={excluirLoading} className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded py-2 text-sm">{excluirLoading ? 'Excluindo...' : 'Excluir Conta'}</button>
					</form>
				)}
			</main>
		</div>
	)
}


