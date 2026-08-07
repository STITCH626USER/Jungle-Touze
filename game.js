/**
 * JUNGLE TOUZE - GAME ENGINE
 * Core game state, networking (PeerJS), UI management, and Bots.
 */

// --- ANIMALS DEFINITION ---
const ANIMALS = [
    { id: 'lion', name: 'Lion', power: 'Victoire: 8 animaux différents' },
    { id: 'chameleon', name: 'Caméléon', power: 'Joker. 2 caméléons = détruits' },
    { id: 'octopus', name: 'Pieuvre', power: 'Victoire: 3 paires différentes' },
    { id: 'crocodile', name: 'Crocodile', power: 'Élimine 1 carte adverse' },
    { id: 'monkey', name: 'Singe', power: 'Échange 2 cartes n\'importe où' },
    { id: 'crab', name: 'Crabe', power: 'Glisse 1 carte = +1 pioche' },
    { id: 'parrot', name: 'Perroquet', power: 'Devinez prochaine carte = +1 pioche' },
    { id: 'hermit_crab', name: 'Bernard l\'Hermite', power: 'Rejouez si vous avez un Crabe' }
];

// --- SOUND ENGINE ---
const soundEngine = {
    muted: localStorage.getItem('jt_muted') === 'true',
    sounds: {
        lion: new Audio('assets/sfx_lion.mp3'),
        monkey: new Audio('assets/sfx_monkey.mp3'),
        crab: new Audio('assets/sfx_crab.mp3'),
        parrot: new Audio('assets/sfx_parrot.mp3'),
        chameleon: new Audio('assets/sfx_chameleon.mp3'),
        octopus: new Audio('assets/sfx_octopus.mp3'),
        crocodile: new Audio('assets/sfx_crocodile.mp3'),
        hermit_crab: new Audio('assets/sfx_hermit.mp3'),
        dice: new Audio('assets/sfx_dice.mp3'),
        win: new Audio('assets/sfx_win.mp3')
    },
    init() {
        this.updateBtn();
    },
    play(id) {
        if (this.muted) return;
        const snd = this.sounds[id];
        if (snd) {
            snd.currentTime = 0;
            // Catch error silently for autoplay policies
            const playPromise = snd.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => console.log('Audio play prevented:', e));
            }
        }
    },
    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('jt_muted', this.muted);
        this.updateBtn();
    },
    initAudioContext() {
        for(let key in this.sounds) {
            this.sounds[key].load();
        }
        document.removeEventListener('touchstart', () => this.initAudioContext());
        document.removeEventListener('click', () => this.initAudioContext());
    },
    updateBtn() {
        const btn = document.getElementById('btn-sound-toggle');
        if (btn) btn.textContent = this.muted ? '🔇' : '🔊';
    }
};

// --- UI MANAGER ---
const ui = {
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.getElementById('global-controls').style.display = (id === 'screen-game') ? 'flex' : 'none';
    },
    showModal(id) { document.getElementById(id).style.display = 'flex'; },
    hideModal(id) { document.getElementById(id).style.display = 'none'; },
    showHelpModal() { 
        this.showModal('help-modal'); 
        const grid = document.getElementById('help-grid');
        grid.innerHTML = '';
        const powers = {
            lion: "Aucun pouvoir direct, mais collectionnez les 8 animaux pour gagner !",
            chameleon: "Joker magique ! Attention : 2 Caméléons s'annulent.",
            octopus: "Assemblez 3 paires d'animaux quelconques pour gagner.",
            crocodile: "Mange la carte d'un adversaire !",
            monkey: "Échangez deux cartes n'importe où sur le plateau.",
            crab: "Faites glisser cette carte à la fin de votre rangée.",
            parrot: "Devinez la prochaine carte d'une pioche pour la gagner.",
            hermit_crab: "Gagnez un tour supplémentaire si vous avez un Crabe."
        };
        const colors = {lion:'#f1c40f', chameleon:'#9b59b6', octopus:'#3498db', crocodile:'#2ecc71', monkey:'#e67e22', crab:'#e74c3c', parrot:'#1abc9c', hermit_crab:'#e84393'};
        ANIMALS.forEach(a => {
            grid.innerHTML += `<div style="display:flex; align-items:center; gap:10px; padding:10px; background:rgba(255,255,255,0.05); border-radius:12px; border-left:4px solid ${colors[a.id]};">
                <img src="assets/card_${a.id}.jpg" style="width:50px; aspect-ratio:2/3; object-fit:contain; background:white; border-radius:8px;">
                <div>
                    <strong style="color:white; display:block; margin-bottom:4px; text-transform:capitalize;">${a.name}</strong>
                    <span style="color:#bbb; font-size:0.9rem;">${powers[a.id]}</span>
                </div>
            </div>`;
        });
    },
    showHistoryModal() { this.showModal('history-modal'); },
    showQuitConfirmModal() { this.showModal('quit-modal'); },
    toast(msg) {
        const pill = document.createElement('div');
        pill.className = 'toast-pill';
        pill.textContent = msg;
        document.getElementById('toast-container').appendChild(pill);
        setTimeout(() => pill.remove(), 2500);
    },
    installPWA() { /* Triggered by beforeinstallprompt, simplified here */ },
    logHistory(player, action, power) {
        const h = document.getElementById('history-list');
        let icon = '';
        if(power) icon = `<img src="assets/card_${power}.jpg" class="history-mini-img">`;
        h.innerHTML = `<div class="history-item"><strong>${player}</strong> ${action} ${icon}</div>` + h.innerHTML;
    },

    animateCardToOpponent(playerId, animal) {
        const oppSlot = document.querySelector(`.opponent-slot[data-id="${playerId}"]`);
        if(!oppSlot) return;
        const rect = oppSlot.getBoundingClientRect();
        
        const ghost = document.createElement('div');
        ghost.style.position = 'fixed';
        ghost.style.top = '50vh';
        ghost.style.left = '50vw';
        ghost.style.transform = 'translate(-50%, -50%)';
        ghost.style.width = '180px';
        ghost.style.height = '270px';
        ghost.style.backgroundImage = `url(assets/card_${animal}.jpg)`;
        ghost.style.backgroundSize = 'contain';
        ghost.style.backgroundPosition = 'center';
        ghost.style.backgroundRepeat = 'no-repeat';
        ghost.style.backgroundColor = 'white';
        ghost.style.borderRadius = '16px';
        ghost.style.border = '4px solid white';
        ghost.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        ghost.style.zIndex = '100000';
        ghost.style.transition = 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)';
        document.body.appendChild(ghost);
        
        // Wait a frame to let CSS apply
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                ghost.style.top = `${rect.top + 20}px`;
                ghost.style.left = `${rect.left + rect.width/2}px`;
                ghost.style.transform = 'translate(-50%, -50%) scale(0.15)';
                ghost.style.opacity = '0';
            });
        });
        
        setTimeout(() => {
            ghost.remove();
        }, 700);
    },
    
    showRoundEndModal(winnerData) {
        document.getElementById('round-end-modal').style.display = 'flex';
        document.getElementById('round-end-modal').style.position = 'fixed';
        document.getElementById('round-end-modal').style.inset = '0';
        document.getElementById('round-end-modal').style.zIndex = '200000';
        document.getElementById('round-end-modal').style.background = 'rgba(0,0,0,0.92)';
        document.getElementById('round-end-modal').style.backdropFilter = 'blur(10px)';
        document.getElementById('round-end-modal').style.flexDirection = 'column';
        document.getElementById('round-end-modal').style.alignItems = 'center';
        document.getElementById('round-end-modal').style.justifyContent = 'center';
        document.getElementById('round-end-modal').style.textAlign = 'center';
        
        const isMe = winnerData.id === game.myId;
        
        if(winnerData.matchWin) {
            document.getElementById('round-end-title').textContent = isMe ? `🎉 VOUS REMPORTEZ LA PARTIE !` : `❌ ${winnerData.name.toUpperCase()} REMPORTE LA PARTIE !`;
            document.getElementById('round-end-subtitle').textContent = isMe ? "Champion(ne) de la Jungle Touze !" : "Défaite totale...";
            if (isMe) {
                soundEngine.play('win');
                this.playConfetti();
            }
        } else {
            document.getElementById('round-end-title').textContent = isMe ? `🎉 VOUS GAGNEZ LA MANCHE !` : `❌ ${winnerData.name.toUpperCase()} GAGNE LA MANCHE !`;
            document.getElementById('round-end-subtitle').textContent = isMe ? winnerData.reason : "Défaite ! " + winnerData.reason;
            if (isMe) {
                this.playConfetti();
            }
        }
        
        const cardsDiv = document.getElementById('round-end-cards');
        cardsDiv.innerHTML = '';
        winnerData.cards.forEach(c => {
            cardsDiv.innerHTML += `<img src="assets/card_${c.animal}.jpg" style="width:60px; aspect-ratio:2/3; border-radius:10px; border:3px solid var(--gold); box-shadow:0 0 20px rgba(255,215,0,0.6); object-fit:contain; background:white;">`;
        });
        
        const scoresDiv = document.getElementById('round-end-scores');
        scoresDiv.innerHTML = '';
        game.state.players.forEach(p => {
            scoresDiv.innerHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:1.1rem; color:white;"><span>${p.name}</span> <span style="color:var(--gold); font-weight:bold;">👑 ${p.winCount || 0}</span></div>`;
        });
        
        const rematchBtn = document.getElementById('btn-rematch');
        if(winnerData.matchWin) {
            rematchBtn.textContent = '🔄 Nouvelle Partie';
        } else {
            rematchBtn.textContent = '🔄 Rejouer une manche';
        }
    },
    
    playConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const pieces = [];
        for(let i=0; i<100; i++) {
            pieces.push({
                x: canvas.width/2, y: canvas.height/2 + 100,
                vx: (Math.random()-0.5)*20, vy: (Math.random()-1)*20 - 5,
                color: `hsl(${Math.random()*360}, 100%, 50%)`,
                size: Math.random()*10 + 5
            });
        }
        const draw = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let alive = false;
            pieces.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.vy += 0.5; // gravity
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
                if(p.y < canvas.height) alive = true;
            });
            if(alive) requestAnimationFrame(draw);
        };
        draw();
    }
};

