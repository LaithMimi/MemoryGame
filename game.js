class MemoryGame {
    constructor() {
        //set number of rows and columns for game board
        this.difficultyLevels = {
            easy: { rows: 4, cols: 3 },
            medium: { rows: 5, cols: 4 },
            hard: { rows: 6, cols: 5 }
        };
        
        // Initialize with easy difficulty
        const defaultDifficulty = 'easy';
        this.ROWS = this.difficultyLevels[defaultDifficulty].rows;
        this.COLS = this.difficultyLevels[defaultDifficulty].cols;

        this.turns = 0;
        this.pairsMatched = 0;
        this.firstTile = null;
        this.secondTile = null;
        this.canFlip = true; //to prevent flipping more cards while checking matches
        
        //get parts of webpage
        this.gameBoard = document.getElementById('gameBoard');
        this.turnCounter = document.getElementById('turnCounter');
        this.pairsCounter = document.getElementById('pairsMatched');
        this.newGameButton = document.getElementById('newGame');
        
        // Initialize sound effects
         this.sounds = {
            flip: new Audio('sounds/flip.wav'),
            match: new Audio('sounds/match.wav'),
            victory: new Audio('sounds/victory.wav'),
            wrong: new Audio('sounds/wrong.wav')
        };
        
        // Sound state
        this.isSoundEnabled = true;
        
       
        //make a new game button work
        this.newGameButton.addEventListener('click', () => this.initGame());
        
        // Add settings button to header
        this.initializeSettings();
    }
    updateGridLayout() {
        // Dynamically update the CSS grid based on current difficulty
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.COLS}, 1fr)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.ROWS}, 1fr)`;
    }
    initializeSettings() {
        // Create settings button
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'settingsButton';
        settingsBtn.innerHTML = '⚙️';
        settingsBtn.title = 'Settings';
        document.querySelector('.game-header').appendChild(settingsBtn);

        // Get modal elements
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.difficultySelect = document.getElementById('difficultyLevel');
        this.soundToggleCheckbox = document.getElementById('soundToggle');
        this.resetGameBtn = document.getElementById('resetGame');

        // Event listeners
        settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.difficultySelect.addEventListener('change', () => this.changeDifficulty());
        this.soundToggleCheckbox.addEventListener('change', () => this.toggleSound());
        this.resetGameBtn.addEventListener('click', () => this.resetGame());

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });
    }
    openSettings() {
        this.settingsModal.classList.add('active');
        // Update settings to match current state
        this.soundToggleCheckbox.checked = this.isSoundEnabled;
    }

    closeSettingsModal() {
        this.settingsModal.classList.remove('active');
    }

    changeDifficulty() {
        const difficulty = this.difficultySelect.value;
        const { rows, cols } = this.difficultyLevels[difficulty];
        this.ROWS = rows;
        this.COLS = cols;
        this.initGame();
        this.closeSettingsModal();
    }
    toggleSound() {
        this.isSoundEnabled = this.soundToggleCheckbox.checked;
    }
    resetGame() {
        this.initGame();
        this.closeSettingsModal();
    }

    playSound(soundName) {
        if (this.isSoundEnabled && this.sounds[soundName]) {
            // Reset sound to start and play
            const sound = this.sounds[soundName];
            sound.currentTime = 0;
            sound.play().catch(error => console.log('Sound play failed:', error));
        }
    }

    initGame() {
        //reset game 
        this.turns = 0;
        this.pairsMatched = 0;
        this.updateCounters();
        this.gameBoard.innerHTML = '';
        
        // Update grid layout
        this.updateGridLayout();

        //create and mix tiles
        const tiles = this.createTilePairs();
        const shuffledTiles = this.shuffleTiles(tiles);
        
        //show game board
        this.renderBoard(shuffledTiles);
    }

    createTilePairs() {
        const totalPairs=(this.ROWS*this.COLS)/2;
        const pairs = [];
        
        for (let i = 1; i <= totalPairs; i++) {
            pairs.push(i, i); //add each number twice for pairs
        }
        
        return pairs;
    }

    shuffleTiles(pairs) {
        for (let i = pairs.length-1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i+1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }
        return pairs;
    }
    /*should make this :
    <div id="gameBoard">
        <div class="tile" data-value="1">
        <img src="images/default/img-1.png">
    </div>
    <div class="tile" data-value="2">
        <img src="images/default/img-2.jpg">
    </div>   
    <!-- More tiles... -->
    </div>
    */
    renderBoard(pairs) {
        pairs.forEach((value, index) => {
            // "value" is the card number (1-8)
            // "index" is the position (0-15)
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.value = value;
            
            const img = document.createElement('img');
            img.src = `images/default/img-${value}.png`;

            tile.appendChild(img);
            
            tile.addEventListener('click', ()=> this.handleTileClick(tile));
            this.gameBoard.appendChild(tile);
        });
    }
    /*
    Handle Tile Clicks:
        Checks if the tile can be flipped.
        If it's the first tile of the pair, reveals it. 
        If it's the second tile of the pair, reveals it and checks for a match.
    */
    handleTileClick(tile) {
        if (!this.canFlip || tile.classList.contains('revealed')) {
            return;
        }

        if (!this.firstTile) {
            // First tile of the pair
            this.firstTile = tile;
            this.revealTile(tile);
        } else if (!this.secondTile && tile !== this.firstTile) {
            // Second tile of the pair
            this.secondTile = tile;
            this.revealTile(tile);
            this.turns++;
            this.updateCounters();
            this.checkMatch();
        } else if (this.firstTile && this.secondTile) {
            // Third tile clicked, hide the first two tiles if they don't match
            if (this.firstTile.dataset.value !== this.secondTile.dataset.value) {
                this.hideTile(this.firstTile);
                this.hideTile(this.secondTile);
            }
            this.resetTiles();
            this.handleTileClick(tile); // Recursively handle the third tile click
        }
    }

    revealTile(tile) {
        tile.classList.add('revealed');
        this.playSound('flip');

        // Add a slight delay to ensure smooth animation
        setTimeout(() => {
            tile.querySelector('img').style.display = 'block';
        }, 150);
    }

    hideTile(tile) {
        tile.classList.remove('revealed');
    }

  checkMatch() {
        const value1 = this.firstTile.dataset.value;
        const value2 = this.secondTile.dataset.value;

        if (value1 === value2) {
            // Matched!
            this.playSound('match');
            this.firstTile.classList.add('matched');
            this.secondTile.classList.add('matched');
            this.pairsMatched++;
            this.updateCounters();
            this.resetTiles();
            
            if (this.pairsMatched === (this.ROWS * this.COLS) / 2) {
                this.gameComplete();
            }
        } else {
            // No match
            this.playSound('wrong');
            this.canFlip = false;
            setTimeout(() => {
                this.hideTile(this.firstTile);
                this.hideTile(this.secondTile);
                this.resetTiles();
                this.canFlip = true;
            }, 1000);
        }
    }

    resetTiles() {
        this.firstTile = null;
        this.secondTile = null;
    }

    updateCounters() {
        this.turnCounter.textContent = this.turns;
        this.pairsCounter.textContent = this.pairsMatched;
    }

    gameComplete() {
        this.gameBoard.classList.add('game-complete');
        this.playSound('victory');
        setTimeout(() => {
            alert(`Congratulations! You completed the game in ${this.turns} turns!`);
            this.gameBoard.classList.remove('game-complete');
        }, 1000);
    }
}

// Initialize game
function initGame() {
    const game = new MemoryGame();
    game.initGame();
}