/**
 * Golf Card Game - Multi-Player Web Application
 * 6-Card Variation
 */

// --- Constants and State ---
const SUITS = [
    { name: 'hearts', symbol: '♥', color: 'red' },
    { name: 'diamonds', symbol: '♦', color: 'red' },
    { name: 'clubs', symbol: '♣', color: 'black' },
    { name: 'spades', symbol: '♠', color: 'black' }
];

const RANKS = [
    { name: 'A', value: 1 },
    { name: '2', value: -2 },
    { name: '3', value: 3 },
    { name: '4', value: 4 },
    { name: '5', value: 5 },
    { name: '6', value: 6 },
    { name: '7', value: 7 },
    { name: '8', value: 8 },
    { name: '9', value: 9 },
    { name: '10', value: 10 },
    { name: 'J', value: 10 },
    { name: 'Q', value: 10 },
    { name: 'K', value: 0 }
];

class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.faceUp = false;
        this.id = `card-${Math.random().toString(36).substr(2, 9)}`;
    }

    render() {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${this.faceUp ? 'flipped' : ''}`;
        cardEl.dataset.id = this.id;

        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-back"></div>
                <div class="card-front ${this.suit.color}">
                    <div class="top-rank">
                        <span class="rank">${this.rank.name}</span>
                        <span class="suit">${this.suit.symbol}</span>
                    </div>
                    <!--
                    <div class="center-suit">${this.suit.symbol}</div>
                    <div class="bottom-rank" style="transform: rotate(180deg)">
                        <span class="rank">${this.rank.name}</span>
                        <span class="suit">${this.suit.symbol}</span>
                    </div>
                    -->
                </div>
            </div>
        `;
        return cardEl;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        SUITS.forEach(suit => {
            RANKS.forEach(rank => {
                this.cards.push(new Card(suit, rank));
            });
        });
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }

    get count() {
        return this.cards.length;
    }
}

class Player {
    constructor(id, name, isAI = false) {
        this.id = id;
        this.name = name;
        this.isAI = isAI;
        this.cards = [null, null, null, null, null, null]; // 3x2 grid
        this.score = 0;
        this.totalScore = 0;
    }

    calculateScore(onlyFaceUp = false) {
        let currentScore = 0;
        // Check columns (0-3, 1-4, 2-5)
        console.log('Calculating score for ' + this.name);
        for (let i = 0; i < 3; i++) {
            const top = this.cards[i];
            const bottom = this.cards[i + 3];

            if (!top || !bottom) continue;

            if (onlyFaceUp) {
                if (top.faceUp && bottom.faceUp) {
                    if (top.rank.name === bottom.rank.name) continue;
                    console.log('Adding ' + top.rank.value + ' + ' + bottom.rank.value + ' = ' + (top.rank.value + bottom.rank.value));
                    currentScore += top.rank.value + bottom.rank.value;
                } else if (top.faceUp) {
                    console.log('Adding ' + top.rank.value);
                    currentScore += top.rank.value;
                } else if (bottom.faceUp) {
                    console.log('Adding ' + bottom.rank.value);
                    currentScore += bottom.rank.value;
                }
            } else {
                if (top.rank.name === bottom.rank.name) continue;
                console.log('Adding ' + top.rank.value + ' + ' + bottom.rank.value + ' = ' + (top.rank.value + bottom.rank.value));
                currentScore += top.rank.value + bottom.rank.value;
            }
        }
        console.log('Total score for ' + this.name + ': ' + currentScore);
        this.score = currentScore;
        return currentScore;
    }

    get allFaceUp() {
        return this.cards.every(c => c.faceUp);
    }
}

class Game {
    constructor() {
        this.deck = new Deck();
        this.players = [
            new Player('player-1', 'You', false),
            new Player('player-2', 'Chloe', true),
            new Player('player-3', 'Isaac', true),
            new Player('player-4', 'Terri', true)
        ];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.hole = 1;
        this.drawnCard = null;
        this.lastDiscardedCard = null; // Track last discarded card to display
        this.gameState = 'INITIAL_FLIP'; // INITIAL_FLIP, DRAW, SWAP, END_TURN, ROUND_END
        this.roundStarter = -1; // Who ended the round

        this.initEventListeners();
        this.startHole();
    }

    startHole() {
        this.deck.reset();
        this.discardPile = [this.deck.draw()];
        this.discardPile[0].faceUp = true;

        this.players.forEach(p => {
            p.cards = [];
            for (let i = 0; i < 6; i++) {
                p.cards.push(this.deck.draw());
            }
            p.score = 0;
        });

        this.currentPlayerIndex = 0;
        this.gameState = 'INITIAL_FLIP';
        this.log('New hole!');
        this.log('Pick 2 cards to flip over!');
        this.renderAll();
    }

