import { supabase } from './supabase-config.js';

// Páginas que não precisam de login
const PAGINAS_PUBLICAS = ['index.html', '', '/'];

function paginaAtual() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
}

function ehPaginaPublica() {
    return PAGINAS_PUBLICAS.includes(paginaAtual());
}

function getParams() {
    return new URLSearchParams(window.location.search);
}

function estaEmFluxoDeCompletarCadastro() {
    const params = getParams();
    return paginaAtual() === 'usuarios.html' && params.get('completar') === '1';
}

function cadastroIncompleto(usuarioSistema) {
    if (!usuarioSistema) return true;

    const nome = String(usuarioSistema.nome || '').trim();
    const cargo = String(usuarioSistema.cargo || '').trim();

    return (
        !nome ||
        !cargo ||
        cargo.toLowerCase() === 'pendente'
    );
}

async function buscarUsuarioSistemaPorEmail(email) {
    const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .eq('email', email)
        .limit(1);

    if (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
    }

    return data?.[0] || null;
}

async function sincronizarUsuarioBase(authUser) {
    const email = authUser?.email;
    if (!email) return null;

    let usuarioSistema = await buscarUsuarioSistemaPorEmail(email);

    if (!usuarioSistema) {
        const nomeTemporario =
            authUser.user_metadata?.nome ||
            authUser.user_metadata?.name ||
            email.split('@')[0];

        const cargoTemporario = 'Pendente';

        const { data, error } = await supabase
            .from('usuarios_sistema')
            .insert({
                email,
                nome: nomeTemporario,
                cargo: cargoTemporario,
                ativo: true
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar usuário:', error);
            return null;
        }

        usuarioSistema = data;
    }

    return usuarioSistema;
}

function redirecionarParaLogin() {
    const atual = paginaAtual();
    if (!ehPaginaPublica()) {
        window.location.href = `index.html?redirect=${encodeURIComponent(atual)}`;
    }
}

function redirecionarParaCompletarCadastro(usuarioSistema) {
    const params = new URLSearchParams({
        completar: '1',
        email: usuarioSistema?.email || ''
    });

    window.location.href = `usuarios.html?${params.toString()}`;
}

export async function protegerPagina() {

    // Página pública (login)
    if (ehPaginaPublica()) {
        return {
            autenticado: false,
            usuarioAuth: null,
            usuarioSistema: null,
            cadastroPendente: false
        };
    }

    // Verifica sessão
    const {
        data: { session },
        error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
        redirecionarParaLogin();
        return {
            autenticado: false,
            usuarioAuth: null,
            usuarioSistema: null,
            cadastroPendente: false
        };
    }

    const usuarioAuth = session.user;

    let usuarioSistema = await sincronizarUsuarioBase(usuarioAuth);

    if (!usuarioSistema) {
        alert('Erro ao validar usuário.');
        await supabase.auth.signOut();
        redirecionarParaLogin();
        return {
            autenticado: false,
            usuarioAuth: null,
            usuarioSistema: null,
            cadastroPendente: false
        };
    }

    if (usuarioSistema.ativo === false) {
        alert('Usuário inativo.');
        await supabase.auth.signOut();
        redirecionarParaLogin();
        return {
            autenticado: false,
            usuarioAuth: null,
            usuarioSistema: null,
            cadastroPendente: false
        };
    }

    const pendente = cadastroIncompleto(usuarioSistema);

    // Permite continuar na tela de completar cadastro
    if (pendente && estaEmFluxoDeCompletarCadastro()) {
        return {
            autenticado: true,
            usuarioAuth,
            usuarioSistema,
            cadastroPendente: true
        };
    }

    // Pergunta se quer completar cadastro
    if (pendente) {
        const desejaCompletar = window.confirm(
            'Seu cadastro está incompleto. Deseja completar agora?'
        );

        if (desejaCompletar) {
            redirecionarParaCompletarCadastro(usuarioSistema);
            return {
                autenticado: false,
                usuarioAuth,
                usuarioSistema,
                cadastroPendente: true
            };
        }

        // 🔥 AQUI ESTÁ A CORREÇÃO
        // NÃO DESLOGA MAIS
        return {
            autenticado: true,
            usuarioAuth,
            usuarioSistema,
            cadastroPendente: true
        };
    }

    // Tudo OK
    return {
        autenticado: true,
        usuarioAuth,
        usuarioSistema,
        cadastroPendente: false
    };
}