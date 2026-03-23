// editar-projeto.js (versão corrigida com verificações de nulidade)

import { supabase } from './supabase-config.js';

// ============================================================
// FUNÇÕES AUXILIARES (reaproveitadas do criar-lancamento.js)
// ============================================================
async function obterOuCriarPessoa(dadosPessoa) {
    const { nome_completo, nome_artistico, cpf } = dadosPessoa;

    if (cpf && cpf.trim() !== '') {
        const { data, error } = await supabase
            .from('pessoas')
            .select('id')
            .eq('cpf', cpf)
            .maybeSingle();
        if (error) throw error;
        if (data) return data.id;
    }

    if (nome_completo && nome_completo.trim() !== '') {
        const { data, error } = await supabase
            .from('pessoas')
            .select('id')
            .eq('nome_completo', nome_completo)
            .maybeSingle();
        if (error) throw error;
        if (data) return data.id;
    }

    const { data, error } = await supabase
        .from('pessoas')
        .insert({
            nome_completo: nome_completo || null,
            nome_artistico: nome_artistico || null,
            cpf: cpf || null,
        })
        .select('id')
        .single();

    if (error) throw error;
    return data.id;
}

function validarStatusComDatas() {
    const statusGeral = document.getElementById('status_geral')?.value;
    const statusGeralInicio = document.getElementById('status_geral_data_inicio')?.value;
    const statusGeralConclusao = document.getElementById('status_geral_data_conclusao')?.value;

    const capaStatus = document.getElementById('capa_status')?.value;
    const capaInicio = document.getElementById('capa_data_inicio')?.value;
    const capaConclusao = document.getElementById('capa_data_conclusao')?.value;

    if (statusGeral === 'EM_ANDAMENTO' && !statusGeralInicio) {
        throw new Error('Informe a data de início do projeto.');
    }

    if (statusGeral === 'CONCLUIDO') {
        if (!statusGeralInicio || !statusGeralConclusao) {
            throw new Error('Informe a data de início e conclusão do projeto.');
        }
        if (statusGeralConclusao < statusGeralInicio) {
            throw new Error('A data de conclusão do projeto não pode ser menor que a data de início.');
        }
    }

    if (capaStatus === 'EM_ANDAMENTO' && !capaInicio) {
        throw new Error('Informe a data de início da capa.');
    }

    if (capaStatus === 'CONCLUIDO') {
        if (!capaInicio || !capaConclusao) {
            throw new Error('Informe a data de início e conclusão da capa.');
        }
        if (capaConclusao < capaInicio) {
            throw new Error('A data de conclusão da capa não pode ser menor que a data de início.');
        }
    }

    const faixas = document.querySelectorAll('.faixa-item');

    for (let i = 0; i < faixas.length; i++) {
        const faixa = faixas[i];
        const titulo = faixa.querySelector('input[name^="faixa_titulo"]')?.value || `Faixa ${i + 1}`;
        const status = faixa.querySelector('select[name^="faixa_audio_status"]')?.value;
        const inicio = faixa.querySelector('input[name^="faixa_audio_inicio"]')?.value;
        const conclusao = faixa.querySelector('input[name^="faixa_audio_conclusao"]')?.value;

        if (status === 'EM_ANDAMENTO' && !inicio) {
            throw new Error(`Informe a data de início do áudio da faixa "${titulo}".`);
        }

        if (status === 'CONCLUIDO') {
            if (!inicio || !conclusao) {
                throw new Error(`Informe a data de início e conclusão do áudio da faixa "${titulo}".`);
            }
            if (conclusao < inicio) {
                throw new Error(`A data de conclusão do áudio da faixa "${titulo}" não pode ser menor que a data de início.`);
            }
        }
    }
}

function calcularStatusAudioProjeto(faixas) {
    const statuses = [...faixas].map(faixa =>
        faixa.querySelector('select[name^="faixa_audio_status"]')?.value || 'AINDA_NAO_TEM'
    );

    if (statuses.length > 0 && statuses.every(s => s === 'CONCLUIDO')) {
        return 'CONCLUIDO';
    }

    if (statuses.some(s => s === 'EM_ANDAMENTO' || s === 'CONCLUIDO')) {
        return 'EM_ANDAMENTO';
    }

    return 'AINDA_NAO_TEM';
}

