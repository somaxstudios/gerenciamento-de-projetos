import { supabase } from './supabase-config.js';
import { protegerPagina } from './auth-guard.js';

function obterPaginaAtual() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
}

function atualizarBlocoUsuarioSidebar(usuario) {
    const nomeEl = document.getElementById('sidebar-user-nome');
    const emailEl = document.getElementById('sidebar-user-email');
    const cargoEl = document.getElementById('sidebar-user-cargo');

    if (nomeEl) nomeEl.textContent = usuario?.nome || 'Usuário';
    if (emailEl) emailEl.textContent = usuario?.email || '';
    if (cargoEl) cargoEl.textContent = usuario?.cargo || 'Cadastro pendente';
}

export async function carregarSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    const resultado = await protegerPagina();
    if (!resultado.autenticado) return;

    const paginaAtual = obterPaginaAtual();

    const menuItens = [
        { nome: 'Dashboard', link: 'dashboard.html', icone: '📊' },
        { nome: 'Projetos', link: 'gerenciar-projetos.html', icone: '🎵' },
        { nome: 'Novo Lançamento', link: 'criar-lancamento.html', icone: '➕' },
        { nome: 'Equipe', link: 'usuarios.html', icone: '👥' }
    ];

    const html = `
    <aside class="w-64 bg-slate-900 text-white flex flex-col shrink-0 h-screen sticky top-0">
        <div class="p-6 border-b border-slate-800">
            <div class="text-xl font-bold tracking-tight">POLYMUSIC</div>
            <div class="text-xs text-slate-400 mt-1 tracking-wide">
                Gerenciamento de Projetos
            </div>
        </div>

        <div class="px-4 pt-4">
            <div class="bg-slate-800/70 rounded-2xl p-4 border border-slate-700">
                <div class="text-sm font-semibold text-white truncate" id="sidebar-user-nome">Carregando...</div>
                <div class="text-xs text-slate-400 truncate mt-1" id="sidebar-user-email">...</div>
                <div class="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-300 border border-blue-400/20" id="sidebar-user-cargo">
                    ...
                </div>
            </div>
        </div>

        <nav class="flex-1 p-4 space-y-1">
            ${menuItens.map(item => `
                <a href="${item.link}" 
                   class="flex items-center gap-3 py-3 px-4 rounded-xl transition
                   ${paginaAtual === item.link
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'hover:bg-slate-800 text-slate-300 hover:text-white'}">
                    <span class="text-lg">${item.icone}</span>
                    <span class="font-medium">${item.nome}</span>
                </a>
            `).join('')}
        </nav>

        <div class="p-4 border-t border-slate-800 space-y-3">
            <button id="btn-logout"
                class="w-full text-left py-3 px-4 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-red-400 transition text-sm flex items-center gap-2">
                <span>🚪</span> Sair do Sistema
            </button>

            <div class="text-[11px] text-slate-500 px-4 leading-5">
                © 2026 PolyMusic<br>
                Todos os direitos reservados
            </div>
        </div>
    </aside>
    `;

    sidebarContainer.innerHTML = html;

    atualizarBlocoUsuarioSidebar({
        nome: resultado.usuarioSistema?.nome,
        email: resultado.usuarioSistema?.email,
        cargo: resultado.usuarioSistema?.cargo
    });

    document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}