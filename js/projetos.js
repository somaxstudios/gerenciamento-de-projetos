// js/projetos.js
import { supabase } from './supabase-config.js';

let projetos = [];

async function carregarTabela(filtro = '') {
    let query = supabase.from('projetos').select('*');

    if (filtro) {
        query = query.ilike('nome_projeto', `%${filtro}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao carregar projetos:', error);
        return;
    }

    projetos = data;
    renderizarTabela(projetos);
}

function renderizarTabela(projetos) {
    const tbody = document.getElementById('tabela-projetos');
    if (!tbody) return;

    if (projetos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-6 text-slate-400">Nenhum projeto encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = projetos.map(p => {
        const prioridadeIcon = p.is_prioridade ? '🔴' : '⚪';

        const audioBadge = {
            'AINDA_NAO_TEM': '<span class="px-2 py-1 bg-slate-200 text-slate-700 rounded-full text-xs">Não iniciado</span>',
            'EM_ANDAMENTO': '<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Em andamento</span>',
            'CONCLUIDO': '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Concluído</span>'
        }[p.audio_status] || '<span class="text-slate-400">-</span>';

        const capaBadge = {
            'AINDA_NAO_TEM': '<span class="px-2 py-1 bg-slate-200 text-slate-700 rounded-full text-xs">Não iniciado</span>',
            'EM_ANDAMENTO': '<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Em andamento</span>',
            'CONCLUIDO': '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Concluído</span>'
        }[p.capa_status] || '<span class="text-slate-400">-</span>';

        const lancamento = p.data_lancamento ? new Date(p.data_lancamento).toLocaleDateString('pt-BR') : '—';

        return `
        <tr data-id="${p.id}">
            <td class="p-4 text-xl">${prioridadeIcon}</td>
            <td class="p-4">
                <div class="font-medium">${p.nome_projeto}</div>
                <div class="text-sm text-slate-500">${p.titulo || '—'}</div>
            </td>
            <td class="p-4 text-sm">${p.formato || '—'}</td>
            <td class="p-4">${audioBadge}</td>
            <td class="p-4">${capaBadge}</td>
            <td class="p-4 text-sm">${lancamento}</td>
            <td class="p-4 text-center">
                <button class="text-blue-600 hover:text-blue-800 mx-1 btn-view" title="Ver">👁️</button>
                <button class="text-blue-600 hover:text-blue-800 mx-1 btn-edit" title="Editar">✏️</button>
                <button class="text-red-600 hover:text-red-800 mx-1 btn-delete" title="Excluir">🗑️</button>
            </td>
        </tr>
    `}).join('');
}

// Event delegation para ações da tabela
document.getElementById('tabela-projetos')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const row = btn.closest('tr');
    if (!row || !row.dataset.id) return;

    const projetoId = row.dataset.id;

    if (btn.classList.contains('btn-view')) {
        // Redirecionar para página de visualização
        window.location.href = `ver-projeto.html?id=${projetoId}`;
    }
    else if (btn.classList.contains('btn-edit')) {
        // Redirecionar para página de edição
        window.location.href = `editar-projeto.html?id=${projetoId}`;
    }
    else if (btn.classList.contains('btn-delete')) {
        // Confirmar exclusão
        if (confirm('Tem certeza que deseja excluir este projeto?')) {
            const { error } = await supabase
                .from('projetos')
                .delete()
                .eq('id', projetoId);

            if (error) {
                alert('Erro ao excluir: ' + error.message);
            } else {
                // Recarregar tabela
                carregarTabela(document.getElementById('busca-projeto')?.value || '');
            }
        }
    }
});

// Filtro ao digitar
document.getElementById('busca-projeto')?.addEventListener('input', (e) => {
    carregarTabela(e.target.value);
});

// Carregar inicial
carregarTabela();