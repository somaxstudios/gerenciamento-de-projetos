import { supabase } from './supabase-config.js';

let usuarios = [];
let usuarioLogado = null;
let modoObrigatorio = false;

// ELEMENTOS
const grid = document.getElementById('grid-usuarios');
const estadoVazio = document.getElementById('estado-vazio');
const buscaInput = document.getElementById('busca-usuario');

const totalUsuarios = document.getElementById('total-usuarios');
const totalAdmins = document.getElementById('total-admins');
const totalAtivos = document.getElementById('total-ativos');

const modal = document.getElementById('modal-usuario');
const modalTitulo = document.getElementById('modal-titulo');
const form = document.getElementById('form-usuario');

const usuarioIdInput = document.getElementById('usuario-id');
const usuarioNomeInput = document.getElementById('usuario-nome');
const usuarioEmailInput = document.getElementById('usuario-email');
const usuarioCargoInput = document.getElementById('usuario-cargo');
const usuarioStatusInput = document.getElementById('usuario-status');

const btnAddUsuario = document.getElementById('add-usuario');
const btnFecharModal = document.getElementById('fechar-modal');
const btnCancelarModal = document.getElementById('cancelar-modal');

// HELPERS
function normalizarTexto(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function getQueryParams() {
    return new URLSearchParams(window.location.search);
}

function obterIniciais(nome) {
    const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'U';
    if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function statusBoolParaTexto(ativo) {
    return ativo ? 'ativo' : 'inativo';
}

function statusTextoParaBool(status) {
    return normalizarTexto(status) === 'ativo';
}

function badgeStatus(ativo) {
    if (ativo === true) {
        return `
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Ativo
            </span>
        `;
    }

    return `
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span class="w-2 h-2 rounded-full bg-slate-400"></span>
            Inativo
        </span>
    `;
}

function badgeCargo(cargo) {
    const valor = String(cargo || '');

    const mapa = {
        Administrador: 'bg-blue-50 text-blue-700 border-blue-200',
        Editor: 'bg-violet-50 text-violet-700 border-violet-200',
        Operacional: 'bg-sky-50 text-sky-700 border-sky-200',
        Financeiro: 'bg-rose-50 text-rose-700 border-rose-200',
        Pendente: 'bg-amber-50 text-amber-700 border-amber-200'
    };

    const classes = mapa[valor] || 'bg-slate-100 text-slate-700 border-slate-200';

    return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${classes}">
            ${valor || 'Sem cargo'}
        </span>
    `;
}

function atualizarResumo(lista) {
    totalUsuarios.textContent = lista.length;
    totalAdmins.textContent = lista.filter(u => u.cargo === 'Administrador').length;
    totalAtivos.textContent = lista.filter(u => u.ativo === true).length;
}

function setModoObrigatorio(ativo) {
    modoObrigatorio = !!ativo;

    if (modoObrigatorio) {
        btnFecharModal?.classList.add('hidden');
        btnCancelarModal?.classList.add('hidden');
    } else {
        btnFecharModal?.classList.remove('hidden');
        btnCancelarModal?.classList.remove('hidden');
    }
}

function abrirModalEdicao(usuario, opcoes = {}) {
    if (!modal) return;

    const obrigatorio = !!opcoes.obrigatorio;

    modalTitulo.textContent = obrigatorio ? 'Complete seu cadastro' : 'Editar membro';

    usuarioIdInput.value = usuario?.id || '';
    usuarioNomeInput.value = usuario?.nome || '';
    usuarioEmailInput.value = usuario?.email || '';
    usuarioCargoInput.value = usuario?.cargo || '';
    usuarioStatusInput.value = statusBoolParaTexto(usuario?.ativo);

    usuarioEmailInput.setAttribute('disabled', 'disabled');
    setModoObrigatorio(obrigatorio);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function fecharModal() {
    if (!modal || modoObrigatorio) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    form?.reset();
    usuarioIdInput.value = '';
    setModoObrigatorio(false);
}

function renderizarUsuarios(lista) {
    atualizarResumo(usuarios);

    if (!lista.length) {
        grid.innerHTML = '';
        estadoVazio.classList.remove('hidden');
        return;
    }

    estadoVazio.classList.add('hidden');

    grid.innerHTML = lista.map(usuario => `
        <article class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-start justify-between gap-4 mb-5">
                <div class="flex items-center gap-4 min-w-0">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                        ${obterIniciais(usuario.nome || usuario.email)}
                    </div>
                    <div class="min-w-0">
                        <h3 class="text-lg font-bold text-slate-900 truncate">${usuario.nome || 'Cadastro incompleto'}</h3>
                        <p class="text-sm text-slate-500 truncate">${usuario.email || '—'}</p>
                    </div>
                </div>
                ${badgeStatus(usuario.ativo)}
            </div>

            <div class="space-y-3 mb-5">
                <div class="flex items-center justify-between gap-3">
                    <span class="text-sm text-slate-500">Cargo</span>
                    ${badgeCargo(usuario.cargo)}
                </div>
            </div>

            <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                    class="btn-editar flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition"
                    data-id="${usuario.id}"
                >
                    Editar
                </button>

                <button
                    class="btn-toggle flex-1 px-4 py-2.5 rounded-xl border ${usuario.ativo ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'} font-medium transition"
                    data-id="${usuario.id}"
                >
                    ${usuario.ativo ? 'Inativar' : 'Ativar'}
                </button>

                <button
                    class="btn-excluir flex-1 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium transition"
                    data-id="${usuario.id}"
                >
                    Excluir
                </button>
            </div>
        </article>
    `).join('');
}

function aplicarFiltro() {
    const termo = normalizarTexto(buscaInput?.value || '');

    if (!termo) {
        renderizarUsuarios(usuarios);
        return;
    }

    const filtrados = usuarios.filter(usuario => {
        const nome = normalizarTexto(usuario.nome);
        const email = normalizarTexto(usuario.email);
        const cargo = normalizarTexto(usuario.cargo);

        return nome.includes(termo) || email.includes(termo) || cargo.includes(termo);
    });

    renderizarUsuarios(filtrados);
}

// SUPABASE
async function obterSessaoAtual() {
    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error) {
        console.error('Erro ao obter sessão:', error);
        return null;
    }

    return session;
}

async function carregarUsuarioLogado() {
    const session = await obterSessaoAtual();
    if (!session?.user?.email) return null;

    usuarioLogado = {
        email: session.user.email,
        id: session.user.id
    };

    return usuarioLogado;
}

async function carregarUsuarios() {
    const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar usuários:', error);
        alert('Erro ao carregar usuários.');
        return;
    }

    usuarios = data || [];
    aplicarFiltro();
}

async function buscarUsuarioPorId(id) {
    const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .eq('id', id)
        .limit(1);

    if (error) {
        console.error('Erro ao buscar usuário por ID:', error);
        return null;
    }

    return data?.[0] || null;
}

async function buscarUsuarioPorEmail(email) {
    const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: true })
        .limit(1);

    if (error) {
        console.error('Erro ao buscar usuário por email:', error);
        return null;
    }

    return data?.[0] || null;
}

async function atualizarUsuario(id, payload) {
    const { error } = await supabase
        .from('usuarios_sistema')
        .update(payload)
        .eq('id', id);

    if (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw error;
    }
}

async function excluirUsuario(id) {
    const { error } = await supabase
        .from('usuarios_sistema')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir usuário:', error);
        throw error;
    }
}

// FLUXO COMPLETAR CADASTRO
async function verificarCompletarCadastro() {
    const params = getQueryParams();
    const completar = params.get('completar');
    const email = params.get('email');

    if (completar !== '1' || !email) return;

    const usuario = await buscarUsuarioPorEmail(email);
    if (!usuario) return;

    abrirModalEdicao(usuario, { obrigatorio: true });
}

function limparQueryStringCompletar() {
    const url = new URL(window.location.href);
    url.searchParams.delete('completar');
    url.searchParams.delete('email');
    window.history.replaceState({}, '', url.toString());
}

// EVENTOS
btnAddUsuario?.addEventListener('click', async () => {
    alert('Novos usuários devem ser criados pelo fluxo de autenticação do Supabase (email e senha). Aqui você edita os dados complementares.');
});

btnFecharModal?.addEventListener('click', fecharModal);
btnCancelarModal?.addEventListener('click', fecharModal);

modal?.addEventListener('click', (e) => {
    if (e.target === modal && !modoObrigatorio) {
        fecharModal();
    }
});

buscaInput?.addEventListener('input', aplicarFiltro);

form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = usuarioIdInput.value;
    const nome = usuarioNomeInput.value.trim();
    const cargo = usuarioCargoInput.value.trim();
    const status = usuarioStatusInput.value;

    if (!id) {
        alert('Usuário inválido.');
        return;
    }

    if (!nome || !cargo || cargo === 'Pendente') {
        alert('Preencha nome e cargo corretamente.');
        return;
    }

    try {
        await atualizarUsuario(id, {
            nome,
            cargo,
            ativo: statusTextoParaBool(status)
        });

        if (usuarioLogado?.email && usuarioEmailInput.value === usuarioLogado.email) {
            try {
                await supabase.auth.updateUser({
                    data: { nome, cargo }
                });
            } catch (err) {
                console.warn('Não foi possível atualizar o metadata do Auth:', err);
            }
        }

        const eraObrigatorio = modoObrigatorio;

        modal.classList.add('hidden');
        modal.classList.remove('flex');
        setModoObrigatorio(false);

        await carregarUsuarios();

        if (eraObrigatorio) {
            limparQueryStringCompletar();
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error(error);
        alert('Erro ao salvar usuário.');
    }
});

grid?.addEventListener('click', async (e) => {
    const btnEditar = e.target.closest('.btn-editar');
    const btnToggle = e.target.closest('.btn-toggle');
    const btnExcluir = e.target.closest('.btn-excluir');

    if (btnEditar) {
        const usuario = await buscarUsuarioPorId(btnEditar.dataset.id);
        if (usuario) abrirModalEdicao(usuario, { obrigatorio: false });
        return;
    }

    if (btnToggle) {
        const id = btnToggle.dataset.id;
        const usuario = usuarios.find(u => u.id === id);
        if (!usuario) return;

        const novoAtivo = !usuario.ativo;
        const confirmar = confirm(
            novoAtivo
                ? `Deseja ativar ${usuario.nome || usuario.email}?`
                : `Deseja inativar ${usuario.nome || usuario.email}?`
        );

        if (!confirmar) return;

        try {
            await atualizarUsuario(id, { ativo: novoAtivo });
            await carregarUsuarios();
        } catch (error) {
            alert('Erro ao atualizar status do usuário.');
        }
        return;
    }

    if (btnExcluir) {
        const id = btnExcluir.dataset.id;
        const usuario = usuarios.find(u => u.id === id);
        if (!usuario) return;

        if (usuarioLogado?.email && usuario.email === usuarioLogado.email) {
            alert('Você não pode excluir o próprio usuário por aqui.');
            return;
        }

        const confirmar = confirm(`Deseja excluir ${usuario.nome || usuario.email}?`);
        if (!confirmar) return;

        try {
            await excluirUsuario(id);
            await carregarUsuarios();
        } catch (error) {
            alert('Erro ao excluir usuário.');
        }
    }
});

// INIT
async function inicializar() {
    await carregarUsuarioLogado();
    await carregarUsuarios();
    await verificarCompletarCadastro();
}

inicializar();