function calcularDatasAudioProjeto(faixas) {
    const inicios = [];
    const conclusoes = [];

    [...faixas].forEach(faixa => {
        const status = faixa.querySelector('select[name^="faixa_audio_status"]')?.value;
        const inicio = faixa.querySelector('input[name^="faixa_audio_inicio"]')?.value;
        const conclusao = faixa.querySelector('input[name^="faixa_audio_conclusao"]')?.value;

        if ((status === 'EM_ANDAMENTO' || status === 'CONCLUIDO') && inicio) {
            inicios.push(inicio);
        }

        if (status === 'CONCLUIDO' && conclusao) {
            conclusoes.push(conclusao);
        }
    });

    return {
        audio_data_inicio: inicios.length ? inicios.sort()[0] : null,
        audio_data_conclusao: conclusoes.length === faixas.length && conclusoes.length > 0
            ? conclusoes.sort().slice(-1)[0]
            : null
    };
}

// ============================================================
// FUNÇÕES DE MANIPULAÇÃO DE FAIXAS (reaproveitadas)
// ============================================================
function adicionarLinhaParticipante(container, tipo, faixaIndex) {
    const novaLinha = document.createElement('div');
    novaLinha.className = 'grid grid-cols-1 md:grid-cols-4 gap-2 items-end';
    novaLinha.innerHTML = `
        <input type="text" placeholder="Nome artístico" name="${tipo}_artistico[${faixaIndex}][]" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        <input type="text" placeholder="Nome completo" name="${tipo}_completo[${faixaIndex}][]" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        <input type="text" placeholder="CPF" name="${tipo}_cpf[${faixaIndex}][]" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        <button type="button" class="remover-${tipo} text-red-500 text-sm px-2">Remover</button>
    `;
    container.appendChild(novaLinha);
    novaLinha.querySelector(`.remover-${tipo}`).addEventListener('click', () => novaLinha.remove());
}

function criarFaixa(index, dados = null) {
    const faixaTemplate = document.getElementById('faixa-template');
    const clone = faixaTemplate.content.cloneNode(true);
    const faixaDiv = clone.querySelector('.faixa-item');
    faixaDiv.dataset.index = index;

    // Renomear campos para incluir o índice
    faixaDiv.querySelectorAll('[name*="[]"]').forEach(el => {
        const name = el.getAttribute('name');
        const newName = name.replace(/\[\]$/, `[${index}]`);
        el.setAttribute('name', newName);
    });

    // Evento de mudança de status do áudio
    faixaDiv.querySelectorAll('.audio-status-select').forEach(select => {
        select.addEventListener('change', function () {
            atualizarDatasAudio(this);
        });
    });

    // Botão remover faixa
    const removerBtn = faixaDiv.querySelector('.remover-faixa');
    removerBtn.addEventListener('click', function() {
        faixaDiv.remove();
        reindexarFaixas();
    });

    // Adicionar compositor
    faixaDiv.querySelector('.adicionar-compositor').addEventListener('click', function(e) {
        const container = faixaDiv.querySelector('.compositores-container');
        if (container) adicionarLinhaParticipante(container, 'compositor', index);
    });

    // Adicionar intérprete
    faixaDiv.querySelector('.adicionar-interprete').addEventListener('click', function(e) {
        const container = faixaDiv.querySelector('.interpretes-container');
        if (container) adicionarLinhaParticipante(container, 'interprete', index);
    });

    // Se dados foram fornecidos, preencher
    if (dados) {
        const tituloInput = faixaDiv.querySelector('input[name^="faixa_titulo"]');
        if (tituloInput) tituloInput.value = dados.titulo || '';

        const isrcInput = faixaDiv.querySelector('input[name^="faixa_isrc"]');
        if (isrcInput) isrcInput.value = dados.isrc || '';

        const hookInput = faixaDiv.querySelector('input[name^="faixa_hook"]');
        if (hookInput) hookInput.value = dados.hook_tiktok || '';

        const featInput = faixaDiv.querySelector('input[name^="faixa_feat"]');
        if (featInput) featInput.value = dados.feat || '';

        const letraTextarea = faixaDiv.querySelector('textarea[name^="faixa_letra"]');
        if (letraTextarea) letraTextarea.value = dados.letra || '';

        const audioStatusSelect = faixaDiv.querySelector('select[name^="faixa_audio_status"]');
        if (audioStatusSelect) {
            audioStatusSelect.value = dados.audio_status || 'AINDA_NAO_TEM';
            atualizarDatasAudio(audioStatusSelect);
        }

        const audioInicioInput = faixaDiv.querySelector('input[name^="faixa_audio_inicio"]');
        if (audioInicioInput && dados.audio_data_inicio) {
            audioInicioInput.value = dados.audio_data_inicio;
        }

        const audioConclusaoInput = faixaDiv.querySelector('input[name^="faixa_audio_conclusao"]');
        if (audioConclusaoInput && dados.audio_data_conclusao) {
            audioConclusaoInput.value = dados.audio_data_conclusao;
        }
    }

    return faixaDiv;
}