    // --- Rendering ---
    renderAll() {
        document.getElementById('current-hole').textContent = this.hole;

        this.players.forEach((p, idx) => {
            const area = document.getElementById(p.id);
            area.classList.toggle('active', this.currentPlayerIndex === idx);
            const grid = area.querySelector('.card-grid');
            grid.innerHTML = '';
            p.cards.forEach((card, cardIdx) => {
                const cardEl = card.render();
                cardEl.onclick = () => this.handleCardClick(p, cardIdx);
                grid.appendChild(cardEl);
            });
            const currentRoundScore = p.calculateScore(this.gameState !== 'ROUND_END');
            //            area.querySelector('.score').textContent = `Score: ${currentRoundScore} (Total: ${p.totalScore})`;
            //this.log(`${p.name}: ${currentRoundScore} (Total: ${p.totalScore})`);
        });

        const discardEl = document.getElementById('discard-pile');
        discardEl.innerHTML = '';
        if (this.discardPile.length > 0) {
            const topDiscard = this.discardPile[this.discardPile.length - 1];
            discardEl.appendChild(topDiscard.render());
        }
        else {
            discardEl.innerHTML = 'Discard Pile';
        }

        // Render held card
        const heldCardContainer = document.getElementById('held-card-container');
        heldCardContainer.innerHTML = '';
        if (this.drawnCard && this.currentPlayerIndex === 0) {
            const heldCardEl = this.drawnCard.render();
            heldCardEl.style.cursor = 'default';
            heldCardContainer.appendChild(heldCardEl);
        }
        else {
            heldCardContainer.innerHTML = 'Held Card';
        }

        // Render last discarded card
        const lastDiscardContainer = document.getElementById('last-discard-container');
        lastDiscardContainer.innerHTML = '';
        if (this.lastDiscardedCard) {
            this.lastDiscardedCard.faceUp = true;
            const lastDiscardEl = this.lastDiscardedCard.render();
            lastDiscardEl.style.cursor = 'default';
            lastDiscardContainer.appendChild(lastDiscardEl);
        }
        else {
            lastDiscardContainer.innerHTML = 'Last Discard';
        }

        // Draw pile click
        document.getElementById('draw-pile').onclick = () => this.handleDrawPileClick();
        document.getElementById('discard-pile').onclick = () => this.handleDiscardPileClick();

        // UI Buttons
        //document.getElementById('draw-btn').disabled = (this.currentPlayerIndex !== 0 || this.gameState !== 'DRAW');
        //document.getElementById('pass-btn').disabled = (this.currentPlayerIndex !== 0 || !this.drawnCard || this.gameState !== 'SWAP');
    }

    // --- Actions ---
    handleCardClick(player, cardIdx) {
        if (player.id !== 'player-1') return; // Only human can click their cards

        if (this.gameState === 'INITIAL_FLIP') {
            if (!this.players[0].cards[cardIdx].faceUp) {
                this.players[0].cards[cardIdx].faceUp = true;
                const flippedCount = this.players[0].cards.filter(c => c.faceUp).length;

                // Add animation class for flip
                this.renderAll();
                const cardElement = document.querySelector(`[data-id="${this.players[0].cards[cardIdx].id}"]`);
                if (cardElement) {
                    cardElement.classList.add('just-flipped');
                    setTimeout(() => cardElement.classList.remove('just-flipped'), 400);
                }

                if (flippedCount === 2) {
                    setTimeout(() => this.finishInitialFlip(), 300);
                }
            }
        } else if (this.gameState === 'SWAP' && this.currentPlayerIndex === 0) {
            this.swapCard(0, cardIdx, this.drawnCard);
        }
    }

    finishInitialFlip() {
        // AI flip their 2 cards
        for (let i = 1; i < 4; i++) {
            const indices = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
            this.players[i].cards[indices[0]].faceUp = true;
            this.players[i].cards[indices[1]].faceUp = true;
        }
        this.gameState = 'DRAW';
        this.currentPlayerIndex = 0;
        this.log('Your turn! Draw from Deck or Discard.');
        this.renderAll();
    }

    handleDrawPileClick() {
        if (this.gameState !== 'DRAW' || this.currentPlayerIndex !== 0) return;
        this.drawnCard = this.deck.draw();
        this.drawnCard.faceUp = true;
        this.gameState = 'SWAP';
        this.log('Drawn: ' + this.drawnCard.rank.name + ' of ' + this.drawnCard.suit.name + '. Swap it or discard it?');

        // Show drawn card visual
        this.renderAll();
    }