// --- GAME LOGIC & NETWORK ---
class GameEngine {
    constructor() {
        this.peer = null;
        this.conn = null; // Client connection to host
        this.conns = []; // Host connections to clients
        
        this.isHost = false;
        this.myId = ''; // peer ID
        this.myName = '';
        this.roomCode = '';
        
        this.state = this.getInitialState();
        
        this.botLivenessTimer = null;
        this.currentDrawnCard = null;
        this.forcedDeck = null;
        
        const frenchNames = ['Gaston', 'Marcel', 'Lucien', 'Georgette', 'Josiane', 'Yvonne', 'Maurice', 'Ginette', 'Raymond', 'Fernand', 'Huguette', 'Colette', 'Odette', 'Bernard', 'Gérard'];
        this.bots = [];
        for(let i=0; i<10; i++) {
            const idx = Math.floor(Math.random() * frenchNames.length);
            const name = frenchNames.splice(idx, 1)[0];
            this.bots.push({ id: `bot_${i}`, name });
        }
        this.activeBots = [];

        // Local state locks for active player interaction
        this.currentDrawnCard = null;
        this.forcedDeck = null;
        this.isPlacingCard = false;
        this.crabTargeting = false;
        this.monkeyTargeting = false;
        this.crocodileTargeting = false;
        this.monkeySelectedCards = [];
        this.turnTimer = null;
        this.inactivitySeconds = 45;
        this.botLivenessTimer = null;
        
        this.initPWA();
        this.initParticles();
    }

    getInitialState() {
        return {
            status: 'waiting', // waiting, rolling, playing, ended
            players: [], // { id, name, isBot, score, cards: [], isHost }
            deckLeft: [],
            deckRight: [],
            turnIndex: 0,
            activeAction: null, // 'draw', 'keep_reject', 'place', 'power'
            pendingPower: null, // holds info about power being executed
            history: []
        };
    }

    // --- SETUP & NETWORK ---
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for(let i=0;i<4;i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
    }

    resetRoomState() {
        if(this.peer) this.peer.destroy();
        this.conns.forEach(c => c.close());
        this.conns = [];
        if(this.activeBots && this.activeBots.length > 0) {
            this.bots.push(...this.activeBots);
            this.activeBots = [];
        }
        this.state = this.getInitialState();
    }

    async hostRoom() {
        this.resetRoomState();
        const name = document.getElementById('input-username').value.trim() || 'Hôte';
        this.myName = name;
        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        this.peer = new Peer("JT-" + this.roomCode);
        
        this.peer.on('connection', (conn) => {
            this.conns.push(conn);
            conn.on('data', (data) => this.handleClientData(conn, data));
            conn.on('close', () => {
                this.state.players = this.state.players.filter(p => p.id !== conn.peer);
                this.conns = this.conns.filter(c => c !== conn);
                this.broadcastState();
                this.updateLobbyUI();
            });
        });
        ui.showScreen('screen-host');
        document.getElementById('room-code-display').textContent = this.roomCode;
        this.state.players.push({ id: this.myId, name: this.myName, isBot: false, score: 0, cards: [], isHost: true });
        this.updateLobbyUI();
    }

    joinRoom() {
        this.resetRoomState();
        const code = document.getElementById('input-room-code').value.toUpperCase();
        const name = document.getElementById('input-player-name').value.trim();
        if(!code || !name) {
            alert("Code et nom requis !");
            return;
        }
        
        this.myName = name;
        this.roomCode = code;
        this.state.players.push({ id: this.myId, name, cards: [], isBot: false, isHost: false, winCount: 0 });
        
        const targetPeerId = "JT-" + code;
        this.peer = new Peer();
        this.peer.on('open', (id) => {
            this.myId = id;
            document.getElementById('join-msg').textContent = "Connexion...";
            this.conn = this.peer.connect(targetPeerId);
            
            this.conn.on('open', () => {
                this.conn.send({ type: 'JOIN', name: this.myName, id: this.myId });
            });
            
            this.conn.on('data', (data) => {
                if(data.type === 'STATE') {
                    this.state = data.state;
                    if(this.state.status === 'waiting') ui.showScreen('screen-host');
                    else if(this.state.status === 'playing') ui.showScreen('screen-game');
                    this.renderState();
                } else if(data.type === 'KICKED') {
                    alert("Vous avez été exclu du salon.");
                    this.quitGame();
                }
            });
            
            this.conn.on('close', () => {
                alert("Hôte déconnecté");
                ui.showScreen('screen-home');
            });
        });
    }

    startSolo() {
        const name = document.getElementById('input-username').value.trim() || 'Joueur';
        this.myName = name;
        this.isHost = true;
        this.myId = 'solo_' + Date.now();
        
        this.state = this.getInitialState();
        this.state.players.push({ id: this.myId, name: this.myName, isBot: false, score: 0, cards: [], isHost: true });
        
        // Add 2 bots automatically
        this.addBot();
        this.addBot();
        
        this.startGame();
    }

