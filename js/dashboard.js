import { supabase } from './supabase-config.js';

let chartPlataforma = null;
let chartLancamento = null;
let chartPipeline = null;

function traduzirStatus(status) {
    const mapa = {
        'AINDA_NAO_TEM': 'Não iniciado',
        'EM_ANDAMENTO': 'Em andamento',
        'CONCLUIDO': 'Concluído'
    };
    return mapa[status] || status || '—';
}

function formatarData(data) {
    if (!data) return '—';
    const dt = new Date(data);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('pt-BR');
}

function destruirGraficos() {
    if (chartPlataforma) chartPlataforma.destroy();
    if (chartLancamento) chartLancamento.destroy();
    if (chartPipeline) chartPipeline.destroy();
}

function criarGraficoPlataforma(metricas) {
    const ctx = document.getElementById('grafico-plataforma');
    if (!ctx) return;

    chartPlataforma = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['The Orchard', 'Believe', 'Sem plataforma'],
            datasets: [{
                data: [
                    metricas.plataformaTheOrchard,
                    metricas.plataformaBelieve,
                    metricas.semPlataforma
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function criarGraficoLancamento(metricas) {
    const ctx = document.getElementById('grafico-lancamento');
    if (!ctx) return;

    chartLancamento = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lançamento'],
            datasets: [
                {
                    label: 'Já lançados',
                    data: [metricas.totalLancados]
                },
                {
                    label: 'Não lançados',
                    data: [metricas.totalNaoLancados]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            borderRadius: 10,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function criarGraficoPipeline(metricas) {
    const ctx = document.getElementById('grafico-pipeline');
    if (!ctx) return;

    chartPipeline = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Produção'],
            datasets: [
                {
                    label: 'Áudio em aberto',
                    data: [metricas.audioPendente]
                },
                {
                    label: 'Capa em aberto',
                    data: [metricas.capaPendente]
                },
                {
                    label: 'Prontos para lançar',
                    data: [metricas.prontosParaLancar]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            borderRadius: 10,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    stacked: false
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function atualizarCards(metricas) {
    document.getElementById('total-projetos').innerText = metricas.totalProjetos;
    document.getElementById('total-prioridades').innerText = metricas.totalPrioridades;
    document.getElementById('total-lancados').innerText = metricas.totalLancados;
    document.getElementById('total-nao-lancados').innerText = metricas.totalNaoLancados;
    document.getElementById('total-prontos-lancar').innerText = metricas.prontosParaLancar;
    document.getElementById('audio-pendente').innerText = metricas.audioPendente;
    document.getElementById('capa-pendente').innerText = metricas.capaPendente;
    document.getElementById('sem-plataforma').innerText = metricas.semPlataforma;

    const resumo = document.getElementById('dashboard-resumo');
    if (resumo) {
        resumo.innerHTML = `
            <strong>${metricas.totalLancados}</strong> lançados,
            <strong>${metricas.totalNaoLancados}</strong> não lançados e
            <strong>${metricas.prontosParaLancar}</strong> prontos para publicação.
            The Orchard: <strong>${metricas.plataformaTheOrchard}</strong> •
            Believe: <strong>${metricas.plataformaBelieve}</strong>
        `;
    }
}

function renderizarListaProximos(proximos) {
    const lista = document.getElementById('lista-proximos');
    if (!lista) return;

    if (!proximos.length) {
        lista.innerHTML = '<p class="text-slate-400">Nenhum lançamento agendado para esta semana.</p>';
        return;
    }

    lista.innerHTML = proximos.map(p => `
        <div class="flex justify-between items-center border-b pb-3 last:border-0">
            <div>
                <a href="editar-projeto.html?id=${p.id}" class="font-medium hover:text-blue-600">${p.nome_projeto || '—'}</a>
                <span class="text-xs text-slate-400 block">Artista: ${p.titulo || '—'}</span>
                <span class="text-xs text-slate-400 block">Plataforma: ${p.distribuidora || '—'}</span>
            </div>
            <span class="text-sm text-slate-500">${formatarData(p.data_lancamento)}</span>
        </div>
    `).join('');
}

function renderizarListaAudio(audioPendentes) {
    const lista = document.getElementById('lista-audio-pendente');
    if (!lista) return;

    if (!audioPendentes.length) {
        lista.innerHTML = '<p class="text-slate-400">Nenhum áudio pendente.</p>';
        return;
    }

    lista.innerHTML = audioPendentes.map(p => `
        <div class="flex items-start gap-3 border-b pb-3 last:border-0">
            <span class="text-blue-600 text-lg">🎵</span>
            <div class="flex-1">
                <a href="editar-projeto.html?id=${p.id}" class="font-medium hover:text-blue-600">${p.nome_projeto || '—'}</a>
                <span class="text-xs text-slate-400 block">Artista: ${p.titulo || '—'}</span>
                <span class="text-xs text-slate-400 block">Status: ${traduzirStatus(p.audio_status)}</span>
            </div>
            ${p.audio_data_inicio ? `<span class="text-xs text-slate-400">Início: ${formatarData(p.audio_data_inicio)}</span>` : ''}
        </div>
    `).join('');
}

function renderizarListaCapa(capaPendentes) {
    const lista = document.getElementById('lista-capa-pendente');
    if (!lista) return;

    if (!capaPendentes.length) {
        lista.innerHTML = '<p class="text-slate-400">Nenhuma capa pendente.</p>';
        return;
    }

    lista.innerHTML = capaPendentes.map(p => `
        <div class="flex items-start gap-3 border-b pb-3 last:border-0">
            <span class="text-purple-600 text-lg">🖼️</span>
            <div class="flex-1">
                <a href="editar-projeto.html?id=${p.id}" class="font-medium hover:text-blue-600">${p.nome_projeto || '—'}</a>
                <span class="text-xs text-slate-400 block">Artista: ${p.titulo || '—'}</span>
                <span class="text-xs text-slate-400 block">Status: ${traduzirStatus(p.capa_status)}</span>
            </div>
            ${p.capa_data_inicio ? `<span class="text-xs text-slate-400">Início: ${formatarData(p.capa_data_inicio)}</span>` : ''}
        </div>
    `).join('');
}

function renderizarListaProntos(prontos) {
    const lista = document.getElementById('lista-prontos');
    if (!lista) return;

    if (!prontos.length) {
        lista.innerHTML = '<p class="text-slate-400">Nenhum projeto pronto para lançar.</p>';
        return;
    }

    lista.innerHTML = prontos.map(p => `
        <div class="flex items-start gap-3 border-b pb-3 last:border-0">
            <span class="text-emerald-600 text-lg">✅</span>
            <div class="flex-1">
                <a href="editar-projeto.html?id=${p.id}" class="font-medium hover:text-blue-600">${p.nome_projeto || '—'}</a>
                <span class="text-xs text-slate-400 block">Artista: ${p.titulo || '—'}</span>
                <span class="text-xs text-slate-400 block">Plataforma: ${p.distribuidora || '—'}</span>
            </div>
            <span class="text-xs text-slate-400">${p.ja_lancado ? 'Lançado' : 'Pronto'}</span>
        </div>
    `).join('');
}

async function carregarDashboard() {
    const { data: projetos, error } = await supabase
        .from('projetos')
        .select(`
            id,
            nome_projeto,
            titulo,
            data_lancamento,
            data_lancamento_real,
            is_prioridade,
            audio_status,
            audio_data_inicio,
            capa_status,
            capa_data_inicio,
            ja_lancado,
            distribuidora
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar dashboard:', error);
        document.getElementById('dashboard-resumo').textContent = 'Erro ao carregar indicadores.';
        return;
    }

    const lista = projetos || [];

    const totalProjetos = lista.length;
    const totalPrioridades = lista.filter(p => p.is_prioridade === true).length;
    const totalLancados = lista.filter(p => p.ja_lancado === true).length;
    const totalNaoLancados = lista.filter(p => p.ja_lancado !== true).length;
    const audioPendente = lista.filter(p => p.audio_status !== 'CONCLUIDO').length;
    const capaPendente = lista.filter(p => p.capa_status !== 'CONCLUIDO').length;
    const prontosParaLancar = lista.filter(
        p => p.audio_status === 'CONCLUIDO' &&
             p.capa_status === 'CONCLUIDO' &&
             p.ja_lancado !== true
    ).length;

    const plataformaTheOrchard = lista.filter(p => p.distribuidora === 'The Orchard').length;
    const plataformaBelieve = lista.filter(p => p.distribuidora === 'Believe').length;
    const semPlataforma = lista.filter(p => !p.distribuidora).length;

    const metricas = {
        totalProjetos,
        totalPrioridades,
        totalLancados,
        totalNaoLancados,
        audioPendente,
        capaPendente,
        prontosParaLancar,
        plataformaTheOrchard,
        plataformaBelieve,
        semPlataforma
    };

    atualizarCards(metricas);

    destruirGraficos();
    criarGraficoPlataforma(metricas);
    criarGraficoLancamento(metricas);
    criarGraficoPipeline(metricas);

    const hoje = new Date();
    const daquiSeteDias = new Date();
    daquiSeteDias.setDate(hoje.getDate() + 7);

    const proximos = lista
        .filter(p => {
            if (!p.data_lancamento) return false;
            const data = new Date(`${p.data_lancamento}T00:00:00`);
            return data >= new Date(hoje.toDateString()) && data <= daquiSeteDias;
        })
        .sort((a, b) => new Date(a.data_lancamento) - new Date(b.data_lancamento))
        .slice(0, 5);

    const audioPendentes = lista
        .filter(p => p.audio_status !== 'CONCLUIDO')
        .slice(0, 5);

    const capaPendentes = lista
        .filter(p => p.capa_status !== 'CONCLUIDO')
        .slice(0, 5);

    const projetosProntos = lista
        .filter(p =>
            p.audio_status === 'CONCLUIDO' &&
            p.capa_status === 'CONCLUIDO'
        )
        .slice(0, 5);

    renderizarListaProximos(proximos);
    renderizarListaAudio(audioPendentes);
    renderizarListaCapa(capaPendentes);
    renderizarListaProntos(projetosProntos);
}

carregarDashboard();