    handleDiscardPileClick() {
        if (this.currentPlayerIndex !== 0) return;

        // If in DRAW state, pick from discard pile
        if (this.gameState === 'DRAW') {
            this.drawnCard = this.discardPile.pop();
            this.gameState = 'SWAP';
            this.log('Picked from discard. Swap with one of your cards.');
            this.renderAll();
        }
        // If in SWAP state with a drawn card, discard it
        else if (this.gameState === 'SWAP' && this.drawnCard) {
            this.discardDrawn();
        }
    }

    log(msg) {
        const logArea = document.getElementById('log-textarea');
        logArea.value = logArea.value.slice(-1000) + '\n' + msg;
        logArea.scrollTop = logArea.scrollHeight;
    }

    swapCard(playerIdx, cardIdx, newCard) {
        const player = this.players[playerIdx];
        const oldCard = player.cards[cardIdx];
        oldCard.faceUp = true;

        // Add swapping animation
        const cardElement = document.querySelector(`#${player.id} .card[data-id="${oldCard.id}"]`);
        if (cardElement) {
            cardElement.classList.add('swapping');
        }

        // Animate discard pile
        const discardEl = document.getElementById('discard-pile');
        discardEl.classList.add('card-added');
        setTimeout(() => discardEl.classList.remove('card-added'), 500);

        player.cards[cardIdx] = newCard;
        newCard.faceUp = true;
        this.discardPile.push(oldCard);

        // Track last discarded card
        this.lastDiscardedCard = oldCard;

        this.drawnCard = null;

        // Wait for animation before continuing
        setTimeout(() => this.finishTurn(), 400);
    }

    discardDrawn() {
        if (this.gameState !== 'SWAP' || this.currentPlayerIndex !== 0) return;

        // Animate discard pile
        const discardEl = document.getElementById('discard-pile');
        discardEl.classList.add('card-added');
        setTimeout(() => discardEl.classList.remove('card-added'), 500);

        // Track last discarded card
        this.lastDiscardedCard = this.drawnCard;

        this.discardPile.push(this.drawnCard);
        this.drawnCard = null;

        setTimeout(() => this.finishTurn(), 300);
    }

    finishTurn() {
        if (this.players[this.currentPlayerIndex].allFaceUp && this.roundStarter === -1) {
            this.roundStarter = this.currentPlayerIndex;
            this.log(this.players[this.currentPlayerIndex].name + " finished! Last turns for everyone.");
            this.log('Last turns for everyone.');
        }

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;

        this.renderAll();

        if (this.currentPlayerIndex === this.roundStarter) {
            this.endRound();
        } else {
            if (this.players[this.currentPlayerIndex].isAI) {
                setTimeout(() => this.playAITurn(), 1500);
            } else {
                this.gameState = 'DRAW';
                this.lastDiscardedCard = null;
                const lastDiscardContainer = document.getElementById('last-discard-container');
                lastDiscardContainer.innerHTML = 'Last Discard';
            }
        }
    }