function reindexarFaixas() {
    const faixas = document.querySelectorAll('.faixa-item');
    faixas.forEach((faixa, idx) => {
        faixa.dataset.index = idx;
        const tituloH3 = faixa.querySelector('h3');
        if (tituloH3) tituloH3.innerText = `Faixa ${idx + 1}`;

        faixa.querySelectorAll('[name*="["]').forEach(el => {
            const name = el.getAttribute('name');
            const newName = name.replace(/\[\d+\]/, `[${idx}]`);
            el.setAttribute('name', newName);
        });

        const removerBtn = faixa.querySelector('.remover-faixa');
        if (faixas.length > 1) {
            removerBtn.classList.remove('hidden');
        } else {
            removerBtn.classList.add('hidden');
        }
    });
}

function gerarFaixas(quantidade, dadosFaixas = null) {
    const faixasContainer = document.getElementById('faixas-container');
    if (!faixasContainer) {
        console.error('Elemento #faixas-container não encontrado!');
        return;
    }
    faixasContainer.innerHTML = '';
    for (let i = 0; i < quantidade; i++) {
        const dados = dadosFaixas && dadosFaixas[i] ? dadosFaixas[i] : null;
        const novaFaixa = criarFaixa(i, dados);
        faixasContainer.appendChild(novaFaixa);
    }
    reindexarFaixas();
}

// Função para popular compositores/interpretes de uma faixa (com verificação)
function popularParticipantesFaixa(faixaDiv, participantes, faixaId, tipo) {
    const container = faixaDiv.querySelector(`.${tipo}s-container`);
    if (!container) {
        console.warn(`Container .${tipo}s-container não encontrado na faixa`, faixaDiv);
        return;
    }
    container.innerHTML = ''; // limpa

    const participantesFiltrados = participantes.filter(p => p.papel === (tipo === 'compositor' ? 'AUTOR' : 'INTERPRETE') && p.faixa_id === faixaId);
    for (const part of participantesFiltrados) {
        const novaLinha = document.createElement('div');
        novaLinha.className = 'grid grid-cols-1 md:grid-cols-4 gap-2 items-end';
        novaLinha.innerHTML = `
            <input type="text" placeholder="Nome artístico" name="${tipo}_artistico[${faixaDiv.dataset.index}][]" value="${part.nome_artistico || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <input type="text" placeholder="Nome completo" name="${tipo}_completo[${faixaDiv.dataset.index}][]" value="${part.nome_completo || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <input type="text" placeholder="CPF" name="${tipo}_cpf[${faixaDiv.dataset.index}][]" value="${part.cpf || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <button type="button" class="remover-${tipo} text-red-500 text-sm px-2">Remover</button>
        `;
        container.appendChild(novaLinha);
        novaLinha.querySelector(`.remover-${tipo}`).addEventListener('click', () => novaLinha.remove());
    }
}

// ============================================================
// FUNÇÕES DE ATUALIZAÇÃO DE DATAS E DISTRIBUIDORA
// ============================================================
const statusGeral = document.getElementById('status_geral');
const statusGeralDataInicioDiv = document.getElementById('status-geral-data-inicio');
const statusGeralDataConclusaoDiv = document.getElementById('status-geral-data-conclusao');
const statusGeralDistribuidoraDiv = document.getElementById('status-geral-distribuidora');
const statusGeralDataInicio = document.getElementById('status_geral_data_inicio');
const statusGeralDataConclusao = document.getElementById('status_geral_data_conclusao');
const distribuidoraSelect = document.getElementById('distribuidora');
const distribuidoraOutra = document.getElementById('distribuidora_outra');

const capaStatus = document.getElementById('capa_status');
const capaDataInicioDiv = document.getElementById('capa-data-inicio');
const capaDataConclusaoDiv = document.getElementById('capa-data-conclusao');
const capaDataInicio = document.getElementById('capa_data_inicio');
const capaDataConclusao = document.getElementById('capa_data_conclusao');

