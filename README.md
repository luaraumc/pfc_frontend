# Frontend

Aplicação SPA feita em React (Vite) com roteamento via React Router e Tailwind CSS.

## Configuração do ambiente

Crie um arquivo `.env` na pasta `pfc_frontend/` com a URL do backend:

```
VITE_API_URL=http://localhost:8000
```

## Instalação

No Windows (cmd.exe):

```cmd
npm install
```

## Desenvolvimento

Inicie o servidor de desenvolvimento (Vite). Por padrão, abrirá em `http://localhost:5173`:

```cmd
npm run dev
```


## Estrutura principal

```
pfc_frontend/
	src/
		main.jsx        # monta <App/> com BrowserRouter
		App.jsx         # define rotas públicas, protegidas e admin
		routes/
			ProtectedRoutes.jsx  # RequireAuth e RequireAdmin
		pages/          # telas: login, cadastro, recuperar senha, áreas de usuário e admin
		utils/
			auth.js      # VITE_API_URL, helpers JWT, refresh token e authFetch
	vite.config.js    # plugins React e Tailwind CSS (v4)
	vercel.json       # reescritas para SPA em produção
```

## Integração com o backend

- Base URL da API: lida por `VITE_API_URL` em `src/utils/auth.js`.
- As requisições autenticadas devem usar `authFetch(...)` para:
	- anexar `Authorization: Bearer <access_token>`;
	- enviar `credentials: 'include'` (cookies de refresh);
	- tentar renovar o access token automaticamente em 401/403 usando `/auth/refresh`.
- O backend precisa permitir a origem do frontend nas regras de CORS e aceitar credenciais.

## Deploy (Vercel)

- O arquivo `vercel.json` faz `rewrite` de todas as rotas para `index.html` (SPA).
- Configure em variáveis do projeto no Vercel:
	- `VITE_API_URL` apontando para o backend público (ex.: `https://api.seu-dominio.com`).
- Se o backend estiver em domínio diferente (cross-site), ajuste o backend para setar o refresh cookie com `SameSite=None; Secure` em produção. Por padrão neste projeto, os cookies estão configurados para desenvolvimento (`SameSite=Lax`, `secure=false`).

## Problemas comuns

- 401/403 após login: verifique se o navegador está aceitando cookies e se o backend emite `refresh_token` (ver `/auth/login`).
- CORS: adicione a origem do frontend no backend (`app/main.py`) e mantenha `allow_credentials=True`.
- `VITE_API_URL` incorreta: ajuste no `.env` do frontend e nas variáveis do ambiente de deploy.

## Licença

Este projeto é de uso interno.
