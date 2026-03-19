import { supabase } from './supabase-config.js';

// ============================================================
// FUNÇÕES AUXILIARES
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

// Função de validação de status e datas
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

// ============================================================
// FUNÇÕES DE ATUALIZAÇÃO DE DATAS (Status) E DISTRIBUIDORA
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
    statusGeralDataInicioDiv.classList.add('hidden');
    statusGeralDataConclusaoDiv.classList.add('hidden');
    statusGeralDistribuidoraDiv.classList.add('hidden');
    distribuidoraOutra.classList.add('hidden');

    if (status === 'AINDA_NAO_TEM') {
        statusGeralDataInicio.value = '';
        statusGeralDataConclusao.value = '';
        distribuidoraSelect.value = '';
    } else if (status === 'EM_ANDAMENTO') {
        statusGeralDataInicioDiv.classList.remove('hidden');
        statusGeralDataConclusao.value = '';
        distribuidoraSelect.value = '';
    } else if (status === 'CONCLUIDO') {
        statusGeralDataInicioDiv.classList.remove('hidden');
        statusGeralDataConclusaoDiv.classList.remove('hidden');
        statusGeralDistribuidoraDiv.classList.remove('hidden');
        // Se já houver valor salvo, mantém (mas aqui é criação, então vazio)
    }
}

// Mostrar campo "Outra" se selecionado
distribuidoraSelect.addEventListener('change', function() {
    if (this.value === 'Outra') {
        distribuidoraOutra.classList.remove('hidden');
    } else {
        distribuidoraOutra.classList.add('hidden');
        distribuidoraOutra.value = '';
    }
});

function atualizarDatasCapa() {
    const status = capaStatus.value;
    capaDataInicioDiv.classList.add('hidden');
    capaDataConclusaoDiv.classList.add('hidden');

    if (status === 'AINDA_NAO_TEM') {
        capaDataInicio.value = '';
        capaDataConclusao.value = '';
    } else if (status === 'EM_ANDAMENTO') {
        capaDataInicioDiv.classList.remove('hidden');
        capaDataConclusao.value = '';
    } else if (status === 'CONCLUIDO') {
        capaDataInicioDiv.classList.remove('hidden');
        capaDataConclusaoDiv.classList.remove('hidden');
    }
}

function atualizarDatasAudio(selectElement) {
    const parent = selectElement.closest('.faixa-item');
    const inicioDiv = parent.querySelector('.audio-data-inicio');
    const conclusaoDiv = parent.querySelector('.audio-data-conclusao');
    const inputInicio = inicioDiv.querySelector('input');
    const inputConclusao = conclusaoDiv.querySelector('input');

    inicioDiv.classList.add('hidden');
    conclusaoDiv.classList.add('hidden');

    if (selectElement.value === 'AINDA_NAO_TEM') {
        inputInicio.value = '';
        inputConclusao.value = '';
    } else if (selectElement.value === 'EM_ANDAMENTO') {
        inicioDiv.classList.remove('hidden');
        inputConclusao.value = '';
    } else if (selectElement.value === 'CONCLUIDO') {
        inicioDiv.classList.remove('hidden');
        conclusaoDiv.classList.remove('hidden');
    }
}

// ============================================================
// FUNÇÕES DE MANIPULAÇÃO DE FAIXAS
// ============================================================
const formatoSelect = document.getElementById('formato');
const configFaixas = document.getElementById('config-faixas');
const faixasContainer = document.getElementById('faixas-container');
const numFaixasInput = document.getElementById('num-faixas');
const gerarFaixasBtn = document.getElementById('gerar-faixas');
const faixaTemplate = document.getElementById('faixa-template');

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