    addBot() {
        if(this.state.players.length >= 5) return;
        const bot = this.bots.shift();
        if(bot) {
            this.state.players.push({ id: bot.id, name: bot.name, isBot: true, score: 0, cards: [], isHost: false });
            this.activeBots.push(bot);
            this.updateLobbyUI();
            if(this.isHost) this.broadcastState();
        }
    }

    updateLobbyUI() {
        document.getElementById('player-count').textContent = this.state.players.length;
        const list = document.getElementById('waiting-players-list');
        list.innerHTML = '';
        this.state.players.forEach(p => {
            let kickBtn = '';
            if(this.isHost && p.id !== this.myId) {
                kickBtn = `<button onclick="game.kickPlayer('${p.id}')" style="background:transparent;border:none;color:var(--primary);cursor:pointer;font-weight:bold;font-size:1.5rem;line-height:1;">×</button>`;
            }
            list.innerHTML += `<li><span>${p.name} ${p.isHost ? '(Hôte)' : ''}</span> ${kickBtn}</li>`;
        });
        if(!this.isHost) {
            document.getElementById('room-code-display').textContent = this.roomCode;
            document.querySelector('.host-actions').style.display = 'none';
        }
    }

    kickPlayer(id) {
        if(!this.isHost) return;
        const p = this.state.players.find(p => p.id === id);
        if(!p) return;
        
        this.state.players = this.state.players.filter(p => p.id !== id);
        if(p.isBot) {
            this.activeBots = this.activeBots.filter(b => b.id !== id);
            this.bots.push({id: p.id, name: p.name});
        } else {
            const conn = this.conns.find(c => c.peer === id);
            if(conn) {
                conn.send({type: 'KICKED'});
                setTimeout(() => conn.close(), 500);
                this.conns = this.conns.filter(c => c !== conn);
            }
        }
        this.updateLobbyUI();
        this.broadcastState();
    }

    handleClientData(conn, data) {
        if(data.type === 'JOIN') {
            if(this.state.status !== 'waiting' || this.state.players.length >= 5) {
                conn.send({type: 'REJECT'});
                return;
            }
            this.state.players.push({ id: data.id, name: data.name, isBot: false, score: 0, cards: [], isHost: false });
            this.broadcastState();
            this.updateLobbyUI();
        } else if (data.type === 'ACTION') {
            this.processAction(data.id, data.action, data.payload);
        }
    }

    broadcastState() {
        if(this.isHost) {
            this.conns.forEach(c => c.send({ type: 'STATE', state: this.state }));
            this.renderState();
        }
    }

    sendAction(action, payload = {}) {
        if(this.isHost) {
            this.processAction(this.myId, action, payload);
        } else {
            this.conn.send({ type: 'ACTION', id: this.myId, action, payload });
        }
    }
    
    selectParrotAnimal(animalId) {
        this.selectedParrotGuess = animalId;
        const cells = document.querySelectorAll('.parrot-animal-cell');
        cells.forEach(c => c.classList.remove('selected'));
        const target = document.getElementById('parrot-cell-' + animalId);
        if(target) target.classList.add('selected');
        document.getElementById('parrot-placement-actions').style.display = 'flex';
    }

    sendParrotGuess(side) {
        if(!this.selectedParrotGuess) return;
        const deckId = side === 'left' ? 1 : 2;
        this.sendAction('execute_power', {guess: this.selectedParrotGuess, guessDeck: deckId});
        ui.hideModal('parrot-modal');
        this.selectedParrotGuess = null;
        document.getElementById('parrot-placement-actions').style.display = 'none';
    }

    // --- CORE GAME LOOP ---
    startGame() {
        this.clearLocks();
        this.setupDecks();
        this.state.status = 'rolling';
        this.broadcastState();
        ui.showScreen('screen-game');
        
        ui.showModal('dice-modal');
        const resEl = document.getElementById('dice-result');
        if(resEl) resEl.innerHTML = "Lancement des dés...";
        const scoresList = document.getElementById('dice-scores-list');
        if(scoresList) scoresList.innerHTML = "";
        
        // Show the roll button, hide bots roll until player rolls
        const btn = document.getElementById('btn-roll-dice');
        if(btn) btn.style.display = 'block';
        
        const box = document.getElementById('dice-visual-box');
        if(box) {
            box.textContent = '🎲';
            box.style.animation = 'none';
        }
    }
    
    rollMyDice() {
        const btn = document.getElementById('btn-roll-dice');
        if(btn) btn.style.display = 'none';
        
        const scoresList = document.getElementById('dice-scores-list');
        const resEl = document.getElementById('dice-result');
        if(resEl) resEl.innerHTML = "Résultats des dés :";
        if(scoresList) scoresList.innerHTML = "";
        
        const rolls = [];
        let rollIndex = 0;
        
        const rollNext = () => {
            if(rollIndex < this.state.players.length) {
                const p = this.state.players[rollIndex];
                const roll = Math.floor(Math.random()*6)+1;
                rolls.push({ id: p.id, name: p.name, roll: roll });
                if(scoresList) scoresList.innerHTML += `<div><strong>${p.name}</strong> : 🎲 ${roll}</div>`;
                
                const box = document.getElementById('dice-visual-box');
                if(box) {
                    box.style.animation = 'none';
                    box.offsetHeight; // trigger reflow
                    box.style.animation = 'diceRoll 0.5s ease-out';
                    box.textContent = roll;
                }
                
                soundEngine.play('dice');
                rollIndex++;
                setTimeout(rollNext, 800);
            } else {
                // Determine order
                rolls.sort((a, b) => b.roll - a.roll); // Highest first
                this.state.turnOrder = rolls.map(r => r.id);
                this.state.turnIndex = 0; // points to turnOrder[0]
                
                const starter = rolls[0];
                if(resEl) resEl.innerHTML = `<span style="color:var(--secondary);font-size:1.3rem;">C'est ${starter.name} qui commence !</span>`;
                
                setTimeout(() => {
                    ui.hideModal('dice-modal');
                    this.state.status = 'playing';
                    this.state.activeAction = 'draw';
                    this.broadcastState();
                    ui.toast(`C'est parti, ${starter.name} commence !`);
                }, 2500);
            }
        };
        rollNext();
    }

    setupDecks() {
        let deck = [];
        for(let i=0; i<8; i++) {
            ANIMALS.forEach(a => deck.push({ id: a.id + '_' + i, animal: a.id }));
        }
        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        this.state.deckLeft = deck.slice(0, 32);
        this.state.deckRight = deck.slice(32, 64);
        this.state.players.forEach(p => p.cards = []);
    }

    nextTurn(extraTurnForPlayerId = null) {
        this.clearLocks();
        if(extraTurnForPlayerId) {
            this.state.turnIndex = this.state.turnOrder.indexOf(extraTurnForPlayerId);
        } else {
            this.state.turnIndex = (this.state.turnIndex + 1) % this.state.turnOrder.length;
        }
        this.state.activeAction = 'draw';
        if(this.state.status === 'playing') {
            this.broadcastState();
        }
    }

    clearLocks() {
        this.currentDrawnCard = null;
        this.forcedDeck = null;
        this.isPlacingCard = false;
        this.crabTargeting = false;
        this.monkeyTargeting = false;
        this.crocodileTargeting = false;
        this.parrotGiveTargeting = false;
        this.monkeySelectedCards = [];
        if(this.botLivenessTimer) clearTimeout(this.botLivenessTimer);
    }

