import { supabase } from './supabase-config.js';

async function carregarDashboard() {
    // ========== CARDS (TOTAIS) ==========
    const { count: totalProjetos } = await supabase
        .from('projetos')
        .select('*', { count: 'exact', head: true });

    const { count: totalPrioridades } = await supabase
        .from('projetos')
        .select('*', { count: 'exact', head: true })
        .eq('is_prioridade', true);

    const { count: audioPendente } = await supabase
        .from('projetos')
        .select('*', { count: 'exact', head: true })
        .neq('audio_status', 'CONCLUIDO');

    const { count: capaPendente } = await supabase
        .from('projetos')
        .select('*', { count: 'exact', head: true })
        .neq('capa_status', 'CONCLUIDO');

    document.getElementById('total-projetos').innerText = totalProjetos ?? 0;
    document.getElementById('total-prioridades').innerText = totalPrioridades ?? 0;
    document.getElementById('audio-pendente').innerText = audioPendente ?? 0;
    document.getElementById('capa-pendente').innerText = capaPendente ?? 0;

    // ========== PRÓXIMOS LANÇAMENTOS (7 dias) ==========
    const hoje = new Date().toISOString().split('T')[0];
    const seteDias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: proximos } = await supabase
        .from('projetos')
        .select('id, nome_projeto, titulo, data_lancamento')
        .gte('data_lancamento', hoje)
        .lte('data_lancamento', seteDias)
        .order('data_lancamento', { ascending: true })
        .limit(5);

    const listaProximos = document.getElementById('lista-proximos');
    if (proximos && proximos.length > 0) {
        listaProximos.innerHTML = proximos.map(p => `
            <div class="flex justify-between items-center border-b pb-2 last:border-0">
                <div>
                    <a href="editar-projeto.html?id=${p.id}" class="font-medium hover:text-blue-600">${p.nome_projeto}</a>
                    <span class="text-xs text-slate-400 block">${p.titulo || '—'}</span>
                </div>
                <span class="text-sm text-slate-500">${new Date(p.data_lancamento).toLocaleDateString('pt-BR')}</span>
            </div>
        `).join('');
    } else {
        listaProximos.innerHTML = '<p class="text-slate-400">Nenhum lançamento agendado para esta semana.</p>';
    }

    // ========== ÁUDIO EM ABERTO (top 5) ==========
    const { data: audioPendentes } = await supabase
        .from('projetos')
        .select('id, nome_projeto, titulo, audio_status, audio_data_inicio')
        .neq('audio_status', 'CONCLUIDO')
        .order('created_at', { ascending: false })
        .limit(5);

    const listaAudio = document.getElementById('lista-audio-pendente');
    if (audioPendentes && audioPendentes.length > 0) {
        listaAudio.innerHTML = audioPendentes.map(p => `
            <div class="flex items-start gap-2 border-b pb-2 last:border-0">
                <span class="text-blue-600 text-lg">🎵</span>
                <div class="flex-1">
                    <a href="editar-projeto.html?id=${p.id}" class="font-medium hover:text-blue-600">${p.nome_projeto}</a>
                    <span class="text-xs text-slate-400 block">${p.titulo || '—'} • Status: ${traduzirStatus(p.audio_status)}</span>
                </div>
                ${p.audio_data_inicio ? `<span class="text-xs text-slate-400">Início: ${new Date(p.audio_data_inicio).toLocaleDateString('pt-BR')}</span>` : ''}
            </div>
        `).join('');
    } else {
        listaAudio.innerHTML = '<p class="text-slate-400">Nenhum áudio pendente.</p>';
    }

    // ========== CAPAS EM ABERTO (top 5) ==========
    const { data: capaPendentes } = await supabase
        .from('projetos')
        .select('id, nome_projeto, titulo, capa_status, capa_data_inicio')
        .neq('capa_status', 'CONCLUIDO')
        .order('created_at', { ascending: false })
        .limit(5);

    const listaCapa = document.getElementById('lista-capa-pendente');
    if (capaPendentes && capaPendentes.length > 0) {
        listaCapa.innerHTML = capaPendentes.map(p => `
            <div class="flex items-start gap-2 border-b pb-2 last:border-0">
                <span class="text-purple-600 text-lg">🖼️</span>
                <div class="flex-1">
                    <a href="editar-projeto.html?id=${p.id}" class="font-medium hover:text-blue-600">${p.nome_projeto}</a>
                    <span class="text-xs text-slate-400 block">${p.titulo || '—'} • Status: ${traduzirStatus(p.capa_status)}</span>
                </div>
                ${p.capa_data_inicio ? `<span class="text-xs text-slate-400">Início: ${new Date(p.capa_data_inicio).toLocaleDateString('pt-BR')}</span>` : ''}
            </div>
        `).join('');
    } else {
        listaCapa.innerHTML = '<p class="text-slate-400">Nenhuma capa pendente.</p>';
    }

    // ========== PROJETOS PRONTOS (concluídos) ==========
    const { data: projetosProntos } = await supabase
        .from('projetos')
        .select('id, nome_projeto, titulo, data_lancamento')
        .eq('audio_status', 'CONCLUIDO')
        .eq('capa_status', 'CONCLUIDO')
        .order('data_lancamento', { ascending: false })
        .limit(5);

    const listaProntos = document.getElementById('lista-prontos');
    if (projetosProntos && projetosProntos.length > 0) {
        listaProntos.innerHTML = projetosProntos.map(p => `
            <div class="flex items-start gap-2 border-b pb-2 last:border-0">
                <span class="text-green-600 text-lg">✅</span>
                <div class="flex-1">
                    <a href="editar-projeto.html?id=${p.id}" class="font-medium hover:text-blue-600">${p.nome_projeto}</a>
                    <span class="text-xs text-slate-400 block">${p.titulo || '—'}</span>
                </div>
                ${p.data_lancamento ? `<span class="text-xs text-slate-400">Lançamento: ${new Date(p.data_lancamento).toLocaleDateString('pt-BR')}</span>` : ''}
            </div>
        `).join('');
    } else {
        listaProntos.innerHTML = '<p class="text-slate-400">Nenhum projeto concluído.</p>';
    }
}

// Função auxiliar para traduzir status
function traduzirStatus(status) {
    const mapa = {
        'AINDA_NAO_TEM': 'Não iniciado',
        'EM_ANDAMENTO': 'Em andamento',
        'CONCLUIDO': 'Concluído'
    };
    return mapa[status] || status;
}

carregarDashboard();