function atualizarDatasStatusGeral() {
    const status = statusGeral.value;
    if (statusGeralDataInicioDiv) statusGeralDataInicioDiv.classList.add('hidden');
    if (statusGeralDataConclusaoDiv) statusGeralDataConclusaoDiv.classList.add('hidden');
    if (statusGeralDistribuidoraDiv) statusGeralDistribuidoraDiv.classList.add('hidden');
    if (distribuidoraOutra) distribuidoraOutra.classList.add('hidden');

    if (status === 'AINDA_NAO_TEM') {
        if (statusGeralDataInicio) statusGeralDataInicio.value = '';
        if (statusGeralDataConclusao) statusGeralDataConclusao.value = '';
        if (distribuidoraSelect) distribuidoraSelect.value = '';
    } else if (status === 'EM_ANDAMENTO') {
        if (statusGeralDataInicioDiv) statusGeralDataInicioDiv.classList.remove('hidden');
        if (statusGeralDataConclusao) statusGeralDataConclusao.value = '';
        if (distribuidoraSelect) distribuidoraSelect.value = '';
    } else if (status === 'CONCLUIDO') {
        if (statusGeralDataInicioDiv) statusGeralDataInicioDiv.classList.remove('hidden');
        if (statusGeralDataConclusaoDiv) statusGeralDataConclusaoDiv.classList.remove('hidden');
        if (statusGeralDistribuidoraDiv) statusGeralDistribuidoraDiv.classList.remove('hidden');
    }
}

if (distribuidoraSelect) {
    distribuidoraSelect.addEventListener('change', function() {
        if (this.value === 'Outra') {
            if (distribuidoraOutra) distribuidoraOutra.classList.remove('hidden');
        } else {
            if (distribuidoraOutra) distribuidoraOutra.classList.add('hidden');
            if (distribuidoraOutra) distribuidoraOutra.value = '';
        }
    });
}

function atualizarDatasCapa() {
    const status = capaStatus.value;
    if (capaDataInicioDiv) capaDataInicioDiv.classList.add('hidden');
    if (capaDataConclusaoDiv) capaDataConclusaoDiv.classList.add('hidden');

    if (status === 'AINDA_NAO_TEM') {
        if (capaDataInicio) capaDataInicio.value = '';
        if (capaDataConclusao) capaDataConclusao.value = '';
    } else if (status === 'EM_ANDAMENTO') {
        if (capaDataInicioDiv) capaDataInicioDiv.classList.remove('hidden');
        if (capaDataConclusao) capaDataConclusao.value = '';
    } else if (status === 'CONCLUIDO') {
        if (capaDataInicioDiv) capaDataInicioDiv.classList.remove('hidden');
        if (capaDataConclusaoDiv) capaDataConclusaoDiv.classList.remove('hidden');
    }
}

function atualizarDatasAudio(selectElement) {
    const parent = selectElement.closest('.faixa-item');
    if (!parent) return;
    const inicioDiv = parent.querySelector('.audio-data-inicio');
    const conclusaoDiv = parent.querySelector('.audio-data-conclusao');
    if (!inicioDiv || !conclusaoDiv) return;
    const inputInicio = inicioDiv.querySelector('input');
    const inputConclusao = conclusaoDiv.querySelector('input');

    inicioDiv.classList.add('hidden');
    conclusaoDiv.classList.add('hidden');

    if (selectElement.value === 'AINDA_NAO_TEM') {
        if (inputInicio) inputInicio.value = '';
        if (inputConclusao) inputConclusao.value = '';
    } else if (selectElement.value === 'EM_ANDAMENTO') {
        inicioDiv.classList.remove('hidden');
        if (inputConclusao) inputConclusao.value = '';
    } else if (selectElement.value === 'CONCLUIDO') {
        inicioDiv.classList.remove('hidden');
        conclusaoDiv.classList.remove('hidden');
    }
}

// ============================================================
// CARREGAR DADOS DO PROJETO
// ============================================================
const urlParams = new URLSearchParams(window.location.search);
const projetoId = urlParams.get('id');

if (!projetoId) {
    alert('ID do projeto não informado.');
    window.location.href = 'gerenciar-projetos.html';
}