    // --- ACTION PROCESSING (Host Only) ---
    processAction(playerId, action, payload) {
        const activePlayer = this.state.players[this.state.turnIndex];
        if (activePlayer.id !== playerId && !['quit'].includes(action)) return;

        switch(action) {
            case 'quit':
                this.handlePlayerQuit(playerId);
                break;
            case 'draw':
                if(this.state.activeAction !== 'draw') return;
                const deckId = payload.deck; // 1 = left, 2 = right
                if(this.forcedDeck && this.forcedDeck !== deckId) return;
                       const d = payload.deck === 1 ? this.state.deckLeft : this.state.deckRight;
                if(d.length === 0) return;
                const drawn = d.shift();
                
                if(this.state.lastRejected && this.state.lastRejected.deck === payload.deck) {
                    this.state.lastRejected = null;
                }
                
                this.state.pendingPower = { card: drawn, fromDeck: payload.deck };
                this.state.activeAction = 'place_or_reject';
                this.broadcastState();
                break;
                
            case 'reject':
                if(this.state.activeAction !== 'place_or_reject') return;
                const deckTarget = this.state.pendingPower.fromDeck === 1 ? 2 : 1;
                this.state.lastRejected = { animal: this.state.pendingPower.card.animal, deck: deckTarget };
                if (deckTarget === 1) {
                    if(this.state.deckLeft) this.state.deckLeft.unshift(this.state.pendingPower.card);
                } else {
                    if(this.state.deckRight) this.state.deckRight.unshift(this.state.pendingPower.card);
                }
                
                ui.logHistory(activePlayer.name, 'a jeté sa carte', null);
                this.nextTurn();
                break;

            case 'place_card':
                if(this.state.activeAction !== 'place_or_reject') return;
                const side = payload.side; // 'left' or 'right'
                const c = this.state.pendingPower.card;
                
                soundEngine.play(c.animal);
                ui.logHistory(activePlayer.name, `a placé une carte`, c.animal);
                
                if (side === 'left') activePlayer.cards.unshift(c);
                else activePlayer.cards.push(c);
                
                this.state.lastAnimation = { id: Math.random(), type: 'place', playerId: activePlayer.id, animal: c.animal };

                this.resolveChameleonPair(activePlayer);
                this.checkWinConditions();
                if(this.state.status !== 'playing') return;

                const activePowers = ['crocodile', 'monkey', 'crab', 'parrot'];
                if (activePowers.includes(c.animal)) {
                    this.state.activeAction = 'power_target';
                    this.broadcastState();
                } else if (c.animal === 'hermit_crab') {
                    const hasCrab = activePlayer.cards.some(card => card.animal === 'crab');
                    if(hasCrab) {
                        ui.toast("💖 Bernard l'Hermite — Vous rejouez !");
                        this.state.activeAction = 'animating';
                        this.state.pendingPower.showLove = true;
                        this.broadcastState();
                        setTimeout(() => {
                            this.state.pendingPower.showLove = false;
                            this.nextTurn(activePlayer.id);
                        }, 2000);
                    } else {
                        this.nextTurn();
                    }
                } else {
                    this.nextTurn();
                }
                break;
                
            case 'REMATCH':
                if(this.state.winner && this.state.winner.matchWin) {
                    this.state.players.forEach(p => p.winCount = 0);
                }
                this.state.status = 'setup';
                this.state.players.forEach(p => p.cards = []);
                this.state.deckLeft = [];
                this.state.deckRight = [];
                this.crabTargeting = false;
                this.monkeyTargeting = false;
                this.crocodileTargeting = false;
                this.forcedDeck = null;
                this.isPlacingCard = false;
                this.currentDrawnCard = null;
                this.state.pendingPower = null;
                this.state.winner = null;
                this.broadcastState();
                setTimeout(() => this.startGame(), 1000);
                break;
                
            case 'execute_power':
                if (payload.cancel) {
                    ui.logHistory(activePlayer.name, 'a annulé son pouvoir', null);
                    this.nextTurn();
                    break;
                }
                this.executePower(activePlayer, this.state.pendingPower.card.animal, payload);
                break;
                
            case 'execute_parrot_give':
                if(this.state.activeAction !== 'parrot_give') return;
                const opp = this.state.players.find(p => p.id === payload.targetId);
                if(opp) {
                    opp.cards.push(this.state.parrotGiveCard);
                    ui.logHistory(activePlayer.name, `a donné le ${this.state.parrotGiveCard.animal} à ${opp.name}`, 'parrot');
                    this.resolveChameleonPair(opp);
                }
                this.state.parrotGiveCard = null;
                this.nextTurn();
                break;
        }
    }

