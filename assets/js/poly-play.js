(() => {
    "use strict";

    // ─── ELEMENTOS DA UI ───
    const playBtn = document.getElementById('playButton');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const statusEl = document.getElementById('playerStatus');
    const nextBtn = document.getElementById('nextButton');
    const volumeBtn = document.getElementById('volumeButton');
    const youtubeLink = document.getElementById('youtubeLink');

    // ─── DADOS ───
    let albums = [];
    let schedule = [];
    let history = [];
    let current = null;
    let player = null;
    let playerReady = false;
    let isPlaying = false;
    let userStarted = false;
    let isLoading = false;
    let blacklist = new Set();
    let tentativasFalhas = 0;
    const MAX_TENTATIVAS = 5;
    const HISTORICO_TAMANHO = 5;

    // ─── UTILITÁRIOS ───
    const normalize = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const videoIdFrom = url => {
        try {
            const parsed = new URL(url);
            return parsed.searchParams.get('v') || (parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : '');
        } catch { return ''; }
    };
    const hour = () => new Date().getHours();

    // ─── PROGRAMAÇÃO (se existir) ───
    const activeSlot = () => schedule.find(s => s.start <= hour() && hour() < s.end) || schedule[0];
    const poolForSlot = () => {
        const slot = activeSlot();
        if (!slot || !slot.artists?.length) return albums;
        const filtered = albums.filter(a => slot.artists.some(artist => normalize(a.artist).includes(normalize(artist))));
        return filtered.length ? filtered : albums;
    };

    // ─── ESCOLHER ÁLBUM ALEATÓRIO ───
    function chooseAlbum() {
        if (blacklist.size > 30) blacklist.clear();

        let pool = poolForSlot()
            .filter((_, idx) => !blacklist.has(idx))
            .filter(item => videoIdFrom(item.youtube_album_link || item.links?.youtube));

        const histIds = history.map(item => albums.indexOf(item));
        pool = pool.filter((_, idx) => !histIds.includes(idx));

        if (pool.length === 0) {
            pool = poolForSlot()
                .filter((_, idx) => !blacklist.has(idx))
                .filter(item => videoIdFrom(item.youtube_album_link || item.links?.youtube));
        }
        if (pool.length === 0) {
            blacklist.clear();
            pool = poolForSlot().filter(item => videoIdFrom(item.youtube_album_link || item.links?.youtube));
            if (pool.length === 0) {
                statusEl.textContent = 'Nenhum vídeo válido encontrado.';
                return null;
            }
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // ─── ATUALIZAR INTERFACE ───
    function showAlbum(album) {
        current = album;
        const url = album.youtube_album_link || album.links?.youtube;
        trackTitle.textContent = album.title || 'Título não disponível';
        trackArtist.textContent = `${album.artist}${album.youtube_album_title ? ` - ${album.youtube_album_title}` : ''}`;
        youtubeLink.href = url || '#';
    }

    // ─── TOCAR ÁLBUM ───
    function playAlbum(album, saveHistory = true) {
        if (!album) {
            statusEl.textContent = 'Nenhum álbum disponível.';
            return;
        }
        if (saveHistory && current && current.id !== album.id) {
            history.push(current);
            if (history.length > HISTORICO_TAMANHO) history.shift();
        }
        showAlbum(album);

        const videoId = videoIdFrom(album.youtube_album_link || album.links?.youtube);
        if (!videoId) {
            statusEl.textContent = 'Link do YouTube inválido. Pulando...';
            const idx = albums.indexOf(album);
            if (idx !== -1) blacklist.add(idx);
            setTimeout(playRandom, 1500);
            return;
        }

        if (!playerReady) {
            statusEl.textContent = 'Aguardando player...';
            setTimeout(() => playAlbum(album, saveHistory), 2000);
            return;
        }

        isLoading = true;
        statusEl.textContent = 'Carregando...';
        player.loadVideoById(videoId);
    }

    // ─── TOCAR ALEATÓRIO ───
    function playRandom() {
        const album = chooseAlbum();
        if (album) {
            userStarted = true;
            playAlbum(album);
            playBtn.innerHTML = '<i class="fas fa-pause text-3xl"></i>';
        } else {
            statusEl.textContent = 'Não foi possível encontrar um álbum válido.';
        }
    }

    // ─── EVENTOS DO PLAYER ───
    function onPlayerStateChange(event) {
        const data = event.data;
        if (data === YT.PlayerState.PLAYING) {
            isPlaying = true;
            isLoading = false;
            statusEl.textContent = 'Reproduzindo';
            playBtn.innerHTML = '<i class="fas fa-pause text-3xl"></i>';
            const vdata = player.getVideoData();
            if (vdata && vdata.title) {
                trackTitle.textContent = vdata.title;
            }
        } else if (data === YT.PlayerState.PAUSED) {
            isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play text-3xl ml-1"></i>';
        } else if (data === YT.PlayerState.ENDED) {
            statusEl.textContent = 'Escolhendo próximo...';
            setTimeout(playRandom, 1000);
        }
    }

    function onPlayerError(event) {
        const videoData = player.getVideoData();
        const videoId = videoData ? videoData.video_id : 'desconhecido';
        console.error(`Erro (${event.data}) no vídeo ${videoId}`);
        if (current) {
            const idx = albums.indexOf(current);
            if (idx !== -1) blacklist.add(idx);
        }
        tentativasFalhas++;
        isLoading = false;
        statusEl.textContent = `Erro (${event.data}). Tentando outra... (${tentativasFalhas}/${MAX_TENTATIVAS})`;
        if (tentativasFalhas >= MAX_TENTATIVAS) {
            blacklist.clear();
            history = [];
            tentativasFalhas = 0;
            statusEl.textContent = 'Muitas falhas. Resetando...';
        }
        setTimeout(playRandom, 2000);
    }

    // ─── INICIALIZAR PLAYER ───
    window.onYouTubeIframeAPIReady = () => {
        player = new YT.Player('player', {
            height: '200',
            width: '200',
            playerVars: {
                playsinline: 1,
                controls: 0,
                rel: 0,
                modestbranding: 1,
                iv_load_policy: 3,
                disablekb: 1,
                widget_referrer: window.location.origin
            },
            events: {
                onReady: () => {
                    playerReady = true;
                    statusEl.textContent = 'Player pronto. Aperte play.';
                },
                onStateChange: onPlayerStateChange,
                onError: onPlayerError
            }
        });
    };

    // ─── EVENTOS DOS BOTÕES ───
    playBtn.addEventListener('click', () => {
        if (!playerReady) {
            statusEl.textContent = 'Aguardando player...';
            return;
        }
        if (!userStarted || !current) {
            playRandom();
            return;
        }
        if (isPlaying) {
            player.pauseVideo();
        } else {
            const vdata = player.getVideoData();
            if (vdata && vdata.video_id) {
                player.playVideo();
            } else {
                playRandom();
            }
        }
    });

    nextBtn.addEventListener('click', () => {
        blacklist.clear();
        history = [];
        playRandom();
    });

    volumeBtn.addEventListener('click', () => {
        if (!player) return;
        const icon = volumeBtn.querySelector('i');
        if (player.isMuted()) {
            player.unMute();
            icon.className = 'fas fa-volume-up mr-2';
        } else {
            player.mute();
            icon.className = 'fas fa-volume-mute mr-2';
        }
    });

    // ─── CARREGAR CATÁLOGO ───
    async function loadData() {
        try {
            const [catResp, schedResp] = await Promise.all([
                fetch('catalogo.json'),
                fetch('poly-play-programacao.json')
            ]);
            const catalog = await catResp.json();
            albums = catalog.catalogo || [];
            schedule = schedResp.ok ? (await schedResp.json()).slots || [] : [];
            statusEl.textContent = `${albums.length} álbuns carregados. Aperte play.`;
        } catch {
            statusEl.textContent = 'Erro ao carregar catálogo. Sirva os arquivos via servidor.';
        }
    }
    loadData();

    // ─── KEYBOARD SHORTCUT ───
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            e.preventDefault();
            playBtn.click();
        }
    });
})();