async function carregarProjeto() {
    try {
        // 1. Carregar projeto
        const { data: projeto, error: erroProjeto } = await supabase
            .from('projetos')
            .select('*')
            .eq('id', projetoId)
            .single();

        if (erroProjeto) throw erroProjeto;
        if (!projeto) {
            alert('Projeto não encontrado.');
            window.location.href = 'gerenciar-projetos.html';
            return;
        }

        // 2. Carregar faixas
        const { data: faixas, error: erroFaixas } = await supabase
            .from('faixas')
            .select('*')
            .eq('projeto_id', projetoId)
            .order('numero_faixa', { ascending: true });

        if (erroFaixas) throw erroFaixas;

        // 3. Carregar participantes (com pessoas)
        const { data: participantes, error: erroParticipantes } = await supabase
            .from('projeto_participantes')
            .select(`
                *,
                pessoas (id, nome_artistico, nome_completo, cpf)
            `)
            .eq('projeto_id', projetoId);

        if (erroParticipantes) throw erroParticipantes;

        // 4. Preencher campos gerais
        document.getElementById('nome_projeto').value = projeto.nome_projeto || '';
        document.getElementById('titulo_principal').value = projeto.titulo || '';
        document.getElementById('feat_projeto').value = projeto.feat_projeto || '';
        document.getElementById('formato').value = projeto.formato || 'SINGLE';
        document.getElementById('data_lancamento').value = projeto.data_lancamento || '';
        const generoCompleto = projeto.genero_subgenero || '';
        const [genero, subgenero] = generoCompleto.split(' / ');
        document.getElementById('genero').value = genero || '';
        document.getElementById('subgenero').value = subgenero || '';
        document.getElementById('label').value = projeto.label || '';
        document.getElementById('is_prioridade').checked = projeto.is_prioridade || false;

        document.getElementById('status_geral').value = projeto.status_geral || 'AINDA_NAO_TEM';
        document.getElementById('status_geral_data_inicio').value = projeto.status_geral_data_inicio || '';
        document.getElementById('status_geral_data_conclusao').value = projeto.status_geral_data_conclusao || '';

        const distribuidoraVal = projeto.distribuidora || '';
        if (distribuidoraVal && ['The Orchard', 'Believe'].includes(distribuidoraVal)) {
            distribuidoraSelect.value = distribuidoraVal;
        } else if (distribuidoraVal) {
            distribuidoraSelect.value = 'Outra';
            if (distribuidoraOutra) {
                distribuidoraOutra.value = distribuidoraVal;
                distribuidoraOutra.classList.remove('hidden');
            }
        } else {
            distribuidoraSelect.value = '';
        }

        document.getElementById('spotify_id').value = projeto.spotify_id || '';
        document.getElementById('apple_music_id').value = projeto.apple_music_id || '';
        document.getElementById('backup_url').value = projeto.backup_url || '';
        document.getElementById('release_texto').value = projeto.release_texto || '';
        document.getElementById('notas').value = projeto.notas || '';

        document.getElementById('capa_status').value = projeto.capa_status || 'AINDA_NAO_TEM';
        document.getElementById('capa_data_inicio').value = projeto.capa_data_inicio || '';
        document.getElementById('capa_data_conclusao').value = projeto.capa_data_conclusao || '';

        atualizarDatasStatusGeral();
        atualizarDatasCapa();

        // 5. Gerar faixas com dados
        const formato = projeto.formato;
        const numFaixas = faixas.length;
        const configFaixasDiv = document.getElementById('config-faixas');
        if (formato === 'SINGLE') {
            if (configFaixasDiv) configFaixasDiv.classList.add('hidden');
            gerarFaixas(1, faixas);
        } else {
            if (configFaixasDiv) configFaixasDiv.classList.remove('hidden');
            const numFaixasInput = document.getElementById('num-faixas');
            if (numFaixasInput) numFaixasInput.value = numFaixas || 2;
            gerarFaixas(numFaixas, faixas);
        }

        // 6. Popular compositores e intérpretes de cada faixa
        for (let i = 0; i < faixas.length; i++) {
            const faixa = faixas[i];
            const faixaDiv = document.querySelector(`.faixa-item[data-index="${i}"]`);
            if (!faixaDiv) continue;

            const participantesFaixa = participantes.filter(p => p.faixa_id === faixa.id).map(p => ({
                papel: p.papel,
                faixa_id: p.faixa_id,
                nome_artistico: p.pessoas?.nome_artistico,
                nome_completo: p.pessoas?.nome_completo,
                cpf: p.pessoas?.cpf
            }));

            popularParticipantesFaixa(faixaDiv, participantesFaixa, faixa.id, 'compositor');
            popularParticipantesFaixa(faixaDiv, participantesFaixa, faixa.id, 'interprete');
        }

        // 7. Popular produtores
        const produtoresContainer = document.getElementById('produtores-container');
        if (produtoresContainer) {
            produtoresContainer.innerHTML = '';
            const produtores = participantes.filter(p => p.papel === 'PRODUTOR_MUSICAL' && !p.faixa_id);
            for (const prod of produtores) {
                const row = document.createElement('div');
                row.className = 'grid grid-cols-1 md:grid-cols-4 gap-2 items-end';
                row.innerHTML = `
                    <input type="text" placeholder="Nome artístico" name="produtor_artistico[]" value="${prod.pessoas?.nome_artistico || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <input type="text" placeholder="Nome completo" name="produtor_completo[]" value="${prod.pessoas?.nome_completo || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <input type="text" placeholder="CPF" name="produtor_cpf[]" value="${prod.pessoas?.cpf || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <button type="button" class="remover-produtor text-red-500 text-sm px-2">Remover</button>
                `;
                produtoresContainer.appendChild(row);
                row.querySelector('.remover-produtor').addEventListener('click', () => row.remove());
            }
        }

        // 8. Popular músicos
        const musicosContainer = document.getElementById('musicos-container');
        if (musicosContainer) {
            musicosContainer.innerHTML = '';
            const musicos = participantes.filter(p => p.papel === 'MUSICO' && !p.faixa_id);
            for (const mus of musicos) {
                const row = document.createElement('div');
                row.className = 'grid grid-cols-1 md:grid-cols-5 gap-2 items-end';
                row.innerHTML = `
                    <input type="text" placeholder="Nome artístico" name="musico_artistico[]" value="${mus.pessoas?.nome_artistico || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <input type="text" placeholder="Nome completo" name="musico_completo[]" value="${mus.pessoas?.nome_completo || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <input type="text" placeholder="CPF" name="musico_cpf[]" value="${mus.pessoas?.cpf || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <input type="text" placeholder="Instrumento" name="musico_instrumento[]" value="${mus.instrumento || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <button type="button" class="remover-musico text-red-500 text-sm px-2">Remover</button>
                `;
                musicosContainer.appendChild(row);
                row.querySelector('.remover-musico').addEventListener('click', () => row.remove());
            }
        }

    } catch (error) {
        console.error('Erro ao carregar projeto:', error);
        alert('Erro ao carregar projeto: ' + error.message);
        window.location.href = 'gerenciar-projetos.html';
    }
}