    executePower(player, animal, payload) {
        this.state.lastAnimation = {
            id: Date.now(),
            type: 'power',
            playerId: player.id,
            power: animal
        };

        const animalNames = {
            lion: 'Lion', chameleon: 'Caméléon', octopus: 'Pieuvre',
            crocodile: 'Crocodile', monkey: 'Singe', crab: 'Crabe',
            parrot: 'Perroquet', hermit_crab: 'Bernard l\'Hermite'
        };

        switch(animal) {
            case 'crocodile':
                if(!payload.targetPlayerId) {
                    this.state.activeAction = 'power_target';
                    this.broadcastState();
                    return; // Wait for target
                }
                const p2 = this.state.players.find(p => p.id === payload.targetPlayerId);
                if(p2) {
                    const c2 = p2.cards.find(c => c.id === payload.cardId);
                    p2.cards = p2.cards.filter(c => c.id !== payload.cardId);
                    ui.logHistory(player.name, `a éliminé le ${c2.animal} de ${p2.name}`, 'crocodile');
                    if (player.id !== this.myId) {
                        const anName = animalNames[c2.animal] || c2.animal;
                        ui.toast(`🐊 ${player.name} élimine le ${anName} de ${p2.name} !`);
                    }
                }
                this.nextTurn();
                break;

            case 'monkey':
                if(!payload.target1 || !payload.target2) {
                    this.state.activeAction = 'power_target';
                    this.broadcastState();
                    return; // Wait for targets
                }
                // payload { target1: {pId, cId}, target2: {pId, cId} }
                const p1 = this.state.players.find(p => p.id === payload.target1.pId);
                const p_2 = this.state.players.find(p => p.id === payload.target2.pId);
                if(p1 && p_2) {
                    const idx1 = p1.cards.findIndex(c => c.id === payload.target1.cId);
                    const idx2 = p_2.cards.findIndex(c => c.id === payload.target2.cId);
                    if(idx1 > -1 && idx2 > -1) {
                        const tmp = p1.cards[idx1];
                        p1.cards[idx1] = p_2.cards[idx2];
                        p_2.cards[idx2] = tmp;
                        
                        const name1 = animalNames[tmp.animal] || tmp.animal;
                        const name2 = animalNames[p_2.cards[idx2].animal] || p_2.cards[idx2].animal;
                        ui.logHistory(player.name, `a échangé le ${name1} de ${p1.name} avec le ${name2} de ${p_2.name}`, 'monkey');
                        
                        if (player.id !== this.myId) {
                            ui.toast(`🐒 ${player.name} a échangé des cartes !`);
                        }
                        this.resolveChameleonPair(p1);
                        this.resolveChameleonPair(p_2);
                    }
                }
                this.nextTurn();
                break;

            case 'crab':
                if(!payload.targetRowPlayerId) {
                    this.state.activeAction = 'power_target';
                    this.broadcastState();
                    return;
                }
                // payload { targetRowPlayerId, fromIndex, toIndex }
                const cp = this.state.players.find(p => p.id === payload.targetRowPlayerId);
                if(cp) {
                    const moved = cp.cards.splice(payload.fromIndex, 1)[0];
                    cp.cards.splice(payload.toIndex, 0, moved);
                    ui.logHistory(player.name, 'a glissé une carte', 'crab');
                    this.resolveChameleonPair(cp);
                    if (player.id !== this.myId) {
                        ui.toast(`🦀 ${player.name} glisse une carte et rejoue !`);
                    } else {
                        ui.toast("🦀 Pouvoir Crabe — Glissez une carte et REJOUEZ !");
                    }
                }
                this.nextTurn(player.id);
                break;
                
            case 'hermit_crab':
                const hasCrab = player.cards.some(c => c.animal === 'crab');
                if(hasCrab) {
                    ui.toast("💖 Bernard l'Hermite — Vous rejouez !");
                    // Inform UI to show love animation
                    this.state.pendingPower.showLove = true;
                    this.broadcastState();
                    setTimeout(() => {
                        this.state.pendingPower.showLove = false;
                        this.nextTurn(player.id);
                    }, 2000);
                } else {
                    this.nextTurn();
                }
                break;

            case 'parrot':
                if(!payload.guess) {
                    this.state.activeAction = 'power_target';
                    this.broadcastState();
                    return;
                }
                
                const guessName = animalNames[payload.guess] || payload.guess;
                
                // First draw next card
                const deckId = payload.guessDeck || 1;
                const arr = deckId === 1 ? this.state.deckLeft : this.state.deckRight;
                if(arr.length === 0) { this.nextTurn(); return; }
                const nextC = arr.pop();
                const realName = animalNames[nextC.animal] || nextC.animal;
                
                if(nextC.animal === payload.guess) {
                    ui.logHistory(player.name, `a deviné ${guessName} avec succès!`, 'parrot');
                    ui.toast(player.id === this.myId 
                        ? `Bien joué ! Vous gagnez le ${guessName} et rejouez !`
                        : `🦜 ${player.name} avait parié ${guessName}... et gagne !`);
                    player.cards.push(nextC);
                    this.resolveChameleonPair(player);
                    this.nextTurn(player.id);
                } else {
                    ui.logHistory(player.name, `s'est trompé. A dit ${guessName} mais c'était ${realName}`, 'parrot');
                    ui.toast(player.id === this.myId
                        ? `Raté ! C'était un(e) ${realName}. Donnez la carte à un adversaire.`
                        : `🦜 ${player.name} avait parié ${guessName}... mais c'était un(e) ${realName} !`);
                    
                    const opponents = this.state.players.filter(p => p.id !== player.id);
                    if(opponents.length === 1) {
                        // Auto give to the only opponent
                        opponents[0].cards.push(nextC);
                        ui.logHistory(player.name, `a donné le ${nextC.animal} à ${opponents[0].name}`, 'parrot');
                        this.resolveChameleonPair(opponents[0]);
                        this.nextTurn();
                    } else {
                        // Must choose opponent
                        this.state.parrotGiveCard = nextC;
                        this.state.activeAction = 'parrot_give';
                        this.broadcastState();
                    }
                }
                break;
                
            default:
                this.nextTurn();
                break;
        }
    }

    checkWinConditions() {
        for(const player of this.state.players) {
            let winReason = null;
            
            // 1. Lion (8 uniques)
            const uniques = new Set(player.cards.map(c => c.animal));
            if(uniques.size >= 8) winReason = "Lion (8 uniques)";
            
            // 2. Octopus (3 pairs)
            const counts = {};
            player.cards.forEach(c => { counts[c.animal] = (counts[c.animal] || 0) + 1; });
            let pairs = 0;
            for(const a in counts) {
                if(counts[a] >= 2 && a !== 'chameleon') pairs++; // chameleons destroy each other anyway
            }
            if(pairs >= 3) winReason = "Pieuvre (3 paires)";
            
            // 3. Standard (4 in a row, chameleon acts as wildcard)
            if(!winReason && player.cards.length >= 4) {
                for(let i=0; i<=player.cards.length - 4; i++) {
                    const slice = player.cards.slice(i, i+4);
                    const baseAnimals = new Set(slice.map(c => c.animal).filter(a => a !== 'chameleon'));
                    if(baseAnimals.size <= 1) {
                        winReason = "4 alignés !";
                        break;
                    }
                }
            }
            
            if(winReason) {
                this.state.status = 'ended';
                player.winCount = (player.winCount || 0) + 1;
                this.state.winner = { id: player.id, name: player.name, reason: winReason, cards: player.cards, matchWin: player.winCount >= 2 };
                this.broadcastState();
                return;
            }
        }
    }

    resolveChameleonPair(player) {
        let chameleons = [];
        for (let i = 0; i < player.cards.length; i++) {
            if (player.cards[i].animal === 'chameleon') {
                chameleons.push(i);
            }
        }
        if (chameleons.length >= 2) {
            ui.logHistory(player.name, "a eu 2 Caméléons ! Ils s'autodétruisent.", null);
            ui.toast("💥 2 Caméléons détruits !");
            soundEngine.play('chameleon');
            // Remove the last two chameleons
            player.cards.splice(chameleons[chameleons.length - 1], 1);
            player.cards.splice(chameleons[chameleons.length - 2], 1);
        }
    }
    handlePlayerQuit(playerId) {
        if(this.isHost) {
            this.state.players = this.state.players.filter(p => p.id !== playerId);
            if(this.state.players.length === 0) {
                // Return to home
            } else {
                this.broadcastState();
            }
        }
    }

    quitGame() {
        ui.hideModal('quit-confirm-modal');
        if(this.isHost) {
            this.conns.forEach(c => c.close());
            if(this.peer) this.peer.destroy();
            ui.showScreen('screen-home');
        } else {
            if(this.conn) this.conn.close();
            if(this.peer) this.peer.destroy();
            ui.showScreen('screen-home');
        }
    }

