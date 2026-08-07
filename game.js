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

// Son désactivé — stub pour compatibilité
const soundEngine = { play() {}, init() {}, toggleMute() {}, updateBtn() {}, initAudioContext() {} };


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
            monkey: "Volez une carte, le singe prend sa place !",
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
    showQuitConfirmModal() { this.showModal('quit-confirm-modal'); },
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

    animateCrocodileAttack(anim) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '999999';
        overlay.style.pointerEvents = 'none';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.transition = 'opacity 0.3s';
        document.body.appendChild(overlay);

        const isAttackerMe = anim.attackerId === game.myId;
        const isTargetMe = anim.targetId === game.myId;
        
        let startY = '-100vh';
        if(isAttackerMe) startY = '100vh';

        let targetY = '0px';
        if (isTargetMe) targetY = '20vh'; 
        else if (isAttackerMe) targetY = '-20vh';

        const targetCard = document.createElement('div');
        targetCard.style.width = '140px';
        targetCard.style.height = '210px';
        targetCard.style.backgroundImage = `url(assets/card_${anim.targetCardAnimal}.jpg)`;
        targetCard.style.backgroundSize = 'contain';
        targetCard.style.backgroundPosition = 'center';
        targetCard.style.backgroundRepeat = 'no-repeat';
        targetCard.style.backgroundColor = 'white';
        targetCard.style.borderRadius = '12px';
        targetCard.style.border = '4px solid white';
        targetCard.style.boxShadow = '0 10px 30px rgba(0,0,0,0.8), 0 0 40px rgba(255,0,0,0.4)';
        targetCard.style.position = 'absolute';
        targetCard.style.top = `calc(50% + ${targetY})`;
        targetCard.style.left = '50%';
        targetCard.style.transform = 'translate(-50%, -50%) scale(1)';
        targetCard.style.transition = 'all 0.4s ease-out';
        overlay.appendChild(targetCard);

        const crocoWrapper = document.createElement('div');
        crocoWrapper.style.position = 'absolute';
        crocoWrapper.style.top = `calc(50% + ${targetY})`;
        crocoWrapper.style.left = '50%';
        crocoWrapper.style.transform = `translate(-50%, calc(-50% + ${startY})) scale(0.5) rotate(${isAttackerMe ? '-20deg' : '20deg'})`;
        crocoWrapper.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        crocoWrapper.style.filter = 'drop-shadow(0 20px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 30px rgba(46,204,113,0.6))';

        const crocoHead = document.createElement('div');
        crocoHead.style.width = '240px';
        crocoHead.style.height = '240px';
        crocoHead.style.backgroundImage = `url(assets/card_crocodile.jpg)`;
        crocoHead.style.backgroundSize = '360px 540px';
        crocoHead.style.backgroundPosition = 'center 35%';
        crocoHead.style.backgroundRepeat = 'no-repeat';
        crocoHead.style.clipPath = 'circle(42% at 50% 50%)';
        crocoWrapper.appendChild(crocoHead);
        overlay.appendChild(crocoWrapper);

        const title = document.createElement('div');
        title.style.position = 'absolute';
        title.style.top = '15%';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.color = '#ff4757';
        title.style.fontSize = 'clamp(1.5rem, 5vw, 2.5rem)';
        title.style.fontWeight = '900';
        title.style.textShadow = '0 0 20px rgba(255,71,87,0.8)';
        title.style.textAlign = 'center';
        title.style.opacity = '0';
        title.style.transition = 'opacity 0.4s';
        title.innerHTML = isAttackerMe ? "VOUS ATTAQUEZ ! 🐊" : "ATTAQUE CROCODILE ! 🐊";
        overlay.appendChild(title);

        setTimeout(() => {
            title.style.opacity = '1';
            crocoWrapper.style.transform = `translate(-50%, -50%) scale(1.4) rotate(0deg)`;
            
            setTimeout(() => {
                const biteAnim = [
                    { transform: 'translate(-50%, -50%) scale(1.4) rotate(-15deg)' },
                    { transform: 'translate(-50%, -50%) scale(1.6) rotate(15deg)' },
                    { transform: 'translate(-50%, -50%) scale(1.4) rotate(-15deg)' },
                    { transform: 'translate(-50%, -50%) scale(1.6) rotate(15deg)' },
                    { transform: 'translate(-50%, -50%) scale(1.4) rotate(0deg)' }
                ];
                crocoWrapper.animate(biteAnim, { duration: 400, iterations: 1 });
                if(soundEngine) soundEngine.play('crocodile');
                
                setTimeout(() => {
                    targetCard.style.transition = 'all 0.3s cubic-bezier(0.6, -0.28, 0.735, 0.045)';
                    targetCard.style.transform = 'translate(-50%, -50%) scale(0) rotate(360deg)';
                    targetCard.style.opacity = '0';
                    targetCard.style.filter = 'contrast(200%) brightness(50%)';
                    
                    setTimeout(() => {
                        title.style.opacity = '0';
                        crocoWrapper.style.transition = 'all 0.4s ease-in';
                        crocoWrapper.style.transform = `translate(-50%, -50%) scale(2)`;
                        crocoWrapper.style.opacity = '0';
                        overlay.style.opacity = '0';
                        setTimeout(() => overlay.remove(), 400);
                    }, 800);
                }, 200);
            }, 450);
        }, 50);
    },

    animateMonkeyAttack(anim) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '999999';
        overlay.style.pointerEvents = 'none';
        document.body.appendChild(overlay);

        const isAttackerMe = anim.attackerId === game.myId;
        
        let startY = '-50vh';
        if(isAttackerMe) startY = '50vh';

        // 1. Find opponent's slot position to aim for
        const targetSlot = document.querySelector(`.opponent-slot[data-id="${anim.targetId}"]`);
        let targetRect = { top: window.innerHeight/4, left: window.innerWidth/2, width: 80, height: 120 };
        if (targetSlot) {
            targetRect = targetSlot.getBoundingClientRect();
        }

        const monkeyHead = document.createElement('div');
        monkeyHead.style.width = '160px';
        monkeyHead.style.height = '160px';
        monkeyHead.style.backgroundImage = `url(assets/card_monkey.jpg)`;
        monkeyHead.style.backgroundSize = '240px 360px';
        monkeyHead.style.backgroundPosition = 'center 35%';
        monkeyHead.style.backgroundRepeat = 'no-repeat';
        monkeyHead.style.clipPath = 'circle(40% at 50% 50%)';
        monkeyHead.style.position = 'absolute';
        
        monkeyHead.style.top = `calc(50% + ${startY})`;
        monkeyHead.style.left = '50%';
        monkeyHead.style.transform = `translate(-50%, -50%) scale(0.5) rotate(-180deg)`;
        monkeyHead.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        monkeyHead.style.filter = 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))';
        overlay.appendChild(monkeyHead);

        const title = document.createElement('div');
        title.style.position = 'absolute';
        title.style.top = '15%';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.color = '#f39c12';
        title.style.fontSize = 'clamp(1.5rem, 5vw, 2.5rem)';
        title.style.fontWeight = '900';
        title.style.textShadow = '0 0 20px rgba(243,156,18,0.8)';
        title.style.textAlign = 'center';
        title.style.opacity = '0';
        title.style.transition = 'opacity 0.4s';
        title.innerHTML = isAttackerMe ? "VOL DE CARTE ! 🐒" : "ATTAQUE SINGE ! 🐒";
        overlay.appendChild(title);

        setTimeout(() => {
            title.style.opacity = '1';
            
            monkeyHead.style.top = `${targetRect.top + targetRect.height/2}px`;
            monkeyHead.style.left = `${targetRect.left + targetRect.width/2}px`;
            monkeyHead.style.transform = `translate(-50%, -50%) scale(0.8) rotate(360deg)`;
            
            if(soundEngine) soundEngine.play('monkey');
            
            setTimeout(() => {
                monkeyHead.style.transition = 'all 0.3s ease-in';
                monkeyHead.style.transform = `translate(-50%, -50%) scale(0) rotate(720deg)`;
                monkeyHead.style.opacity = '0';
                title.style.opacity = '0';
                
                setTimeout(() => {
                    overlay.remove();
                }, 400);
            }, 600);
        }, 50);
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
        
        document.getElementById('round-end-title').textContent = isMe ? `🎉 VOUS REMPORTEZ LA PARTIE !` : `❌ ${winnerData.name.toUpperCase()} REMPORTE LA PARTIE !`;
        document.getElementById('round-end-subtitle').textContent = isMe ? "Champion(ne) de la Jungle Touze !" : "La victoire vous échappe...";
        if (isMe) {
            soundEngine.play('win');
            this.playConfetti();
        }
        
        const cardsDiv = document.getElementById('round-end-cards');
        cardsDiv.innerHTML = '';
        winnerData.cards.forEach((c, index) => {
            cardsDiv.innerHTML += `<img src="assets/card_${c.animal}.jpg" style="width:60px; aspect-ratio:2/3; border-radius:10px; border:3px solid var(--gold); box-shadow:0 0 20px rgba(255,215,0,0.6); object-fit:contain; background:white; transform:scale(0); animation:bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; animation-delay:${index * 0.1}s;">`;
        });
        
        const scoresDiv = document.getElementById('round-end-scores');
        if(scoresDiv) {
            scoresDiv.innerHTML = `
                <div style="font-size:1.1rem; color:rgba(255,255,255,0.8); text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">Victoire validée par :</div>
                <div style="font-size:1.6rem; font-weight:900; color:var(--gold); text-shadow:0 0 15px rgba(255,215,0,0.5); animation:pulse-turn 2s infinite;">${winnerData.reason}</div>
            `;
            scoresDiv.style.background = 'rgba(0,0,0,0.4)';
            scoresDiv.style.border = '1.5px solid rgba(255,215,0,0.3)';
            scoresDiv.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
            scoresDiv.style.textAlign = 'center';
            scoresDiv.style.padding = '15px';
            scoresDiv.style.transform = 'scale(0)';
            scoresDiv.style.animation = 'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards';
            scoresDiv.style.animationDelay = `${winnerData.cards.length * 0.1 + 0.2}s`;
        }
        
        const rematchBtn = document.getElementById('btn-rematch');
        rematchBtn.textContent = '🔄 Nouvelle Partie';
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
        this.myTurnToastShown = false;
        
        this.initPWA();
        this.initParticles();
    }

    getInitialState() {
        return {
            status: 'waiting',
            players: [],
            deckLeft: [],
            deckRight: [],
            turnIndex: 0,
            activeAction: null,
            pendingPower: null,
            history: []  // [{player, action, power}] — broadcasté à tous
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
        // CRITICAL: set myId to a non-empty string BEFORE pushing player into state
        // If myId stays '' (falsy), checks like !payload.targetPlayerId will incorrectly
        // treat the host as "no target" when a client tries to target them.
        this.myId = 'JT-' + this.roomCode;
        try {
            this.peer = new Peer(this.myId);
            
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
            const hostBar = document.getElementById('host-actions-bar');
            if (hostBar) hostBar.style.display = 'flex';
        } catch(e) {
            console.error("PeerJS error:", e);
            alert("Erreur de connexion au serveur multijoueur. Vérifiez votre connexion.");
        }
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
        
        const targetPeerId = "JT-" + code;
        try {
            this.peer = new Peer();
            this.peer.on('open', (id) => {
                this.myId = id;
                this.state.players.push({ id: this.myId, name, cards: [], isBot: false, isHost: false, winCount: 0 });
                document.getElementById('join-msg').textContent = "Connexion...";
                this.conn = this.peer.connect(targetPeerId);
                
                this.conn.on('open', () => {
                    this.conn.send({ type: 'JOIN', name: this.myName, id: this.myId });
                });
                
                this.conn.on('data', (data) => {
                    if(data.type === 'STATE') {
                        this.state = data.state;
                        if(this.state.status === 'waiting') {
                            ui.showScreen('screen-host');
                            // Client: hide host-only controls
                            const hostBar = document.getElementById('host-actions-bar');
                            if(hostBar) hostBar.style.display = 'none';
                            document.getElementById('room-code-display').textContent = this.roomCode;
                        }
                        else if(this.state.status === 'rolling') {
                            ui.showScreen('screen-game');
                            // Show dice modal for client with live results
                            ui.showModal('dice-modal');
                            const btn = document.getElementById('btn-roll-dice');
                            if(btn) btn.style.display = 'none'; // Host rolls for all
                            const scoresList = document.getElementById('dice-scores-list');
                            const resEl = document.getElementById('dice-result');
                            if(resEl) resEl.innerHTML = this.state.diceWinner
                                ? `<span style="color:var(--secondary);font-size:1.3rem;">C'est ${this.state.diceWinner} qui commence !</span>`
                                : "Résultats des dés :";
                            if(scoresList && this.state.diceResults) {
                                scoresList.innerHTML = this.state.diceResults
                                    .map(r => `<div><strong>${r.name}</strong> : 🎲 ${r.roll}</div>`)
                                    .join('');
                            }
                            const box = document.getElementById('dice-visual-box');
                            if(box && this.state.diceResults && this.state.diceResults.length > 0) {
                                const last = this.state.diceResults[this.state.diceResults.length - 1];
                                box.textContent = last.roll;
                            }
                        }
                        else if(this.state.status === 'playing') {
                            ui.showScreen('screen-game');
                            ui.hideModal('dice-modal'); // Close dice modal when game starts
                            if(this.state.players[this.state.turnIndex]) {
                                ui.toast(`C'est parti ! ${this.state.players[this.state.turnIndex].name} commence !`);
                            }
                        }
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
            this.peer.on('error', (err) => {
                document.getElementById('join-msg').textContent = "Salon introuvable !";
            });
        } catch(e) {
            console.error("PeerJS error:", e);
            document.getElementById('join-msg').textContent = "Erreur de connexion multijoueur.";
        }
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
            // Trim history to last 30 entries before sending
            if(this.state.history && this.state.history.length > 30) {
                this.state.history = this.state.history.slice(0, 30);
            }
            this.conns.forEach(c => c.send({ type: 'STATE', state: this.state }));
            this.renderState();
            // Trigger bot actions
            const botActionStates = ['draw', 'place_or_reject', 'power_target', 'parrot_failed'];
            if(this.state.status === 'playing' && botActionStates.includes(this.state.activeAction)) {
                const ap = this.state.players[this.state.turnIndex];
                if(ap && ap.isBot) {
                    setTimeout(() => this.playBotTurn(ap), 0);
                }
            }
        }
    }

    // Append to history array (broadcasté à tous via state)
    addHistory(player, action, power) {
        if(!this.state.history) this.state.history = [];
        this.state.history.unshift({ player, action, power, ts: Date.now() });
        if(this.state.history.length > 30) this.state.history.pop();
        // Also update local DOM immediately for host
        ui.logHistory(player, action, power);
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
        this.state.diceResults = []; // Shared dice results for all clients
        this.state.status = 'rolling';
        this.broadcastState();
        ui.showScreen('screen-game');
        
        ui.showModal('dice-modal');
        const resEl = document.getElementById('dice-result');
        if(resEl) resEl.innerHTML = "Lancement des dés...";
        const scoresList = document.getElementById('dice-scores-list');
        if(scoresList) scoresList.innerHTML = "";
        
        // Show the roll button for host only
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
        if(!this.state.diceResults) this.state.diceResults = [];
        
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
                    box.offsetHeight;
                    box.style.animation = 'diceRoll 0.5s ease-out';
                    box.textContent = roll;
                }
                
                // Broadcast each roll so clients can see results in real time
                this.state.diceResults.push({ name: p.name, roll });
                this.broadcastState();
                
                soundEngine.play('dice');
                rollIndex++;
                setTimeout(rollNext, 800);
            } else {
                // Determine order
                rolls.sort((a, b) => b.roll - a.roll);
                this.state.turnOrder = rolls.map(r => r.id);
                this.state.players.sort((a, b) => this.state.turnOrder.indexOf(a.id) - this.state.turnOrder.indexOf(b.id));
                this.state.turnIndex = 0;
                
                const starter = rolls[0];
                if(resEl) resEl.innerHTML = `<span style="color:var(--secondary);font-size:1.3rem;">C'est ${starter.name} qui commence !</span>`;
                
                // Final broadcast with winner info before starting
                this.state.diceWinner = starter.name;
                this.broadcastState();
                
                setTimeout(() => {
                    ui.hideModal('dice-modal');
                    this.state.status = 'playing';
                    this.state.activeAction = 'draw';
                    this.state.diceResults = [];
                    this.state.diceWinner = null;
                    this.broadcastState();
                    ui.toast(`C'est parti, ${starter.name} commence !`);
                }, 2500);
            }
        };
        rollNext();
    }

    setupDecks() {
        // Build a balanced deck: exactly 8 copies of each animal (64 total)
        let deck = [];
        for(let i = 0; i < 8; i++) {
            ANIMALS.forEach(a => deck.push({ id: a.id + '_' + i, animal: a.id }));
        }

        // True random Fisher-Yates using crypto.getRandomValues for unbiased shuffling
        const cryptoShuffle = (arr) => {
            const buf = new Uint32Array(arr.length);
            crypto.getRandomValues(buf);
            for (let i = arr.length - 1; i > 0; i--) {
                const j = buf[i] % (i + 1);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };

        cryptoShuffle(deck);

        // Anti-clustering: reduce long streaks (max 2 same animal in a row)
        const deCluster = (arr) => {
            const MAX_STREAK = 2;
            for (let i = MAX_STREAK; i < arr.length; i++) {
                if (arr[i].animal === arr[i-1].animal && arr[i].animal === arr[i-MAX_STREAK].animal) {
                    // Find the next card that's different and swap
                    let swapped = false;
                    for (let j = i + 1; j < arr.length; j++) {
                        if (arr[j].animal !== arr[i].animal) {
                            [arr[i], arr[j]] = [arr[j], arr[i]];
                            swapped = true;
                            break;
                        }
                    }
                    if (!swapped) break; // No swap possible, accept the streak
                }
            }
            return arr;
        };

        deCluster(deck);

        // Balanced split: ensure each half has ~4 of each animal (not always 32/32 exactly)
        // Strategy: interleave then split to guarantee balance
        const half1 = [], half2 = [];
        const animalBuckets = {};
        ANIMALS.forEach(a => { animalBuckets[a.id] = []; });
        deck.forEach(c => animalBuckets[c.animal].push(c));

        // Assign 4 cards of each animal to each half, then shuffle each half
        ANIMALS.forEach(a => {
            const cards = animalBuckets[a.id];
            half1.push(...cards.slice(0, 4));
            half2.push(...cards.slice(4, 8));
        });

        cryptoShuffle(half1);
        cryptoShuffle(half2);
        deCluster(half1);
        deCluster(half2);

        this.state.deckLeft = half1;
        this.state.deckRight = half2;
        this.state.players.forEach(p => p.cards = []);
    }


    nextTurn(extraTurnForPlayerId = null) {
        if(this.state && this.state.status !== 'playing') return;
        
        this.clearLocks(); // clearLocks AVANT checkWinConditions pour éviter les memory leaks
        this.checkWinConditions();
        if(this.state.status !== 'playing') return;
        
        let nextId = extraTurnForPlayerId;
        const currentP = this.state.players[this.state.turnIndex];
        
        if (!nextId && currentP && currentP.extraTurn) {
            nextId = currentP.id;
            currentP.extraTurn = false;
        }

        if(nextId) {
            this.state.turnIndex = this.state.turnOrder.indexOf(nextId);
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
        this.myTurnToastShown = false;
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
                
                const originalDeck = this.state.pendingPower.fromDeck;
                this.state.lastRejected = { animal: this.state.pendingPower.card.animal, deck: originalDeck };
                
                // Put rejected card on top of the deck it came from (face up)
                this.state.pendingPower.card.faceUp = true;
                if (originalDeck === 1) {
                    if(this.state.deckLeft) this.state.deckLeft.unshift(this.state.pendingPower.card);
                } else {
                    if(this.state.deckRight) this.state.deckRight.unshift(this.state.pendingPower.card);
                }
                
                this.addHistory(activePlayer.name, 'a jeté sa carte', null);
                
                // Force draw from the OTHER deck
                const otherDeckId = originalDeck === 1 ? 2 : 1;
                const otherDeckArr = otherDeckId === 1 ? this.state.deckLeft : this.state.deckRight;
                
                if (otherDeckArr && otherDeckArr.length > 0) {
                    const forcedDrawn = otherDeckArr.shift();
                    
                    if(this.state.lastRejected && this.state.lastRejected.deck === otherDeckId) {
                        this.state.lastRejected = null;
                    }
                    // Do NOT force faceUp on both decks - only the rejected card is face up (already set above)
                    
                    this.state.pendingPower = { card: forcedDrawn, fromDeck: otherDeckId, forced: true };
                    this.addHistory(activePlayer.name, 'pioche obligatoirement dans la pile opposée', null);
                    this.broadcastState();
                } else {
                    this.nextTurn();
                }
                break;


            case 'place_card':
                if(this.state.activeAction !== 'place_or_reject') return;
                const side = payload.side; // 'left' or 'right'
                const c = this.state.pendingPower.card;
                
                soundEngine.play(c.animal);
                this.addHistory(activePlayer.name, `a placé une carte`, c.animal);
                
                if (side === 'left') activePlayer.cards.unshift(c);
                else activePlayer.cards.push(c);
                
                this.state.lastAnimation = { id: Math.random(), type: 'place', playerId: activePlayer.id, animal: c.animal };

                this.resolveChameleonPair(activePlayer);
                
                const activePowers = ['crocodile', 'monkey', 'crab', 'parrot'];
                // Only trigger power if it was drawn from the deck (not a stolen card) and not a parrot success
                if (activePowers.includes(c.animal) && !this.state.pendingPower.monkeySuccess && !this.state.pendingPower.parrotSuccess) {
                    this.state.activeAction = 'power_target';
                    this.state.pendingPower = { card: c, fromDeck: this.state.pendingPower.fromDeck };
                    this.broadcastState();
                } else if (c.animal === 'hermit_crab' && !this.state.pendingPower.parrotSuccess) {
                    const hasCrab = activePlayer.cards.some(card => card.animal === 'crab');
                    if(hasCrab) {
                        ui.toast("💖 Bernard l'Hermite — Vous rejouez !");
                        this.state.activeAction = 'animating';
                        this.state.pendingPower.showLove = true;
                        this.broadcastState();
                        setTimeout(() => {
                            if(this.state && this.state.pendingPower) this.state.pendingPower.showLove = false;
                            this.nextTurn(activePlayer.id);
                        }, 2000);
                    } else {
                        this.state.pendingPower = null;
                        this.nextTurn();
                    }
                } else {
                    this.state.pendingPower = null;
                    this.nextTurn();
                }
                break;
                
            case 'acknowledge_parrot_fail':
                if (this.state.activeAction === 'parrot_failed') {
                    ui.hideModal('parrot-result-modal');
                    this.state.pendingPower = null;
                    this.nextTurn();
                }
                break;

                
            case 'REMATCH':
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
                    this.addHistory(activePlayer.name, 'a annulé son pouvoir', null);
                    this.nextTurn();
                    break;
                }
                this.executePower(activePlayer, this.state.pendingPower.card.animal, payload);
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
                if(!payload || !payload.targetPlayerId) {
                    if (player && player.isBot) {
                        console.warn("Bot Crocodile target missing, skipping turn");
                        this.nextTurn();
                        return;
                    }
                    this.state.activeAction = 'power_target';
                    this.broadcastState();
                    return; // Wait for target
                }
                const p2 = this.state.players.find(p => p.id === payload.targetPlayerId);
                if(p2) {
                    try {
                        let myCrocoIdx = player.cards.findIndex(c => c.id === this.state.pendingPower.card.id);
                        if (myCrocoIdx === -1) myCrocoIdx = player.cards.findIndex(c => c.animal === 'crocodile');
                        
                        let crocodileCard = null;
                        if (myCrocoIdx !== -1) {
                            crocodileCard = player.cards.splice(myCrocoIdx, 1)[0];
                        }
                        
                        const c2 = p2.cards.find(c => c.id === payload.cardId);
                        p2.cards = p2.cards.filter(c => c.id !== payload.cardId);
                        
                        if (c2) {
                            this.addHistory(player.name, `a éliminé le ${c2.animal} de ${p2.name}`, 'crocodile');
                            
                            if (this.state.deckLeft) this.state.deckLeft.push(c2);
                            
                            this.state.lastAnimation = {
                                id: Date.now(),
                                type: 'crocodile_attack',
                                attackerId: player.id,
                                targetId: p2.id,
                                targetCardAnimal: c2.animal
                            };

                            if (player.id !== this.myId) {
                                const animalNames = { lion: 'Lion', chameleon: 'Caméléon', octopus: 'Pieuvre', crocodile: 'Crocodile', monkey: 'Singe', crab: 'Crabe', parrot: 'Perroquet', hermit_crab: "Bernard l'Hermite" };
                                const anName = animalNames[c2.animal] || c2.animal;
                                ui.toast(`🐊 ${player.name} élimine le ${anName} de ${p2.name} !`);
                            }
                        }
                        
                        if (crocodileCard && this.state.deckRight) this.state.deckRight.push(crocodileCard);
                        
                    } catch (e) {
                        console.error("Crocodile power failed:", e);
                    }
                    this.nextTurn();
                } else {
                    this.nextTurn();
                }
                break;

            case 'monkey':
                if(!payload || !payload.targetPlayerId) {
                    if (player && player.isBot) {
                        console.warn("Bot Monkey target missing, skipping turn");
                        this.nextTurn();
                        return;
                    }
                    this.state.activeAction = 'power_target';
                    this.broadcastState();
                    return; // Wait for target
                }
                const p2M = this.state.players.find(p => p.id === payload.targetPlayerId);
                if(p2M) {
                    try {
                        let myMonkeyIdx = player.cards.findIndex(c => c && c.id === this.state.pendingPower.card.id);
                        if (myMonkeyIdx === -1) {
                            myMonkeyIdx = player.cards.findIndex(c => c && c.animal === 'monkey');
                        }
                        if (myMonkeyIdx === -1) { this.nextTurn(); return; }
                        
                        const monkeyCard = player.cards.splice(myMonkeyIdx, 1)[0];
                        let targetIdx = p2M.cards.findIndex(c => c && c.id === payload.cardId);
                        if (targetIdx === -1 && p2M.cards.length > 0) targetIdx = 0;
                        if (targetIdx === -1) { player.cards.push(monkeyCard); this.nextTurn(); return; }
                        
                        const stolenCard = p2M.cards[targetIdx];
                        if (!stolenCard) { player.cards.push(monkeyCard); this.nextTurn(); return; }
                        
                        p2M.cards[targetIdx] = monkeyCard;
                        
                        this.state.lastAnimation = {
                            id: Date.now(),
                            type: 'monkey_attack',
                            attackerId: player.id,
                            targetId: p2M.id,
                            targetCardAnimal: stolenCard.animal,
                            targetCardId: stolenCard.id
                        };
                        
                        this.state.pendingPower = { card: stolenCard, monkeySuccess: true };
                        this.state.activeAction = 'place_or_reject';
                        
                        this.addHistory(player.name, `a échangé un singe contre le ${stolenCard.animal} de ${p2M.name}`, 'monkey');
                    } catch(e) {
                        console.error("Monkey power failed:", e);
                        this.nextTurn();
                        return;
                    }
                    this.resolveChameleonPair(p2M); 
                    this.broadcastState();
                } else {
                    this.nextTurn();
                }
                break;

            case 'crab':
                if(!payload || !payload.targetRowPlayerId) {
                    if (player && player.isBot) {
                        console.warn("Bot Crab target missing, skipping turn");
                        this.nextTurn();
                        return;
                    }
                    this.state.activeAction = 'power_target';
                    this.broadcastState();
                    return;
                }
                // payload { targetRowPlayerId, fromIndex, toIndex }
                const cp = this.state.players.find(p => p.id === payload.targetRowPlayerId);
                if(cp) {
                    const moved = cp.cards.splice(payload.fromIndex, 1)[0];
                    cp.cards.splice(payload.toIndex, 0, moved);
                    this.addHistory(player.name, 'a glisé une carte (Crabe)', 'crab');
                    this.resolveChameleonPair(cp);
                    if (player.id !== this.myId) {
                        ui.toast(`🦀 ${player.name} a glissé une carte.`);
                    } else {
                        ui.toast("🦀 Pouvoir Crabe — Carte décalée !");
                    }
                }
                this.nextTurn();
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
                if(arr.length === 0) {
                    ui.toast("La pioche est vide ! Le pouvoir Perroquet échoue.");
                    this.state.activeAction = 'animating';
                    this.broadcastState();
                    setTimeout(() => {
                        if(this.state && this.state.status === 'playing') this.nextTurn();
                    }, 2000);
                    return; 
                }
                const nextC = arr.shift();
                const realName = animalNames[nextC.animal] || nextC.animal;
                
                if(nextC.animal === payload.guess) {
                    this.addHistory(player.name, `a deviné ${guessName} avec succès!`, 'parrot');
                    ui.toast(player.id === this.myId 
                        ? `Bien joué ! Vous gagnez le ${guessName} et rejouez !`
                        : `🦜 ${player.name} avait parié ${guessName}... et gagne !`);
                    player.extraTurn = true;
                    this.state.pendingPower = { card: nextC, fromDeck: deckId, parrotSuccess: true };
                    this.state.activeAction = 'place_or_reject';
                    this.broadcastState();
                } else {
                    this.addHistory(player.name, `s'est trompé. A dit ${guessName} mais c'était ${realName}`, 'parrot');
                    
                    nextC.faceUp = true;
                    arr.unshift(nextC);
                    this.state.lastRejected = { animal: nextC.animal, deck: deckId };
                    
                    this.state.pendingPower = { 
                        failedGuess: guessName, 
                        realCard: nextC, 
                        playerId: player.id 
                    };
                    this.state.activeAction = 'parrot_failed';
                    this.broadcastState();
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
            const cards = player.cards;
            if(cards.length === 0) continue;

            const chameleonCount = cards.filter(c => c.animal === 'chameleon').length;
            const nonChameleon = cards.filter(c => c.animal !== 'chameleon');

            // 1. Lion (8 animaux différents — caméléon compte comme joker)
            const uniqueAnimals = new Set(nonChameleon.map(c => c.animal));
            const effectiveUniques = uniqueAnimals.size + Math.min(chameleonCount, 8 - uniqueAnimals.size);
            if(effectiveUniques >= 8) winReason = "Lion (8 uniques)";

            // 2. Pieuvre (3 paires — caméléon joker complète une paire incomplète)
            if(!winReason) {
                const hasOctopus = cards.some(c => c.animal === 'octopus');
                if(hasOctopus) {
                    const counts = {};
                    nonChameleon.forEach(c => { counts[c.animal] = (counts[c.animal] || 0) + 1; });
                    let realPairs = 0;
                    let singles = 0;
                    for(const a in counts) {
                        if(counts[a] >= 2) realPairs++;
                        else singles++;
                    }
                    // Each chameleon can pair with a single card
                    const chameleonPairs = Math.min(chameleonCount, singles);
                    const totalPairs = realPairs + chameleonPairs;
                    if(totalPairs >= 3) winReason = "Pieuvre (3 paires)";
                }
            }

            // 3. Standard (4 alignés — caméléon joker)
            if(!winReason && cards.length >= 4) {
                for(let i = 0; i <= cards.length - 4; i++) {
                    const slice = cards.slice(i, i + 4);
                    const baseAnimals = new Set(slice.map(c => c.animal).filter(a => a !== 'chameleon'));
                    if(baseAnimals.size <= 1) {
                        winReason = "4 alignés !";
                        break;
                    }
                }
            }

            if(winReason) {
                this.state.status = 'ended';
                this.state.winner = { id: player.id, name: player.name, reason: winReason, cards: player.cards, matchWin: true };
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
            this.addHistory(player.name, "a eu 2 Caméléons ! Ils s'autodétruisent.", null);
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

        // Compute at renderState scope so both updateDOM and the flag setter can use it
        const activePlayer = this.state.players[this.state.turnIndex];
        const isMyTurn = activePlayer && activePlayer.id === this.myId;
        
        const updateDOM = () => {
            // Sync history from state (important for clients who don't run processAction)
            if(this.state.history && this.state.history.length > 0 && !this.isHost) {
                const h = document.getElementById('history-list');
                if(h) {
                    h.innerHTML = this.state.history.map(entry => {
                        const icon = entry.power ? `<img src="assets/card_${entry.power}.jpg" class="history-mini-img">` : '';
                        return `<div class="history-item"><strong>${entry.player}</strong> ${entry.action} ${icon}</div>`;
                    }).join('');
                }
            }

            // Setup decks visually
            const d1 = document.getElementById('deck-left');
            const d2 = document.getElementById('deck-right');
            if(d1) {
                const pCount = document.getElementById('deck-left-count');
                if(pCount) pCount.textContent = this.state.deckLeft ? this.state.deckLeft.length : 0;
                
                const dt1 = document.getElementById('deck-left-thumbnail');
                if(dt1) {
                    if (this.state.deckLeft && this.state.deckLeft.length > 0 && this.state.deckLeft[0].faceUp) {
                        dt1.style.display = 'block';
                        dt1.src = `assets/card_${this.state.deckLeft[0].animal}.jpg`;
                    } else {
                        dt1.style.display = 'none';
                    }
                }
            }
            if(d2) {
                const pCount = document.getElementById('deck-right-count');
                if(pCount) pCount.textContent = this.state.deckRight ? this.state.deckRight.length : 0;
                
                const dt2 = document.getElementById('deck-right-thumbnail');
                if(dt2) {
                    if (this.state.deckRight && this.state.deckRight.length > 0 && this.state.deckRight[0].faceUp) {
                        dt2.style.display = 'block';
                        dt2.src = `assets/card_${this.state.deckRight[0].animal}.jpg`;
                    } else {
                        dt2.style.display = 'none';
                    }
                }
            }
            
            const myData = this.state.players.find(p => p.id === this.myId);
            if(!myData) return;
            
            // isMyTurn already declared at renderState scope
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
                    if(isMyTurn && this.state.activeAction === 'power_target') {
                        const pending = this.state.pendingPower.card.animal;
                        // Croc and monkey: target opponent cards. Crab: can target any player's cards.
                        if(pending === 'crocodile' || pending === 'monkey' || pending === 'crab') cl += ' targetable';
                    }
                    if(this.state.status === 'ended' && this.state.winner && this.state.winner.id === p.id) {
                        cl += ' winning-card';
                    }
                    if (this.crabTargetCard && this.crabTargetCard.id === c.id) {
                        cl += ' crab-selected';
                    }
                    cardsHtml += `<img src="assets/card_${c.animal}.jpg" class="${cl}" data-cardid="${c.id}" style="view-transition-name: card-${c.id};" onclick="game.handleCardClick('${p.id}', '${c.id}')">`;
                });
                
                let clickHandler = '';
                let slotClass = isActive ? 'active-turn' : '';
                
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
                } else if(this.state.lastAnimation.type === 'monkey_attack') {
                    ui.animateMonkeyAttack(this.state.lastAnimation);
                } else if(this.state.lastAnimation.type === 'crocodile_attack') {
                    ui.animateCrocodileAttack(this.state.lastAnimation);
                }
            }

            if (this.state.status === 'ended' && this.state.winner) {
                ui.showRoundEndModal(this.state.winner);
                return;
            } else {
                ui.hideModal('round-end-modal');
            }

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
                    if(!this.myTurnToastShown) {
                        ui.toast("À vous de jouer ✨");
                        this.myTurnToastShown = true;
                    }
                } else {
                    turnInd.textContent = `Tour de : ${activePlayer.name}`;
                    turnInd.classList.add('opp-turn');
                    localArea.classList.remove('active-turn');
                    document.getElementById('inactivity-timer-badge').style.display = 'none';
                    this.stopTimer();
                    this.stopAfkTimer();
                    // Bot triggering is handled exclusively in broadcastState() to avoid race conditions
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
                    
                    let titleHtml = '';
                    if (this.state.pendingPower.forced) {
                        titleHtml = `<div style="color:var(--danger); font-weight:bold; text-align:center; font-size:1.2rem; margin-bottom:10px;">Carte piochée obligatoirement !<br>Vous devez la placer :</div>`;
                    } else if (this.state.pendingPower.parrotSuccess) {
                        titleHtml = `<div style="color:var(--gold); font-weight:bold; text-align:center; font-size:1.2rem; margin-bottom:10px;">Gagné ! 🦜<br>Vous avez deviné juste ! Placez-la :</div>`;
                    } else if (this.state.pendingPower.monkeySuccess) {
                        titleHtml = `<div style="color:var(--gold); font-weight:bold; text-align:center; font-size:1.2rem; margin-bottom:10px;">Vol réussi ! 🐒<br>Où placer la carte volée ?</div>`;
                    }
                    
                    const isForced = this.state.pendingPower.forced
                                  || this.state.pendingPower.monkeySuccess
                                  || this.state.pendingPower.parrotSuccess;
                    const rejectBtnHtml = isForced ? '' : `<button class="btn-action-reject" style="width:100%; border-radius:16px; padding:12px;" onclick="game.sendAction('reject')">❌ Jeter la carte</button>`;
                    
                    pActions.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
                            ${titleHtml}
                            <div style="display:flex; gap:8px;">
                                <button class="btn-action-place" style="flex:1; padding:12px 5px; border-radius:16px;" onclick="game.sendAction('place_card', {side:'left'})">⬅ Gauche</button>
                                <button class="btn-action-place" style="flex:1; padding:12px 5px; border-radius:16px;" onclick="game.sendAction('place_card', {side:'right'})">Droite ➡</button>
                            </div>
                            ${rejectBtnHtml}
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
                            instruction = "🐒 Cliquez sur une carte à voler.";
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
                                    <button class="btn-action-place" onclick="game.localCrabMove('left')">⬅ GAUCHE</button>
                                    <button class="btn-action-place" onclick="game.localCrabMove('right')">DROITE ➡</button>
                                </div>
                                <button class="btn-action-gold" style="margin-top:15px;" onclick="game.confirmCrabMove()">✅ Valider la position</button>
                                <button class="btn-skip-power" style="margin-top:10px;" onclick="game.cancelCrabTarget()">Annuler la sélection</button>
                            `;
                        } else {
                            actionsHtml += `<button class="btn-skip-power" onclick="game.sendAction('execute_power', {cancel: true})">Passer le pouvoir</button>`;
                        }
                        cActions.innerHTML = actionsHtml;
                    }
                }
                else if (this.state.activeAction === 'parrot_failed') {
                    document.getElementById('drawn-card').style.display = 'none';
                    const titleEl = document.getElementById('parrot-result-title');
                    const descEl = document.getElementById('parrot-result-desc');
                    const imgEl = document.getElementById('parrot-result-img');
                    
                    const p = this.state.pendingPower;
                    if(p) {
                        const realName = animalNames[p.realCard.animal] || p.realCard.animal;
                        titleEl.innerHTML = `<span style="color:#ff6b6b">Perdu !</span>`;
                        descEl.innerHTML = `Vous aviez parié <strong>${p.failedGuess}</strong>,<br>mais c'était un(e) <strong>${realName}</strong>.`;
                        imgEl.src = `assets/card_${p.realCard.animal}.jpg`;
                        imgEl.style.display = 'inline-block';
                    }
                    
                    ui.showModal('parrot-result-modal');
                }
            }
            
            if(this.state.pendingPower && this.state.pendingPower.showLove) {
                ui.showModal('hermit-love-modal');
            } else {
                ui.hideModal('hermit-love-modal');
            }
        };

        // Set targeting flags BEFORE the viewTransition (synchronously)
        // This ensures handleCardClick sees the correct flag even if the transition is async
        if(isMyTurn && this.state.activeAction === 'power_target' && this.state.pendingPower) {
            const animal = this.state.pendingPower.card.animal;
            if(animal === 'crocodile') this.crocodileTargeting = true;
            else if(animal === 'monkey') this.monkeyTargeting = true;
            else if(animal === 'crab') this.crabTargeting = true;
        }

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
            
            const activePlayer = this.state.players[this.state.turnIndex];
            const isMyTurn = activePlayer && activePlayer.id === this.myId;
            
            if(this.state.activeAction === 'power_target' && isMyTurn) {
                const pending = this.state.pendingPower.card.animal;
                // Crab targets OWN cards AND opponent cards; croc/monkey = opponent cards only
                if(isMe && (pending === 'crab')) cl += ' targetable';
                if(!isMe && (pending === 'crocodile' || pending === 'monkey' || pending === 'crab')) cl += ' targetable';
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
        // --- STATE-DRIVEN targeting: read current state directly, no reliance on stale flags ---
        const activePlayer = this.state.players[this.state.turnIndex];
        const isMyTurn = activePlayer && activePlayer.id === this.myId;
        const isPowerTarget = isMyTurn
            && this.state.status === 'playing'
            && this.state.activeAction === 'power_target'
            && this.state.pendingPower
            && this.state.pendingPower.card;

        if(isPowerTarget) {
            const animal = this.state.pendingPower.card.animal;

            if(animal === 'crocodile') {
                if(playerId === this.myId) return; // Cannot target self
                this.crocodileTargeting = false;
                this.sendAction('execute_power', { targetPlayerId: playerId, cardId });
                return;
            }

            if(animal === 'monkey') {
                if(playerId === this.myId) return; // Cannot target self
                this.monkeyTargeting = false;
                this.sendAction('execute_power', { targetPlayerId: playerId, cardId });
                return;
            }

            if(animal === 'crab') {
                // If crabTargetCard is already set, this click replaces the selection
                const p = this.state.players.find(x => x.id === playerId);
                if(!p) return;
                const idx = p.cards.findIndex(c => c.id === cardId);
                if(idx !== -1) {
                    this.crabTargetCard = { pId: playerId, originalIdx: idx, currentIdx: idx, cId: cardId };
                    ui.toast("🦀 Déplacez la carte avec ⬅ ➡ puis validez");
                    this.renderState();
                }
                return;
            }
            // parrot is handled via its own modal (not card click)
        }

        // --- Default: show card info modal ---
        const p = this.state.players.find(x => x.id === playerId);
        if(!p) return;
        const c = p.cards.find(x => x.id === cardId);
        if(!c) return;
        
        const powerDesc = {
            lion: 'Victoire: 8 animaux différents',
            chameleon: 'Joker magique ! 2 caméléons = détruits.',
            octopus: 'Victoire: 3 paires différentes',
            crocodile: 'Élimine 1 carte chez un adversaire.',
            monkey: 'Volez une carte à un adversaire, le singe prend sa place.',
            crab: 'Faites glisser cette carte dans la rangée = 1 pioche sup.',
            parrot: 'Devinez la prochaine carte = 1 pioche sup.',
            hermit_crab: 'Rejouez si vous avez un Crabe dans votre jeu.'
        };
        const animalNames = {
            lion: 'Lion', chameleon: 'Caméléon', octopus: 'Pieuvre',
            crocodile: 'Crocodile', monkey: 'Singe', crab: 'Crabe',
            parrot: 'Perroquet', hermit_crab: "Bernard l'Hermite"
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
    
    cancelCrabTarget() {
        if(!this.crabTargetCard) return;
        const target = this.crabTargetCard;
        const p = this.state.players.find(x => x.id === target.pId);
        
        if (p && target.originalIdx !== target.currentIdx) {
            const moved = p.cards.splice(target.currentIdx, 1)[0];
            p.cards.splice(target.originalIdx, 0, moved);
        }
        
        this.crabTargetCard = null;
        this.renderState();
    }
    
    localCrabMove(dir) {
        if(!this.crabTargetCard) return;
        const target = this.crabTargetCard;
        const p = this.state.players.find(x => x.id === target.pId);
        if(!p) return;
        
        let newIdx = target.currentIdx;
        if(dir === 'left') {
            newIdx = Math.max(0, target.currentIdx - 1);
        } else {
            newIdx = Math.min(p.cards.length - 1, target.currentIdx + 1);
        }
        
        if(newIdx !== target.currentIdx) {
            const moved = p.cards.splice(target.currentIdx, 1)[0];
            p.cards.splice(newIdx, 0, moved);
            target.currentIdx = newIdx;
            this.renderState();
        }
    }
    
    confirmCrabMove() {
        if(!this.crabTargetCard) return;
        const target = this.crabTargetCard;
        const p = this.state.players.find(x => x.id === target.pId);
        
        // Revert local changes so the server can apply them cleanly
        if (p && target.originalIdx !== target.currentIdx) {
            const moved = p.cards.splice(target.currentIdx, 1)[0];
            p.cards.splice(target.originalIdx, 0, moved);
        }
        
        this.crabTargeting = false;
        this.crabTargetCard = null;
        
        if(target.originalIdx === target.currentIdx) {
            this.sendAction('execute_power', { cancel: true });
        } else {
            this.sendAction('execute_power', { targetRowPlayerId: target.pId, fromIndex: target.originalIdx, toIndex: target.currentIdx });
        }
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
        
        // Helper to score a player's threat level (closer to win = higher score)
        const getThreatScore = (player) => {
            const counts = {};
            player.cards.forEach(c => { counts[c.animal] = (counts[c.animal] || 0) + 1; });
            const unique = Object.keys(counts).length;
            const pairs = Object.values(counts).filter(v => v >= 2).length;
            return unique + (pairs * 2); 
        };

        switch(animal) {
            case 'crocodile': {
                const opponents = this.state.players.filter(pl => pl.id !== bot.id && pl.cards.length > 0);
                if(opponents.length > 0) {
                    // Sort opponents by threat descending
                    opponents.sort((a, b) => getThreatScore(b) - getThreatScore(a));
                    const targetOpp = opponents[0];
                    
                    const counts = {};
                    targetOpp.cards.forEach(c => { counts[c.animal] = (counts[c.animal] || 0) + 1; });
                    
                    // Priority: lion or chameleon (rarest/most valuable) > part of a pair > random
                    const HIGH_VALUE = ['lion', 'chameleon'];
                    let targetCard = targetOpp.cards.find(c => HIGH_VALUE.includes(c.animal));
                    if (!targetCard) targetCard = targetOpp.cards.find(c => counts[c.animal] >= 2);
                    if (!targetCard) targetCard = targetOpp.cards[Math.floor(Math.random() * targetOpp.cards.length)];
                    
                    p = { targetPlayerId: targetOpp.id, cardId: targetCard.id };
                }
                break;
            }
            case 'monkey': {
                const opponents = this.state.players.filter(pl => pl.id !== bot.id && pl.cards.length > 0);
                if(opponents.length > 0) {
                    // Count bot's own cards to find what would complete a pair
                    const botCounts = {};
                    bot.cards.forEach(c => { botCounts[c.animal] = (botCounts[c.animal] || 0) + 1; });
                    
                    // Find best steal target across ALL opponents
                    let bestTarget = null, bestScore = -1;
                    const HIGH_VALUE = ['lion', 'chameleon'];
                    
                    opponents.forEach(opp => {
                        opp.cards.forEach(card => {
                            let score = 0;
                            if (HIGH_VALUE.includes(card.animal)) score += 10; // High-value card
                            if (botCounts[card.animal]) score += 5; // Completes a pair for bot
                            if (score > bestScore) {
                                bestScore = score;
                                bestTarget = { opp, card };
                            }
                        });
                    });
                    
                    // Fallback: random opponent, random card
                    if (!bestTarget) {
                        const targetOpp = opponents[Math.floor(Math.random() * opponents.length)];
                        if (targetOpp && targetOpp.cards.length > 0) {
                            const targetCard = targetOpp.cards[Math.floor(Math.random() * targetOpp.cards.length)];
                            if (targetCard) p = { targetPlayerId: targetOpp.id, cardId: targetCard.id };
                        }
                    } else {
                        p = { targetPlayerId: bestTarget.opp.id, cardId: bestTarget.card.id };
                    }
                }
                break;
            }

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

    playBotTurn(botRef) {
        if(this.botLivenessTimer) clearTimeout(this.botLivenessTimer);
        if(this.botFallbackTimer) clearTimeout(this.botFallbackTimer);
        const thinkTime = 800 + Math.random() * 800;
        
        const executeBotAction = () => {
            try {
                // Always re-read the active player from current state — stale closure reference causes bugs
                const bot = this.state.players[this.state.turnIndex];
                if(!bot || !bot.isBot) return; // Not a bot turn anymore
                if(botRef && bot.id !== botRef.id) return; // Wrong bot

                if(this.state.activeAction === 'draw') {
                    const dId = Math.random() > 0.5 ? 1 : 2;
                    this.processAction(bot.id, 'draw', { deck: dId });
                } 
                else if(this.state.activeAction === 'place_or_reject') {
                    const isForced = this.state.pendingPower && this.state.pendingPower.forced;
                    const keep = isForced ? true : Math.random() > 0.15;
                    if(keep) {
                        const side = Math.random() > 0.5 ? 'left' : 'right';
                        this.processAction(bot.id, 'place_card', { side });
                    } else {
                        this.processAction(bot.id, 'reject');
                    }
                }
                else if(this.state.activeAction === 'power_target') {
                    if(!this.state.pendingPower || !this.state.pendingPower.card) {
                        console.warn('Bot power_target: pendingPower.card missing, skipping');
                        this.processAction(bot.id, 'execute_power', { cancel: true });
                        return;
                    }
                    const animal = this.state.pendingPower.card.animal;
                    const payload = this.getBotPowerPayload(bot, animal);
                    console.log(`[BOT ${bot.name}] Executing power: ${animal}`, payload);
                    this.processAction(bot.id, 'execute_power', payload);
                }
                else if(this.state.activeAction === 'parrot_failed') {
                    // Delay slightly so the bot doesn't immediately dismiss the parrot result
                    setTimeout(() => {
                        if (this.state.players[this.state.turnIndex] && this.state.players[this.state.turnIndex].id === bot.id) {
                            this.processAction(bot.id, 'acknowledge_parrot_fail', {});
                        }
                    }, 1000);
                }
            } catch(e) {
                console.error("Bot action failed:", e);
                const bot = this.state.players[this.state.turnIndex];
                if(bot) this.processAction(bot.id, 'execute_power', {cancel: true});
            }
        };

        this.botLivenessTimer = setTimeout(executeBotAction, thinkTime);
        
        // Guard against stuck bots
        this.botFallbackTimer = setTimeout(() => {
            const bot = this.state.players[this.state.turnIndex];
            if(this.state.status === 'playing' && bot && bot.isBot) {
                try {
                    executeBotAction();
                } catch(e) {
                    console.error("Bot fallback failed, skipping turn", e);
                    if(bot) this.processAction(bot.id, 'execute_power', {cancel: true});
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

// Init
const game = new GameEngine();