// ============================================================
// SUBMISSÃO DO FORMULÁRIO (UPDATE)
// ============================================================
document.getElementById('form-lancamento').addEventListener('submit', async function (event) {
    event.preventDefault();
    const btnSalvar = document.getElementById('btn-salvar');
    btnSalvar.innerText = 'Salvando...';
    btnSalvar.disabled = true;

    try {
        validarStatusComDatas();

        const faixas = document.querySelectorAll('.faixa-item');
        const audio_status = calcularStatusAudioProjeto(faixas);
        const { audio_data_inicio, audio_data_conclusao } = calcularDatasAudioProjeto(faixas);

        let distribuidora = distribuidoraSelect.value;
        if (distribuidora === 'Outra') {
            distribuidora = distribuidoraOutra.value.trim();
            if (!distribuidora) {
                throw new Error('Informe o nome da distribuidora no campo "Outra".');
            }
        }

        const statusGeralVal = document.getElementById('status_geral').value;

        const projetoData = {
            nome_projeto: document.getElementById('nome_projeto').value,
            titulo: document.getElementById('titulo_principal').value || null,
            feat_projeto: document.getElementById('feat_projeto')?.value || null,
            formato: document.getElementById('formato').value,
            data_lancamento: document.getElementById('data_lancamento').value || null,
            genero_subgenero: (document.getElementById('genero').value + (document.getElementById('subgenero').value ? ' / ' + document.getElementById('subgenero').value : '')).trim() || null,
            label: document.getElementById('label').value || null,
            is_prioridade: document.getElementById('is_prioridade').checked,
            status_geral: statusGeralVal,
            status_geral_data_inicio: document.getElementById('status_geral_data_inicio').value || null,
            status_geral_data_conclusao: document.getElementById('status_geral_data_conclusao').value || null,
            distribuidora: distribuidora || null,
            spotify_id: document.getElementById('spotify_id').value || null,
            apple_music_id: document.getElementById('apple_music_id').value || null,
            backup_url: document.getElementById('backup_url').value || null,
            release_texto: document.getElementById('release_texto').value || null,
            notas: document.getElementById('notas').value || null,
            capa_status: document.getElementById('capa_status').value,
            capa_data_inicio: document.getElementById('capa_data_inicio').value || null,
            capa_data_conclusao: document.getElementById('capa_data_conclusao').value || null,
            audio_status,
            audio_data_inicio,
            audio_data_conclusao,
            ja_lancado: statusGeralVal === 'CONCLUIDO'
        };

        const { error: erroProjeto } = await supabase
            .from('projetos')
            .update(projetoData)
            .eq('id', projetoId);

        if (erroProjeto) throw erroProjeto;

        // Deletar participantes e faixas
        const { error: erroDelParticipantes } = await supabase
            .from('projeto_participantes')
            .delete()
            .eq('projeto_id', projetoId);
        if (erroDelParticipantes) throw erroDelParticipantes;

        const { error: erroDelFaixas } = await supabase
            .from('faixas')
            .delete()
            .eq('projeto_id', projetoId);
        if (erroDelFaixas) throw erroDelFaixas;

        // Recriar faixas e participantes
        for (let i = 0; i < faixas.length; i++) {
            const faixa = faixas[i];
            const titulo = faixa.querySelector('input[name^="faixa_titulo"]').value;
            const isrc = faixa.querySelector('input[name^="faixa_isrc"]')?.value || null;
            const hook = faixa.querySelector('input[name^="faixa_hook"]')?.value || null;
            const feat = faixa.querySelector('input[name^="faixa_feat"]')?.value || null;
            const letra = faixa.querySelector('textarea[name^="faixa_letra"]')?.value || null;
            const audioStatus = faixa.querySelector('select[name^="faixa_audio_status"]').value;
            const audioInicio = faixa.querySelector('input[name^="faixa_audio_inicio"]')?.value || null;
            const audioConclusao = faixa.querySelector('input[name^="faixa_audio_conclusao"]')?.value || null;

            const { data: faixaInserida, error: erroFaixa } = await supabase
                .from('faixas')
                .insert({
                    projeto_id: projetoId,
                    titulo: titulo,
                    isrc: isrc,
                    hook_tiktok: hook,
                    feat: feat,
                    letra: letra,
                    audio_status: audioStatus,
                    audio_data_inicio: audioInicio,
                    audio_data_conclusao: audioConclusao,
                    numero_faixa: i + 1
                })
                .select('id')
                .single();

            if (erroFaixa) throw erroFaixa;
            const faixaId = faixaInserida.id;

            // Compositores
            const compositoresRows = faixa.querySelectorAll('.compositores-container .grid');
            for (let row of compositoresRows) {
                const nomeArtistico = row.querySelector('input[name^="compositor_artistico"]')?.value;
                const nomeCompleto = row.querySelector('input[name^="compositor_completo"]')?.value;
                const cpf = row.querySelector('input[name^="compositor_cpf"]')?.value;

                if (!nomeCompleto && !cpf) continue;

                const pessoaId = await obterOuCriarPessoa({ nome_completo: nomeCompleto, nome_artistico: nomeArtistico, cpf: cpf });

                await supabase.from('projeto_participantes').insert({
                    projeto_id: projetoId,
                    faixa_id: faixaId,
                    pessoa_id: pessoaId,
                    papel: 'AUTOR',
                });
            }

            // Intérpretes
            const interpretesRows = faixa.querySelectorAll('.interpretes-container .grid');
            for (let row of interpretesRows) {
                const nomeArtistico = row.querySelector('input[name^="interprete_artistico"]')?.value;
                const nomeCompleto = row.querySelector('input[name^="interprete_completo"]')?.value;
                const cpf = row.querySelector('input[name^="interprete_cpf"]')?.value;

                if (!nomeCompleto && !cpf) continue;

                const pessoaId = await obterOuCriarPessoa({ nome_completo: nomeCompleto, nome_artistico: nomeArtistico, cpf: cpf });

                await supabase.from('projeto_participantes').insert({
                    projeto_id: projetoId,
                    faixa_id: faixaId,
                    pessoa_id: pessoaId,
                    papel: 'INTERPRETE',
                });
            }
        }

        // Produtores
        const produtoresRows = document.querySelectorAll('#produtores-container .grid');
        for (let row of produtoresRows) {
            const nomeArtistico = row.querySelector('input[name="produtor_artistico[]"]')?.value;
            const nomeCompleto = row.querySelector('input[name="produtor_completo[]"]')?.value;
            const cpf = row.querySelector('input[name="produtor_cpf[]"]')?.value;

            if (!nomeCompleto && !cpf) continue;

            const pessoaId = await obterOuCriarPessoa({ nome_completo: nomeCompleto, nome_artistico: nomeArtistico, cpf: cpf });

            await supabase.from('projeto_participantes').insert({
                projeto_id: projetoId,
                faixa_id: null,
                pessoa_id: pessoaId,
                papel: 'PRODUTOR_MUSICAL',
            });
        }

        // Músicos
        const musicosRows = document.querySelectorAll('#musicos-container .grid');
        for (let row of musicosRows) {
            const nomeArtistico = row.querySelector('input[name="musico_artistico[]"]')?.value;
            const nomeCompleto = row.querySelector('input[name="musico_completo[]"]')?.value;
            const cpf = row.querySelector('input[name="musico_cpf[]"]')?.value;
            const instrumento = row.querySelector('input[name="musico_instrumento[]"]')?.value;

            if (!nomeCompleto && !cpf) continue;

            const pessoaId = await obterOuCriarPessoa({ nome_completo: nomeCompleto, nome_artistico: nomeArtistico, cpf: cpf });

            await supabase.from('projeto_participantes').insert({
                projeto_id: projetoId,
                faixa_id: null,
                pessoa_id: pessoaId,
                papel: 'MUSICO',
                instrumento: instrumento || null
            });
        }

        alert('Projeto atualizado com sucesso!');
        window.location.href = 'gerenciar-projetos.html';

    } catch (error) {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao atualizar o projeto: ' + error.message);
        btnSalvar.innerText = 'Atualizar Projeto';
        btnSalvar.disabled = false;
    }
});

