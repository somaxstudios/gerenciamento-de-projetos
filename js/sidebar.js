import { supabase } from './supabase-config.js';

export function carregarSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    const path = window.location.pathname;
    const paginaAtual = path.split("/").pop() || "index.html";

    const menuItens = [
        { nome: 'Dashboard', link: 'dashboard.html', icone: '📊' },
        { nome: 'Projetos', link: 'gerenciar-projetos.html', icone: '🎵' },
        { nome: 'Novo Lançamento', link: 'criar-lancamento.html', icone: '➕' },
        { nome: 'Equipe', link: 'usuarios.html', icone: '👥' }
    ];

    const html = `
    <aside class="w-64 bg-slate-900 text-white flex flex-col shrink-0 h-screen sticky top-0">

        <!-- TOPO / MARCA -->
        <div class="p-6 border-b border-slate-800">
            <div class="text-xl font-bold tracking-tight">
                POLYMUSIC
            </div>
            <div class="text-xs text-slate-400 mt-1 tracking-wide">
                Gerenciamento de Projetos
            </div>
        </div>

        <!-- MENU -->
        <nav class="flex-1 p-4 space-y-1">
            ${menuItens.map(item => `
                <a href="${item.link}" 
                   class="flex items-center gap-3 py-3 px-4 rounded-lg transition 
                   ${paginaAtual === item.link 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'hover:bg-slate-800 text-slate-400 hover:text-white'}">
                    <span>${item.icone}</span>
                    <span>${item.nome}</span>
                </a>
            `).join('')}
        </nav>

        <!-- RODAPÉ -->
        <div class="p-4 border-t border-slate-800 space-y-3">

            <button id="btn-logout"
                class="w-full text-left py-2 px-4 text-slate-400 hover:text-red-400 transition text-sm flex items-center gap-2">
                <span>🚪</span> Sair do Sistema
            </button>

            <div class="text-[11px] text-slate-500 px-4">
                © 2026 PolyMusic<br>
                Todos os direitos reservados
            </div>

        </div>
    </aside>
    `;

    sidebarContainer.innerHTML = html;

    document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}