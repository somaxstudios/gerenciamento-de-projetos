import { supabase } from './supabase-config.js';
import { protegerPagina } from './auth-guard.js';

const SIDEBAR_STORAGE_KEY = 'polymusic_sidebar_collapsed';

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

function deveIniciarRecolhido() {
    const salvo = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (salvo !== null) return salvo === 'true';

    return window.innerWidth < 1280;
}

function aplicarEstadoSidebar(colapsado) {
    const aside = document.getElementById('app-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const toggleIcon = document.getElementById('sidebar-toggle-icon');
    const brandSubtitle = document.getElementById('sidebar-brand-subtitle');
    const brandTitle = document.getElementById('sidebar-brand-title');
    const footerCopy = document.getElementById('sidebar-footer-copy');
    const userCard = document.getElementById('sidebar-user-card');

    if (!aside) return;

    const textos = aside.querySelectorAll('.sidebar-text');
    const centralizados = aside.querySelectorAll('.sidebar-center-when-collapsed');

    if (colapsado) {
        aside.classList.remove('w-64');
        aside.classList.add('w-20');

        userCard?.classList.add('px-2', 'py-3');
        userCard?.classList.remove('p-4');

        brandTitle?.classList.add('hidden');
        brandSubtitle?.classList.add('hidden');
        footerCopy?.classList.add('hidden');

        textos.forEach(el => el.classList.add('hidden'));
        centralizados.forEach(el => {
            el.classList.add('justify-center');
            el.classList.remove('gap-3', 'px-4');
            el.classList.add('px-2');
        });

        if (toggleIcon) toggleIcon.textContent = '➡️';
        if (toggleBtn) toggleBtn.title = 'Expandir menu';
    } else {
        aside.classList.remove('w-20');
        aside.classList.add('w-64');

        userCard?.classList.remove('px-2', 'py-3');
        userCard?.classList.add('p-4');

        brandTitle?.classList.remove('hidden');
        brandSubtitle?.classList.remove('hidden');
        footerCopy?.classList.remove('hidden');

        textos.forEach(el => el.classList.remove('hidden'));
        centralizados.forEach(el => {
            el.classList.remove('justify-center', 'px-2');
            el.classList.add('gap-3', 'px-4');
        });

        if (toggleIcon) toggleIcon.textContent = '⬅️';
        if (toggleBtn) toggleBtn.title = 'Recolher menu';
    }

    aside.dataset.collapsed = String(colapsado);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(colapsado));
}

function configurarToggleSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        const aside = document.getElementById('app-sidebar');
        const colapsadoAtual = aside?.dataset.collapsed === 'true';
        aplicarEstadoSidebar(!colapsadoAtual);
    });

    window.addEventListener('resize', () => {
        const aside = document.getElementById('app-sidebar');
        if (!aside) return;

        const salvo = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (salvo === null) {
            aplicarEstadoSidebar(window.innerWidth < 1280);
        }
    });
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
    <aside
        id="app-sidebar"
        class="w-64 bg-slate-900 text-white flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out border-r border-slate-800"
    >
        <div class="p-4 border-b border-slate-800 flex items-center justify-between gap-3 min-h-[88px]">
            <div class="min-w-0">
                <div id="sidebar-brand-title" class="text-xl font-bold tracking-tight whitespace-nowrap">POLYMUSIC</div>
                <div id="sidebar-brand-subtitle" class="text-xs text-slate-400 mt-1 tracking-wide whitespace-nowrap">
                    Gerenciamento de Projetos
                </div>
            </div>

            <button
                id="sidebar-toggle"
                type="button"
                class="w-10 h-10 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center shrink-0"
                title="Recolher menu"
            >
                <span id="sidebar-toggle-icon" class="text-sm">⬅️</span>
            </button>
        </div>

        <div class="px-4 pt-4">
            <div
                id="sidebar-user-card"
                class="bg-slate-800/70 rounded-2xl p-4 border border-slate-700 transition-all duration-300"
            >
                <div class="sidebar-text text-sm font-semibold text-white truncate" id="sidebar-user-nome">Carregando...</div>
                <div class="sidebar-text text-xs text-slate-400 truncate mt-1" id="sidebar-user-email">...</div>
                <div
                    class="sidebar-text mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-300 border border-blue-400/20"
                    id="sidebar-user-cargo"
                >
                    ...
                </div>

                <div class="hidden sidebar-icon-only text-center text-lg">👤</div>
            </div>
        </div>

        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
            ${menuItens.map(item => `
                <a
                    href="${item.link}"
                    class="sidebar-center-when-collapsed flex items-center gap-3 py-3 px-4 rounded-xl transition group
                    ${paginaAtual === item.link
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'hover:bg-slate-800 text-slate-300 hover:text-white'}"
                    title="${item.nome}"
                >
                    <span class="text-lg shrink-0">${item.icone}</span>
                    <span class="sidebar-text font-medium whitespace-nowrap">${item.nome}</span>
                </a>
            `).join('')}
        </nav>

        <div class="p-4 border-t border-slate-800 space-y-3">
            <button
                id="btn-logout"
                class="sidebar-center-when-collapsed w-full text-left py-3 px-4 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-red-400 transition text-sm flex items-center gap-2"
                title="Sair do Sistema"
            >
                <span class="shrink-0">🚪</span>
                <span class="sidebar-text">Sair do Sistema</span>
            </button>

            <div id="sidebar-footer-copy" class="text-[11px] text-slate-500 px-4 leading-5">
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

    configurarToggleSidebar();
    aplicarEstadoSidebar(deveIniciarRecolhido());

    document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}