// ============================================================
// EVENTOS INICIAIS
// ============================================================
if (statusGeral) statusGeral.addEventListener('change', atualizarDatasStatusGeral);
if (capaStatus) capaStatus.addEventListener('change', atualizarDatasCapa);
atualizarDatasStatusGeral();
atualizarDatasCapa();

const formatoSelect = document.getElementById('formato');
const configFaixas = document.getElementById('config-faixas');
const gerarFaixasBtn = document.getElementById('gerar-faixas');
const numFaixasInput = document.getElementById('num-faixas');

if (formatoSelect) {
    formatoSelect.addEventListener('change', function() {
        if (this.value === 'SINGLE') {
            if (configFaixas) configFaixas.classList.add('hidden');
            gerarFaixas(1);
        } else {
            if (configFaixas) configFaixas.classList.remove('hidden');
            if (document.querySelectorAll('.faixa-item').length === 0) {
                gerarFaixas(2);
            }
        }
    });
}

if (gerarFaixasBtn) {
    gerarFaixasBtn.addEventListener('click', function() {
        const num = parseInt(numFaixasInput.value) || 2;
        gerarFaixas(num);
    });
}

// Adicionar produtor e músico (com verificações)
const adicionarProdutorBtn = document.getElementById('adicionar-produtor');
if (adicionarProdutorBtn) {
    adicionarProdutorBtn.addEventListener('click', function() {
        const container = document.getElementById('produtores-container');
        if (!container) return;
        const newRow = document.createElement('div');
        newRow.className = 'grid grid-cols-1 md:grid-cols-4 gap-2 items-end';
        newRow.innerHTML = `
            <input type="text" placeholder="Nome artístico" name="produtor_artistico[]" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <input type="text" placeholder="Nome completo" name="produtor_completo[]" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <input type="text" placeholder="CPF" name="produtor_cpf[]" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <button type="button" class="remover-produtor text-red-500 text-sm px-2">Remover</button>
        `;
        container.appendChild(newRow);
        newRow.querySelector('.remover-produtor').addEventListener('click', () => newRow.remove());
    });
}

const adicionarMusicoBtn = document.getElementById('adicionar-musico');
if (adicionarMusicoBtn) {
    adicionarMusicoBtn.addEventListener('click', function() {
        const container = document.getElementById('musicos-container');
        if (!container) return;
        const newRow = document.createElement('div');
        newRow.className = 'grid grid-cols-1 md:grid-cols-5 gap-2 items-end';
        newRow.innerHTML = `
            <input type="text" placeholder="Nome artístico" name="musico_artistico[]" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <input type="text" placeholder="Nome completo" name="musico_completo[]" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <input type="text" placeholder="CPF" name="musico_cpf[]" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <input type="text" placeholder="Instrumento" name="musico_instrumento[]" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <button type="button" class="remover-musico text-red-500 text-sm px-2">Remover</button>
        `;
        container.appendChild(newRow);
        newRow.querySelector('.remover-musico').addEventListener('click', () => newRow.remove());
    });
}

// Iniciar carregamento
carregarProjeto();