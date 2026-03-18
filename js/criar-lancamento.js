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
// SUBMISSÃO DO FORMULÁRIO
// ============================================================

document.getElementById('form-lancamento').addEventListener('submit', async function (event) {
    event.preventDefault();
    const btnSalvar = document.getElementById('btn-salvar');
    btnSalvar.innerText = 'Salvando...';
    btnSalvar.disabled = true;

    try {
        // Executar validações antes de prosseguir
        validarStatusComDatas();

        // 1. Dados gerais do projeto (incluindo status geral)
        const projetoData = {
            nome_projeto: document.getElementById('nome_projeto').value,
            titulo: document.getElementById('titulo_principal').value || null,
            formato: document.getElementById('formato').value,
            data_lancamento: document.getElementById('data_lancamento').value || null,
            genero_subgenero: (document.getElementById('genero').value + (document.getElementById('subgenero').value ? ' / ' + document.getElementById('subgenero').value : '')).trim() || null,
            label: document.getElementById('label').value || null,
            is_prioridade: document.getElementById('is_prioridade').checked,

            // NOVOS CAMPOS: status geral e datas
            status_geral: document.getElementById('status_geral')?.value || 'AINDA_NAO_TEM',
            status_geral_data_inicio: document.getElementById('status_geral_data_inicio')?.value || null,
            status_geral_data_conclusao: document.getElementById('status_geral_data_conclusao')?.value || null,

            spotify_id: document.getElementById('spotify_id').value || null,
            apple_music_id: document.getElementById('apple_music_id').value || null,
            backup_url: document.getElementById('backup_url').value || null,
            release_texto: document.getElementById('release_texto').value || null,
            notas: document.getElementById('notas').value || null,
            capa_status: document.getElementById('capa_status').value,
            capa_data_inicio: document.getElementById('capa_data_inicio').value || null,
            capa_data_conclusao: document.getElementById('capa_data_conclusao').value || null,
        };

        const { data: projetoInserido, error: erroProjeto } = await supabase
            .from('projetos')
            .insert(projetoData)
            .select('id')
            .single();

        if (erroProjeto) throw erroProjeto;
        const projetoId = projetoInserido.id;

        // 2. Processar faixas
        const faixas = document.querySelectorAll('.faixa-item');

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

            // 3. Compositores da faixa
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

            // 4. Intérpretes da faixa
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

        // 5. Produtores (globais)
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

        // 6. Músicos (globais)
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