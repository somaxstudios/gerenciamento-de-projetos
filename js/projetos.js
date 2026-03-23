import { supabase } from './supabase-config.js';

let projetos = [];

function escaparValorLike(valor) {
    return String(valor || '')
        .replace(/[%]/g, '')
        .replace(/[.]/g, '')
        .trim();
}

function normalizarStatus(status) {
    if (!status) return '';

    const valor = String(status)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');

    if (['AINDA_NAO_TEM', 'NAO_INICIADO', 'NAO_INICIADA', 'NAO_TEM', 'PENDENTE'].includes(valor)) {
        return 'AINDA_NAO_TEM';
    }

    if (['EM_ANDAMENTO', 'ANDAMENTO', 'INICIADO'].includes(valor)) {
        return 'EM_ANDAMENTO';
    }

    if (['CONCLUIDO', 'CONCLUIDA', 'FINALIZADO', 'FINALIZADA', 'PRONTO'].includes(valor)) {
        return 'CONCLUIDO';
    }

    return valor;
}

function badgeStatus(status, tipo = 'audio') {
    const s = normalizarStatus(status);

    const mapa = {
        audio: {
            AINDA_NAO_TEM: `
                <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                    Não iniciado
                </span>
            `,
            EM_ANDAMENTO: `
                <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    Em andamento
                </span>
            `,
            CONCLUIDO: `
                <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Concluído
                </span>
            `
        },
        capa: {
            AINDA_NAO_TEM: `
                <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                    Não iniciada
                </span>
            `,
            EM_ANDAMENTO: `
                <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                    <span class="w-2 h-2 rounded-full bg-violet-500"></span>
                    Em andamento
                </span>
            `,
            CONCLUIDO: `
                <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Concluída
                </span>
            `
        }
    };

    return mapa[tipo]?.[s] || `<span class="text-slate-400 text-sm">—</span>`;
}

function badgeLancamento(jaLancado) {
    if (jaLancado === true) {
        return `
            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Já lançado
            </span>
        `;
    }

    if (jaLancado === false) {
        return `
            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                Não lançado
            </span>
        `;
    }

    return `<span class="text-slate-400 text-sm">—</span>`;
}

function badgePlataforma(plataforma) {
    if (!plataforma) {
        return `<span class="text-slate-400 text-sm">—</span>`;
    }

    const estilos = {
        'The Orchard': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'Believe': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
    };

    const classe = estilos[plataforma] || 'bg-slate-100 text-slate-700 border-slate-200';

    return `
        <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${classe}">
            ${plataforma}
        </span>
    `;
}

function formatarData(data) {
    if (!data) return '—';
    // Supõe que a string está no formato "YYYY-MM-DD"
    const partes = data.split('-');
    if (partes.length !== 3) return '—';
    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // meses são 0-index
    const dia = parseInt(partes[2], 10);
    const dt = new Date(ano, mes, dia);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('pt-BR');
}

function obterFiltros() {
    return {
        busca: document.getElementById('busca-projeto')?.value?.trim() || '',
        lancado: document.getElementById('filtro-lancado')?.value || '',
        audio: document.getElementById('filtro-audio')?.value || '',
        capa: document.getElementById('filtro-capa')?.value || ''
    };
}

async function carregarTabela() {
    const filtros = obterFiltros();

    let query = supabase
        .from('projetos')
        .select('*')
        .order('data_lancamento', { ascending: true });

    if (filtros.busca) {
        const termo = escaparValorLike(filtros.busca);
        query = query.or(`nome_projeto.ilike.%${termo}%,titulo.ilike.%${termo}%`);
    }

    if (filtros.lancado === 'true') {
        query = query.eq('ja_lancado', true);
    } else if (filtros.lancado === 'false') {
        query = query.eq('ja_lancado', false);
    }

    if (filtros.audio) {
        query = query.eq('audio_status', filtros.audio);
    }

    if (filtros.capa) {
        query = query.eq('capa_status', filtros.capa);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao carregar projetos:', error);
        alert('Erro ao carregar projetos: ' + error.message);
        return;
    }

    projetos = data || [];
    renderizarTabela(projetos);
}

function renderizarTabela(lista) {
    const tbody = document.getElementById('tabela-projetos');
    if (!tbody) return;

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center p-8 text-slate-400">
                    Nenhum projeto encontrado com os filtros selecionados.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = lista.map((p) => {
        const prioridade = p.is_prioridade
            ? `<span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 border border-red-200 text-lg">●</span>`
            : `<span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-lg">●</span>`;

        const lancamentoPrevisto = formatarData(p.data_lancamento);
        const lancamentoReal = formatarData(p.data_lancamento_real);

        let textoLancamento = lancamentoPrevisto;
        if (p.ja_lancado && p.data_lancamento_real) {
            textoLancamento = lancamentoReal;
        }

        return `
            <tr data-id="${p.id}" class="hover:bg-slate-50 transition">
                <td class="p-4">${prioridade}</td>

                <td class="p-4">
                    <div class="font-semibold text-slate-900 text-lg">${p.nome_projeto || '—'}</div>
                    <div class="text-sm text-slate-500">Artista: ${p.titulo || '—'}</div>
                </td>

                <td class="p-4 text-sm font-medium text-slate-700">${p.formato || '—'}</td>

                <td class="p-4">${badgePlataforma(p.distribuidora)}</td>

                <td class="p-4">${badgeLancamento(p.ja_lancado)}</td>

                <td class="p-4">${badgeStatus(p.audio_status, 'audio')}</td>

                <td class="p-4">${badgeStatus(p.capa_status, 'capa')}</td>

                <td class="p-4 text-sm text-slate-700">
                    <div>${textoLancamento}</div>
                    ${p.ja_lancado && p.data_lancamento_real ? `<div class="text-xs text-slate-400 mt-1">Data real</div>` : ''}
                </td>

                <td class="p-4">
                    <div class="flex items-center justify-center gap-2">
                        <button
                            class="btn-view inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition shadow-sm"
                            title="Visualizar projeto"
                        >
                            <span>👁️</span>
                            <span class="hidden md:inline">Ver</span>
                        </button>

                        <button
                            class="btn-edit inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50 transition shadow-sm"
                            title="Editar projeto"
                        >
                            <span>✏️</span>
                            <span class="hidden md:inline">Editar</span>
                        </button>

                        <button
                            class="btn-delete inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 transition shadow-sm"
                            title="Excluir projeto"
                        >
                            <span>🗑️</span>
                            <span class="hidden md:inline">Excluir</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

document.getElementById('tabela-projetos')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const row = btn.closest('tr');
    if (!row || !row.dataset.id) return;

    const projetoId = row.dataset.id;

    if (btn.classList.contains('btn-view')) {
        window.location.href = `ver-projeto.html?id=${projetoId}`;
        return;
    }

    if (btn.classList.contains('btn-edit')) {
        window.location.href = `editar-projeto.html?id=${projetoId}`;
        return;
    }

    if (btn.classList.contains('btn-delete')) {
        const confirmar = confirm('Tem certeza que deseja excluir este projeto?');
        if (!confirmar) return;

        const { error } = await supabase
            .from('projetos')
            .delete()
            .eq('id', projetoId);

        if (error) {
            alert('Erro ao excluir: ' + error.message);
            return;
        }

        carregarTabela();
    }
});

document.getElementById('busca-projeto')?.addEventListener('input', carregarTabela);
document.getElementById('filtro-lancado')?.addEventListener('change', carregarTabela);
document.getElementById('filtro-audio')?.addEventListener('change', carregarTabela);
document.getElementById('filtro-capa')?.addEventListener('change', carregarTabela);

carregarTabela();