function criarFaixa(index) {
    const clone = faixaTemplate.content.cloneNode(true);
    const faixaDiv = clone.querySelector('.faixa-item');
    faixaDiv.dataset.index = index;

    // Atualizar atributos name com o índice
    faixaDiv.querySelectorAll('[name*="[]"]').forEach(el => {
        const name = el.getAttribute('name');
        const newName = name.replace(/\[\]$/, `[${index}]`);
        el.setAttribute('name', newName);
    });

    // Eventos para status do áudio
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
        adicionarLinhaParticipante(container, 'compositor', index);
    });

    // Adicionar intérprete
    faixaDiv.querySelector('.adicionar-interprete').addEventListener('click', function(e) {
        const container = faixaDiv.querySelector('.interpretes-container');
        adicionarLinhaParticipante(container, 'interprete', index);
    });

    // Remover linhas existentes
    faixaDiv.querySelectorAll('.remover-compositor, .remover-interprete').forEach(btn => {
        btn.addEventListener('click', function() {
            btn.closest('.grid').remove();
        });
    });

    return faixaDiv;
}

function reindexarFaixas() {
    const faixas = document.querySelectorAll('.faixa-item');
    faixas.forEach((faixa, idx) => {
        faixa.dataset.index = idx;
        // Atualizar títulos
        const tituloH3 = faixa.querySelector('h3');
        if (tituloH3) tituloH3.innerText = `Faixa ${idx + 1}`;

        // Atualizar índices nos names
        faixa.querySelectorAll('[name*="["]').forEach(el => {
            const name = el.getAttribute('name');
            const newName = name.replace(/\[\d+\]/, `[${idx}]`);
            el.setAttribute('name', newName);
        });

        // Mostrar botão remover se houver mais de uma
        const removerBtn = faixa.querySelector('.remover-faixa');
        if (faixas.length > 1) {
            removerBtn.classList.remove('hidden');
        } else {
            removerBtn.classList.add('hidden');
        }
    });
}

function gerarFaixas(quantidade) {
    faixasContainer.innerHTML = '';
    for (let i = 0; i < quantidade; i++) {
        const novaFaixa = criarFaixa(i);
        faixasContainer.appendChild(novaFaixa);
    }
    reindexarFaixas();
}

// ============================================================
// FUNÇÕES PARA CÁLCULO DO STATUS DO PROJETO (áudio)
// ============================================================
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
// EVENTOS INICIAIS
// ============================================================
statusGeral.addEventListener('change', atualizarDatasStatusGeral);
capaStatus.addEventListener('change', atualizarDatasCapa);
atualizarDatasStatusGeral();
atualizarDatasCapa();

formatoSelect.addEventListener('change', function() {
    if (this.value === 'SINGLE') {
        configFaixas.classList.add('hidden');
        gerarFaixas(1);
    } else {
        configFaixas.classList.remove('hidden');
        if (faixasContainer.children.length === 0) {
            gerarFaixas(2);
        }
    }
});

gerarFaixasBtn.addEventListener('click', function() {
    const num = parseInt(numFaixasInput.value) || 2;
    gerarFaixas(num);
});

// Inicialização: se single, criar uma faixa
window.addEventListener('load', function() {
    if (formatoSelect.value === 'SINGLE') {
        gerarFaixas(1);
    }
});