    // --- RENDER STATE TO DOM ---
    renderState() {
        if (!this.state || !this.state.players) return;
        
        const updateDOM = () => {
            const pCount = document.getElementById('deck-left-count');
            const pCount2 = document.getElementById('deck-right-count');
            if(pCount) pCount.textContent = this.state.deckLeft ? this.state.deckLeft.length : (this.state.deck1 ? this.state.deck1.length : 32);
            if(pCount2) pCount2.textContent = this.state.deckRight ? this.state.deckRight.length : (this.state.deck2 ? this.state.deck2.length : 32);
            
            if(this.state.lastRejected) {
                if(this.state.lastRejected.deck === 1) {
                    document.getElementById('deck-left-thumbnail').style.display = 'block';
                    document.getElementById('deck-left-thumbnail').src = `assets/card_${this.state.lastRejected.animal}.jpg`;
                    document.getElementById('deck-right-thumbnail').style.display = 'none';
                } else {
                    document.getElementById('deck-right-thumbnail').style.display = 'block';
                    document.getElementById('deck-right-thumbnail').src = `assets/card_${this.state.lastRejected.animal}.jpg`;
                    document.getElementById('deck-left-thumbnail').style.display = 'none';
                }
            } else {
                const dt1 = document.getElementById('deck-left-thumbnail');
                if(dt1) dt1.style.display = 'none';
                const dt2 = document.getElementById('deck-right-thumbnail');
                if(dt2) dt2.style.display = 'none';
            }
            
            const myData = this.state.players.find(p => p.id === this.myId);
            if(!myData) return; // Spectator or not yet joined fully
            
            document.getElementById('my-score').textContent = myData.score;
            this.renderRow('my-row', myData.cards, true);
            
            const oppList = document.getElementById('opponents-vertical-list');
            oppList.innerHTML = '';
            this.state.players.forEach((p, idx) => {
                if(p.id === this.myId) return;
                const isActive = this.state.status === 'playing' && this.state.turnIndex === idx;
                
                let cardsHtml = '';
                p.cards.forEach(c => {
                    let cl = "card";
                    if(this.state.activeAction === 'power_target') {
                        const pending = this.state.pendingPower.card.animal;
                        if(pending === 'crocodile' || pending === 'monkey' || pending === 'crab') cl += ' targetable';
                        if(this.monkeyTarget1 && this.monkeyTarget1.cId === c.id) cl += ' selected-target';
                        if(this.crabTargetCard && this.crabTargetCard.cId === c.id) cl += ' selected-target';
                    }
                    if(this.state.status === 'ended' && this.state.winner && this.state.winner.id === p.id) {
                        cl += ' winning-card';
                    }
                    cardsHtml += `<img src="assets/card_${c.animal}.jpg" class="${cl}" data-cardid="${c.id}" style="view-transition-name: card-${c.id};" onclick="game.handleCardClick('${p.id}', '${c.id}')">`;
                });
                
                let clickHandler = '';
                let slotClass = isActive ? 'active-turn' : '';
                if(this.parrotGiveTargeting && p.id !== this.myId) {
                    clickHandler = `onclick="game.sendAction('execute_parrot_give', {targetId: '${p.id}'})"`;
                    slotClass += ' targetable';
                }

                oppList.innerHTML += `<div class="opponent-slot ${slotClass}" data-id="${p.id}" ${clickHandler}>
                    <div class="opp-header">
                        <div class="opp-name">${p.isBot?'🤖':''} ${p.name}</div>
                        <div class="score-badge" style="display:none;"></div>
                    </div>
                    <div class="opp-cards-mini">${cardsHtml}</div>
                </div>`;
            });
            
            // Handle animations
            if(this.state.lastAnimation && this.lastAnimationId !== this.state.lastAnimation.id) {
                this.lastAnimationId = this.state.lastAnimation.id;
                if(this.state.lastAnimation.type === 'place' && this.state.lastAnimation.playerId !== this.myId) {
                    ui.animateCardToOpponent(this.state.lastAnimation.playerId, this.state.lastAnimation.animal);
                } else if(this.state.lastAnimation.type === 'power') {
                    const row = document.querySelector(`.opponent-slot[data-id="${this.state.lastAnimation.playerId}"]`);
                    if(row) {
                        row.style.boxShadow = '0 0 20px 5px var(--primary)';
                        row.style.transition = 'box-shadow 0.5s';
                        setTimeout(() => row.style.boxShadow = 'none', 1000);
                    }
                }
            }

            if (this.state.status === 'ended' && this.state.winner) {
                ui.showRoundEndModal(this.state.winner);
                return;
            } else {
                ui.hideModal('round-end-modal');
            }

            const activePlayer = this.state.players[this.state.turnIndex];
            const isMyTurn = activePlayer && activePlayer.id === this.myId;
            const localArea = document.getElementById('local-player-area');
            
            if (activePlayer) {
                const turnInd = document.getElementById('turn-indicator');
                if(isMyTurn) {
                    turnInd.textContent = "À VOTRE TOUR";
                    turnInd.classList.remove('opp-turn');
                    localArea.classList.add('active-turn');
                    document.getElementById('inactivity-timer-badge').style.display = 'block';
                    this.startTimer();
                    this.startAfkTimer();
                    ui.toast("À vous de jouer ✨");
                } else {
                    turnInd.textContent = `Tour de : ${activePlayer.name}`;
                    turnInd.classList.add('opp-turn');
                    localArea.classList.remove('active-turn');
                    document.getElementById('inactivity-timer-badge').style.display = 'none';
                    this.stopTimer();
                    this.stopAfkTimer();
                    if(activePlayer.isBot && this.isHost) {
                        this.playBotTurn(activePlayer);
                    }
                }
            }

            // Handle Active Action Modals/Buttons
            const actModal = document.getElementById('action-modal');
            const cActions = document.getElementById('card-actions');
            const pActions = document.getElementById('placement-actions');
            const drawnCardImg = document.getElementById('drawn-card-img');
            
            actModal.style.display = 'none';
            cActions.style.display = 'none';
            pActions.style.display = 'none';
            drawnCardImg.style.viewTransitionName = '';
            
            if (activePlayer && !isMyTurn && this.state.status === 'playing') {
                if (this.state.activeAction === 'place_or_reject') {
                    if(this.state.pendingPower && this.state.pendingPower.card) {
                        document.getElementById('drawn-card').style.display = 'flex';
                        actModal.style.display = 'flex';
                        const c = this.state.pendingPower.card;
                        drawnCardImg.src = `assets/card_${c.animal}.jpg`;
                        drawnCardImg.style.viewTransitionName = `card-${c.id}`;
                        cActions.style.display = 'flex';
                        cActions.innerHTML = `<p style="color:var(--secondary);text-align:center;font-weight:900;margin:0;font-size:1.2rem;">${activePlayer.name} réfléchit...</p>`;
                    }
                } else if (this.state.activeAction === 'power_target') {
                    document.getElementById('drawn-card').style.display = 'none';
                    if(this.state.pendingPower && this.state.pendingPower.card) {
                        actModal.style.display = 'flex';
                        cActions.style.display = 'flex';
                        cActions.innerHTML = `<p style="color:var(--secondary);text-align:center;font-weight:900;margin:0;font-size:1.2rem;">${activePlayer.name} cible son pouvoir...</p>`;
                    }
                }
            }
            
            if(!isMyTurn) {
                this.isPlacingCard = false; // Liveness check
                ui.hideModal('parrot-modal');
            }

            if(isMyTurn && this.state.status === 'playing') {
                if(this.state.activeAction === 'place_or_reject') {
                    document.getElementById('drawn-card').style.display = 'flex';
                    actModal.style.display = 'flex';
                    pActions.style.display = 'flex';
                    const c = this.state.pendingPower.card;
                    drawnCardImg.src = `assets/card_${c.animal}.jpg`;
                    drawnCardImg.style.viewTransitionName = `card-${c.id}`;
                    this.isPlacingCard = true;
                    pActions.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
                            <div style="display:flex; gap:8px;">
                                <button class="btn btn-action btn-main" style="flex:1; padding:10px 5px; border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;" onclick="game.sendAction('place_card', {side:'left'})">
                                    <div style="font-size:1.1rem; font-weight:900;">⬅ Placer à Gauche</div>
                                </button>
                                <button class="btn btn-action btn-main" style="flex:1; padding:10px 5px; border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;" onclick="game.sendAction('place_card', {side:'right'})">
                                    <div style="font-size:1.1rem; font-weight:900;">Placer à Droite ➡</div>
                                </button>
                            </div>
                            <button class="btn btn-action btn-reject" style="width:100%; border-radius:16px; padding:12px;" onclick="game.sendAction('reject')">❌ Jeter la carte</button>
                        </div>
                    `;
                }
                else if(this.state.activeAction === 'power_target') {
                    document.getElementById('drawn-card').style.display = 'none';
                    const c = this.state.pendingPower.card;
                    ui.toast(`Pouvoir ${c.animal} : Sélectionnez une cible sur le plateau !`);
                    
                    if(c.animal === 'parrot') {
                        ui.showModal('parrot-modal');
                        const grid = document.getElementById('parrot-animal-grid');
                        grid.innerHTML = '';
                        this.selectedParrotGuess = null;
                        document.getElementById('parrot-placement-actions').style.display = 'none';
                        ANIMALS.forEach(a => {
                            grid.innerHTML += `<div class="parrot-animal-cell" id="parrot-cell-${a.id}" onclick="game.selectParrotAnimal('${a.id}')">
                                <img src="assets/card_${a.id}.jpg">
                                <span>${a.name}</span>
                            </div>`;
                        });
                    } else {
                        let instruction = '';
                        if(c.animal === 'crocodile') {
                            this.crocodileTargeting = true;
                            instruction = "🐊 Cliquez directement sur une carte adverse pour l'éliminer.";
                        } else if(c.animal === 'monkey') {
                            this.monkeyTargeting = true;
                            instruction = this.monkeyTarget1 ? "🐒 Cliquez sur la 2ème carte." : "🐒 Cliquez sur une 1ère carte à échanger.";
                        } else if(c.animal === 'crab') {
                            this.crabTargeting = true;
                            if (this.crabTargetCard) {
                                instruction = "🦀 Vers où décaler cette carte ?";
                            } else {
                                instruction = "🦀 Cliquez sur une carte à décaler.";
                            }
                        }
                        
                        actModal.style.display = 'flex';
                        cActions.style.display = 'flex';
                        let actionsHtml = `<div style="color:white; font-weight:bold; text-align:center; font-size:1.1rem;">${instruction}</div>`;
                        if (c.animal === 'crab' && this.crabTargetCard) {
                            actionsHtml += `
                                <div style="display:flex; gap:10px; margin-top:15px; width:100%;">
                                    <button class="btn-action-place" onclick="game.confirmCrabMove('left')">⬅ GAUCHE</button>
                                    <button class="btn-action-place" onclick="game.confirmCrabMove('right')">DROITE ➡</button>
                                </div>
                                <button class="btn-skip-power" style="margin-top:15px;" onclick="game.cancelCrabTarget()">Annuler la sélection</button>
                            `;
                        } else {
                            actionsHtml += `<button class="btn-skip-power" onclick="game.sendAction('execute_power', {cancel: true})">Passer le pouvoir</button>`;
                        }
                        cActions.innerHTML = actionsHtml;
                    }
                }
                else if(this.state.activeAction === 'parrot_give') {
                    document.getElementById('drawn-card').style.display = 'flex';
                    this.parrotGiveTargeting = true;
                    const c = this.state.parrotGiveCard;
                    drawnCardImg.src = `assets/card_${c.animal}.jpg`;
                    drawnCardImg.style.viewTransitionName = `card-${c.id}`;
                    actModal.style.display = 'flex';
                    cActions.style.display = 'flex';
                    cActions.innerHTML = `
                        <div style="color:white; font-weight:bold; text-align:center; font-size:1.1rem; line-height:1.4;">
                            Raté ! 🦜<br><br>
                            Vous devez donner cette carte.<br>
                            <b>Cliquez sur l'espace d'un adversaire</b> en haut pour lui donner.
                        </div>
                    `;
                }
            }
            
            if(this.state.pendingPower && this.state.pendingPower.showLove) {
                ui.showModal('hermit-love-modal');
            } else {
                ui.hideModal('hermit-love-modal');
            }
        };

        if (!document.startViewTransition) {
            updateDOM();
            return;
        }
        
        try {
            document.startViewTransition(() => {
                updateDOM();
            });
        } catch(e) {
            console.error("View transition error:", e);
            updateDOM();
        }
    }

    renderRow(containerId, cards, isMe = false) {
        const cont = document.getElementById(containerId);
        if(!cont) return;
        cont.innerHTML = '';
        cards.forEach((c, index) => {
            let cl = "card";
            if(this.state.activeAction === 'power_target') {
                const pending = this.state.pendingPower.card.animal;
                if(isMe && pending === 'crab') cl += ' targetable';
                if(!isMe && (pending === 'crocodile' || pending === 'monkey')) cl += ' targetable';
                if(isMe && pending === 'monkey') cl += ' targetable';
                if(this.monkeyTarget1 && this.monkeyTarget1.cId === c.id) cl += ' selected-target';
                if(this.crabTargetCard && this.crabTargetCard.cId === c.id) cl += ' selected-target';
            }
            if(this.state.status === 'ended' && this.state.winner && this.state.winner.cards.some(wc => wc.id === c.id)) {
                cl += ' winning-card';
            }
            cont.innerHTML += `<img src="assets/card_${c.animal}.jpg" class="${cl}" data-cardid="${c.id}" style="view-transition-name: card-${c.id};" onclick="game.handleCardClick('${isMe ? this.myId : containerId.split('-')[1]}', '${c.id}')">`;
        });
    }

    // --- INTERACTION LOGIC ---
    drawCard(deckId) {
        if(this.state.status !== 'playing') return;
        const activePlayer = this.state.players[this.state.turnIndex];
        if(activePlayer.id !== this.myId) return;
        
        this.sendAction('draw', { deck: deckId });
    }

    handleCardClick(playerId, cardId) {
        if(this.crocodileTargeting) {
            if(playerId === this.myId) return; // Cannot target self
            this.crocodileTargeting = false;
            this.sendAction('execute_power', { targetPlayerId: playerId, cardId });
        } else if(this.monkeyTargeting) {
            if(!this.monkeyTarget1) {
                this.monkeyTarget1 = { pId: playerId, cId: cardId };
                ui.toast("🐒 Choisissez la 2ème carte");
                this.renderState();
            } else {
                const target1 = this.monkeyTarget1;
                const target2 = { pId: playerId, cId: cardId };
                this.monkeyTarget1 = null;
                this.monkeyTargeting = false;
                this.sendAction('execute_power', { target1, target2 });
            }
        } else if(this.crabTargeting) {
            const p = this.state.players.find(x => x.id === playerId);
            if(!p) return;
            const idx = p.cards.findIndex(c => c.id === cardId);
            if(idx !== -1) {
                this.crabTargetCard = { pId: playerId, idx: idx, cId: cardId };
                ui.toast("🦀 Choisissez la direction");
                this.renderState();
            }
        } else {
            // OUBLI 13 - Card Admire
            const p = this.state.players.find(x => x.id === playerId);
            if(!p) return;
            const c = p.cards.find(x => x.id === cardId);
            if(!c) return;
            
            const powerDesc = {
                lion: 'Victoire: 8 animaux différents',
                chameleon: 'Joker magique ! 2 caméléons = détruits.',
                octopus: 'Victoire: 3 paires différentes',
                crocodile: 'Élimine 1 carte chez un adversaire.',
                monkey: 'Échange 2 cartes n\'importe où.',
                crab: 'Faites glisser cette carte dans la rangée = 1 pioche sup.',
                parrot: 'Devinez la prochaine carte = 1 pioche sup.',
                hermit_crab: 'Rejouez si vous avez un Crabe dans votre jeu.'
            };
            const animalNames = {
                lion: 'Lion', chameleon: 'Caméléon', octopus: 'Pieuvre',
                crocodile: 'Crocodile', monkey: 'Singe', crab: 'Crabe',
                parrot: 'Perroquet', hermit_crab: 'Bernard l\'Hermite'
            };

            const img = document.getElementById('admire-card-img');
            const nameEl = document.getElementById('admire-card-name');
            const powerEl = document.getElementById('admire-card-power');
            const oppNameEl = document.getElementById('admire-opp-name');

            if(playerId === this.myId) {
                oppNameEl.style.display = 'none';
            } else {
                oppNameEl.style.display = 'block';
                oppNameEl.textContent = `Carte de ${p.name}`;
            }
            img.src = `assets/card_${c.animal}.jpg`;
            nameEl.textContent = animalNames[c.animal];
            powerEl.textContent = powerDesc[c.animal];
            ui.showModal('card-admire-modal');
        }
    }
    
    cancelCrabTarget() {
        this.crabTargetCard = null;
        this.renderState();
    }
    
    confirmCrabMove(dir) {
        if(!this.crabTargetCard) return;
        const target = this.crabTargetCard;
        const p = this.state.players.find(x => x.id === target.pId);
        if(!p) return;
        
        let toIndex = target.idx;
        if(dir === 'left') {
            toIndex = Math.max(0, target.idx - 1);
        } else {
            toIndex = Math.min(p.cards.length - 1, target.idx + 1);
        }
        
        this.crabTargeting = false;
        this.crabTargetCard = null;
        this.sendAction('execute_power', { targetRowPlayerId: p.id, fromIndex: target.idx, toIndex: toIndex });
    }

    handleOpponentClick(playerId) {
        if(this.crocodileTargeting || this.monkeyTargeting || this.crabTargeting) return;
        ui.showModal('card-admire-modal');
        const p = this.state.players.find(x => x.id === playerId);
        if(!p) return;
        // Try showing their first card if they have one
        if(p.cards.length > 0) {
            this.handleCardClick(playerId, p.cards[0].id);
        }
    }

    // --- BOT ENGINE ---
    getBotPowerPayload(bot, animal) {
        let p = { cancel: true };
        switch(animal) {
            case 'crocodile':
                const targets = this.state.players.filter(pl => pl.id !== bot.id && pl.cards.length > 0);
                if(targets.length > 0) {
                    const t = targets[Math.floor(Math.random()*targets.length)];
                    const rc = t.cards[Math.floor(Math.random()*t.cards.length)];
                    p = { targetPlayerId: t.id, cardId: rc.id };
                }
                break;
            case 'monkey':
                const allCards = [];
                this.state.players.forEach(pl => {
                    pl.cards.forEach(c => allCards.push({pId: pl.id, cId: c.id}));
                });
                if(allCards.length >= 2) {
                    for (let i = allCards.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
                    }
                    p = { target1: allCards[0], target2: allCards[1] };
                }
                break;
            case 'crab':
                if(bot.cards.length > 1) {
                    p = { targetRowPlayerId: bot.id, fromIndex: 0, toIndex: bot.cards.length - 1 };
                } else {
                    p = { targetRowPlayerId: bot.id, fromIndex: 0, toIndex: 0 };
                }
                break;
            case 'parrot':
                const idx = Math.floor(Math.random() * ANIMALS.length);
                p = { guess: ANIMALS[idx].id, guessDeck: Math.random() > 0.5 ? 1 : 2 };
                break;
        }
        return p;
    }

    playBotTurn(bot) {
        if(this.botLivenessTimer) clearTimeout(this.botLivenessTimer);
        if(this.botFallbackTimer) clearTimeout(this.botFallbackTimer);
        const thinkTime = 800 + Math.random() * 800;
        
        const executeBotAction = () => {
            if(this.state.players[this.state.turnIndex].id !== bot.id) return; // Prevents stale action
            
            if(this.state.activeAction === 'draw') {
                const dId = Math.random() > 0.5 ? 1 : 2;
                this.processAction(bot.id, 'draw', { deck: dId });
            } 
            else if(this.state.activeAction === 'place_or_reject') {
                const keep = Math.random() > 0.15;
                if(keep) {
                    const side = Math.random() > 0.5 ? 'left' : 'right';
                    this.processAction(bot.id, 'place_card', { side });
                } else {
                    this.processAction(bot.id, 'reject');
                }
            }
            else if(this.state.activeAction === 'power_target') {
                const c = this.state.pendingPower.card;
                const payload = this.getBotPowerPayload(bot, c.animal);
                this.processAction(bot.id, 'execute_power', payload);
            }
            else if(this.state.activeAction === 'parrot_give') {
                const opps = this.state.players.filter(pl => pl.id !== bot.id);
                if(opps.length > 0) {
                    const t = opps[Math.floor(Math.random()*opps.length)];
                    this.processAction(bot.id, 'execute_parrot_give', { targetId: t.id });
                }
            }
        };

        this.botLivenessTimer = setTimeout(executeBotAction, thinkTime);
        
        // Guard against stuck bots
        this.botFallbackTimer = setTimeout(() => {
            if(this.state.status === 'playing' && this.state.players[this.state.turnIndex].id === bot.id) {
                try {
                    executeBotAction();
                } catch(e) {
                    console.error("Bot action failed, skipping turn", e);
                    this.processAction(bot.id, 'execute_power', {cancel: true});
                }
            }
        }, thinkTime + 3000);
    }

    // --- TIMERS ---
    startTimer() {
        this.stopTimer();
        let left = this.inactivitySeconds;
        const b = document.getElementById('inactivity-timer-badge');
        b.textContent = `⌛ Votre tour : ${left}s`;
        this.turnTimer = setInterval(() => {
            left--;
            if(left <= 0) {
                this.stopTimer();
            } else {
                b.textContent = `⌛ Votre tour : ${left}s`;
            }
        }, 1000);
    }
    
    stopTimer() {
        if(this.turnTimer) clearInterval(this.turnTimer);
    }

    startAfkTimer() {
        this.stopAfkTimer();
        this.afkTimer = setTimeout(() => {
            ui.showModal('afk-disconnect-modal');
            const myPlayer = this.state.players.find(p => p.id === this.myId);
            if(myPlayer) {
                myPlayer.isBot = true;
                myPlayer.name = myPlayer.name + " (Bot)";
                this.broadcastState();
                if(this.isHost) {
                    this.playBotTurn(myPlayer);
                }
            }
        }, 100000);
    }
    
    stopAfkTimer() {
        if(this.afkTimer) clearTimeout(this.afkTimer);
    }
    
    quitToHome() {
        location.reload();
    }

    // --- PWA & PARTICLES ---
    initPWA() {
        if('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').then(()=>console.log('SW Registered'));
        }
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-install-app');
            if(btn) {
                btn.style.display = 'block';
                btn.onclick = () => {
                    btn.style.display = 'none';
                    e.prompt();
                };
            }
        });
    }

    initParticles() {
        const canvas = document.getElementById('particle-canvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = Array.from({length: 30}).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 1,
            dx: (Math.random() - 0.5) * 0.5,
            dy: (Math.random() - 0.5) * 0.5,
            c: Math.random() > 0.5 ? '#FF3366' : '#00E5FF'
        }));

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.dx;
                p.y += p.dy;
                if(p.x < 0 || p.x > canvas.width) p.dx *= -1;
                if(p.y < 0 || p.y > canvas.height) p.dy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.c + '66'; // add alpha
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.c;
                ctx.fill();
            });
            requestAnimationFrame(animate);
        };
        animate();
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
}

// Init AudioContext on first interaction
document.addEventListener('touchstart', () => soundEngine.initAudioContext(), {once:true});
document.addEventListener('click', () => soundEngine.initAudioContext(), {once:true});

// Init
const game = new GameEngine();
soundEngine.init();