    playAITurn() {
        const ai = this.players[this.currentPlayerIndex];
        this.log(`${ai.name} is thinking...`);

        const topDiscard = this.discardPile[this.discardPile.length - 1];
        let useDiscard = false;

        // 1. Evaluate Discard Pile
        // Check if topDiscard forms a pair in any column
        let pairTargetIdx = -1;
        for (let i = 0; i < 3; i++) {
            const top = ai.cards[i];
            const bottom = ai.cards[i + 3];

            // If top is face up and matches discard
            if (top.faceUp && top.rank.name === topDiscard.rank.name && !bottom.faceUp) {
                pairTargetIdx = i + 3;
                useDiscard = true;
                break;
            }
            // If bottom is face up and matches discard
            if (bottom.faceUp && bottom.rank.name === topDiscard.rank.name && !top.faceUp) {
                pairTargetIdx = i;
                useDiscard = true;
                break;
            }
        }

        if (!useDiscard && topDiscard.rank.value <= 3) {
            useDiscard = true;
        }

        if (useDiscard) {
            this.drawnCard = this.discardPile.pop();
            this.log(`Using ${this.drawnCard.rank.name}${this.drawnCard.suit.symbol}`);
        } else {
            this.drawnCard = this.deck.draw();
            this.drawnCard.faceUp = true;
            this.log(`Drawing ${this.drawnCard.rank.name}${this.drawnCard.suit.symbol}`);
        }

        // 2. Choose Replacement Target
        let targetIdx = pairTargetIdx;

        if (targetIdx === -1) {
            // Check if drawn card forms a pair
            for (let i = 0; i < 3; i++) {
                const top = ai.cards[i];
                const bottom = ai.cards[i + 3];
                if (top.faceUp && top.rank.name === this.drawnCard.rank.name && !bottom.faceUp) {
                    targetIdx = i + 3;
                    break;
                }
                if (bottom.faceUp && bottom.rank.name === this.drawnCard.rank.name && !top.faceUp) {
                    targetIdx = i;
                    break;
                }
            }
        }

        if (targetIdx === -1) {
            // Find highest value face-up card
            let maxVal = -100;
            let highestIdx = -1;
            let faceDownIndices = [];

            ai.cards.forEach((c, idx) => {
                if (!c.faceUp) {
                    faceDownIndices.push(idx);
                } else if (c.rank.value > maxVal) {
                    maxVal = c.rank.value;
                    highestIdx = idx;
                }
            });

            // If we have face down cards, occasionally pick one to "explore"
            if (faceDownIndices.length > 0 && (Math.random() < 0.4 || maxVal < 5)) {
                targetIdx = faceDownIndices[Math.floor(Math.random() * faceDownIndices.length)];
            } else {
                targetIdx = highestIdx;
            }
        }

        // 3. Final Decision
        const targetCard = ai.cards[targetIdx];
        //this.log(`Swapping ${this.drawnCard.rank.name}${this.drawnCard.suit.symbol} for ${targetCard.rank.name}${targetCard.suit.symbol}`);

        // If drawn from deck and it's worse than target (and not forming a pair)
        if (!useDiscard && targetIdx !== pairTargetIdx && this.drawnCard.rank.value > 6) {
            // Check if it's better than what we have face up
            if (targetCard.faceUp && this.drawnCard.rank.value >= targetCard.rank.value) {
                this.log(`Discarding ${this.drawnCard.rank.name}${this.drawnCard.suit.symbol}`);
                this.discardPile.push(this.drawnCard);
                this.drawnCard = null;
                this.finishTurn();
                return;
            }
        }

        // Perform swap
        this.log(`${ai.name} swaps ${targetCard.rank.name}${targetCard.suit.symbol} with ${this.drawnCard.rank.name}${this.drawnCard.suit.symbol}.`);
        const oldCard = ai.cards[targetIdx];
        oldCard.faceUp = true;
        ai.cards[targetIdx] = this.drawnCard;
        this.drawnCard.faceUp = true;
        this.discardPile.push(oldCard);
        this.drawnCard = null;

        this.finishTurn();
    }

    endRound() {
        this.players.forEach(p => {
            p.cards.forEach(c => c.faceUp = true);
            p.totalScore += p.calculateScore();
        });

        this.renderAll();

        const overlay = document.getElementById('message-overlay');
        const overlayText = document.getElementById('overlay-text');
        overlayText.innerHTML = this.players.map(p => `${p.name}: Round Score ${p.score}, Total ${p.totalScore}`).join('<br>');

        if (this.hole === 9) {
            const winner = [...this.players].sort((a, b) => a.totalScore - b.totalScore)[0];
            document.getElementById('overlay-title').textContent = "Game Complete!";
            overlayText.innerHTML += `<br><br><strong>Winner: ${winner.name}!</strong>`;
            document.getElementById('next-round-btn').textContent = "New Game";
        } else {
            document.getElementById('overlay-title').textContent = `Hole ${this.hole} Complete`;
            document.getElementById('next-round-btn').textContent = "Next Hole";
        }

        this.log(`Round Complete. Scores: ${this.players.map(p => `${p.name}: ${p.score}`).join(', ')}`);
        this.log(`Round Complete. Total Scores: ${this.players.map(p => `${p.name}: ${p.totalScore}`).join(', ')}`);
        overlay.classList.remove('hidden');
    }

    nextRound() {
        if (this.hole === 9) {
            this.hole = 1;
            this.players.forEach(p => p.totalScore = 0);
        } else {
            this.hole++;
        }
        this.roundStarter = -1;
        document.getElementById('message-overlay').classList.add('hidden');
        this.startHole();
    }

    initEventListeners() {
        document.getElementById('next-round-btn').onclick = () => this.nextRound();
        //document.getElementById('pass-btn').onclick = () => this.discardDrawn();

        // Help Modal
        const helpModal = document.getElementById('help-modal');
        document.getElementById('help-btn').onclick = () => helpModal.classList.remove('hidden');
        document.getElementById('close-help-btn').onclick = () => helpModal.classList.add('hidden');
        window.onclick = (event) => {
            if (event.target == helpModal) helpModal.classList.add('hidden');
        };
    }
}

// Start Game
window.onload = () => {
    new Game();
};