// ============================================================
// PRODUTORES E MÚSICOS
// ============================================================
document.getElementById('adicionar-produtor').addEventListener('click', function() {
    const container = document.getElementById('produtores-container');
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

document.getElementById('adicionar-musico').addEventListener('click', function() {
    const container = document.getElementById('musicos-container');
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

// ============================================================
// SUBMISSÃO DO FORMULÁRIO
// ============================================================
document.getElementById('form-lancamento').addEventListener('submit', async function (event) {
    event.preventDefault();
    const btnSalvar = document.getElementById('btn-salvar');
    btnSalvar.innerText = 'Salvando...';
    btnSalvar.disabled = true;

    try {
        validarStatusComDatas();

        // Coletar as faixas e calcular o status do projeto
        const faixas = document.querySelectorAll('.faixa-item');
        const audio_status = calcularStatusAudioProjeto(faixas);
        const { audio_data_inicio, audio_data_conclusao } = calcularDatasAudioProjeto(faixas);

        // Obter valor da distribuidora (considerando "Outra")
        let distribuidora = distribuidoraSelect.value;
        if (distribuidora === 'Outra') {
            distribuidora = distribuidoraOutra.value.trim();
            if (!distribuidora) {
                throw new Error('Informe o nome da distribuidora no campo "Outra".');
            }
        }

        // Dados do projeto
        const projetoData = {
            nome_projeto: document.getElementById('nome_projeto').value,
            titulo: document.getElementById('titulo_principal').value || null,
            feat_projeto: document.getElementById('feat_projeto')?.value || null,
            formato: document.getElementById('formato').value,
            data_lancamento: document.getElementById('data_lancamento').value || null,
            genero_subgenero: (document.getElementById('genero').value + (document.getElementById('subgenero').value ? ' / ' + document.getElementById('subgenero').value : '')).trim() || null,
            label: document.getElementById('label').value || null,
            is_prioridade: document.getElementById('is_prioridade').checked,
            status_geral: document.getElementById('status_geral')?.value || 'AINDA_NAO_TEM',
            status_geral_data_inicio: document.getElementById('status_geral_data_inicio')?.value || null,
            status_geral_data_conclusao: document.getElementById('status_geral_data_conclusao')?.value || null,
            distribuidora: distribuidora || null,  // NOVO CAMPO
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
            audio_data_conclusao
        };

        const { data: projetoInserido, error: erroProjeto } = await supabase
            .from('projetos')
            .insert(projetoData)
            .select('id')
            .single();

        if (erroProjeto) throw erroProjeto;
        const projetoId = projetoInserido.id;

        // Processar faixas
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

                await supabase
                    .from('projeto_participantes')
                    .insert({
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

                await supabase
                    .from('projeto_participantes')
                    .insert({
                        projeto_id: projetoId,
                        faixa_id: faixaId,
                        pessoa_id: pessoaId,
                        papel: 'INTERPRETE',
                    });
            }
        }

        // Produtores (globais)
        const produtoresRows = document.querySelectorAll('#produtores-container .grid');
        for (let row of produtoresRows) {
            const nomeArtistico = row.querySelector('input[name="produtor_artistico[]"]')?.value;
            const nomeCompleto = row.querySelector('input[name="produtor_completo[]"]')?.value;
            const cpf = row.querySelector('input[name="produtor_cpf[]"]')?.value;

            if (!nomeCompleto && !cpf) continue;

            const pessoaId = await obterOuCriarPessoa({ nome_completo: nomeCompleto, nome_artistico: nomeArtistico, cpf: cpf });

            await supabase
                .from('projeto_participantes')
                .insert({
                    projeto_id: projetoId,
                    faixa_id: null,
                    pessoa_id: pessoaId,
                    papel: 'PRODUTOR_MUSICAL',
                });
        }

        // Músicos (globais)
        const musicosRows = document.querySelectorAll('#musicos-container .grid');
        for (let row of musicosRows) {
            const nomeArtistico = row.querySelector('input[name="musico_artistico[]"]')?.value;
            const nomeCompleto = row.querySelector('input[name="musico_completo[]"]')?.value;
            const cpf = row.querySelector('input[name="musico_cpf[]"]')?.value;
            const instrumento = row.querySelector('input[name="musico_instrumento[]"]')?.value;

            if (!nomeCompleto && !cpf) continue;

            const pessoaId = await obterOuCriarPessoa({ nome_completo: nomeCompleto, nome_artistico: nomeArtistico, cpf: cpf });

            await supabase
                .from('projeto_participantes')
                .insert({
                    projeto_id: projetoId,
                    faixa_id: null,
                    pessoa_id: pessoaId,
                    papel: 'MUSICO',
                    instrumento: instrumento || null
                });
        }

        alert('Projeto salvo com sucesso!');
        window.location.href = 'gerenciar-projetos.html';

    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar o projeto: ' + error.message);
        btnSalvar.innerText = 'Salvar Projeto';
        btnSalvar.disabled = false;
    }
});