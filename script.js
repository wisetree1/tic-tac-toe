"use strict";

const htmlRenderer = (function() {  
    const htmlCells = [];

    let board = document.querySelector(".board");
    for (let i = 0; i < 9; i++) {
        htmlCells.push(board.querySelector(`.cell-${i}`));
    }

    const getHtmlCells = () => htmlCells;

    const getEmptyHtmlCells = (cells) => {
        let emptyCells = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (cells[i][j] == " ") {
                    emptyCells.push(htmlCells[i*3 + j]);
                }
            }
        }
        return emptyCells;
    };

    const render = (cells) => {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                htmlCells[i*3 + j].textContent = cells[i][j];
            }
        }
    };

    const clear = () => {
        for (let i = 0; i < 9; i++) {
            htmlCells[i].textContent = "";
        }
    };

    let messageElement;
    const createBannerDiv = () => {
        const gameSettingsForm = document.querySelector(".game-settings");
        document.body.removeChild(gameSettingsForm);

        const newTopElement = document.createElement("div");
        newTopElement.classList.add("top-element");
        
        messageElement = document.createElement("h1");
        messageElement.textContent = "THE GAME HAS STARTED!";
        messageElement.classList.add("message");

        
        const restartButton = document.createElement("button");
        restartButton.textContent = "RESTART";
        restartButton.classList.add("start-btn");
        restartButton.addEventListener("click", () => {
            location.reload();
        });

        newTopElement.appendChild(restartButton);
        newTopElement.appendChild(messageElement);
        
        const board = document.querySelector(".board");
        document.body.insertBefore(newTopElement, board);
    };

    const editMessage = (newMessage) => {
        messageElement.textContent = newMessage;
    };

    return { render, clear, getHtmlCells, getEmptyHtmlCells, createBannerDiv, editMessage };
})()

const board = (function() {
    const cells = [[" ", " ", " "], [" ", " ", " "], [" ", " ", " "]];

    const canMarkCell = (cellIdx) => {
        return cellIdx >= 0 && cellIdx <= 8 && cells[Math.floor(cellIdx / 3)][cellIdx % 3] == " ";
    };

    const markCell = (cellIdx, cellSymbol) => {
        cells[Math.floor(cellIdx / 3)][cellIdx % 3] = cellSymbol;
    };

    const unmarkCell = (cellIdx) => {
        cells[Math.floor(cellIdx / 3)][cellIdx % 3] = " ";
    };

    const getCells = () => cells;

    const getEmptyCellIndexes = () => {
        let emptyCells = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (cells[r][c] == " ") {
                    emptyCells.push(r * 3 + c);
                }
            }
        }
        return emptyCells;
    };
    
    const areAllCellsMarked = () => {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (cells[r][c] == " ") {
                    return false;
                }
            }
        }
        return true; 
    };

    const getOpponentSymbol = (ownSymbol) => {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (cells[r][c] != " " && cells[r][c] != ownSymbol) {
                    return cells[r][c];
                }
            }
        }
        return null;
    };

    const checkWinCondition = (cellIdx, cellSymbol) => {
        let r = Math.floor(cellIdx / 3);
        let c = cellIdx % 3;
        let didWin = false;

        let horizontal = true;
        for (let ci = 0; ci < 3; ci++) {
            horizontal = horizontal && (cells[r][ci] == cellSymbol);
        }

        let vertical = true;
        for (let ri = 0; ri < 3; ri++) {
            vertical = vertical && (cells[ri][c] == cellSymbol);
        }

        let diagonalLeft = true;
        let diagonalRight = true;
        for (let ri = 0, ci = 0; ri < 3, ci < 3; ri++, ci++) {
            diagonalLeft = diagonalLeft && (cells[ri][ci] == cellSymbol);
        }
        for (let ri = 0, ci = 2; ri < 3, ci >= 0; ri++, ci--) {
            diagonalRight = diagonalRight && (cells[ri][ci] == cellSymbol);
        }

        return didWin || horizontal || vertical || diagonalLeft || diagonalRight;
    };

    return {
        markCell,
        unmarkCell,
        canMarkCell,
        getCells,
        getEmptyCellIndexes,
        areAllCellsMarked,
        getOpponentSymbol,
        checkWinCondition,
    };
})();

const game = (function(board, renderer) {
    const startGame = async (settingsData) => {
        let player1 = getPlayer(settingsData.get("player1"), settingsData.get("difficulty1"), board, renderer, "x");
        let player2 = getPlayer(settingsData.get("player2"), settingsData.get("difficulty2"), board, renderer, "o");
        renderer.createBannerDiv();

        await playGame(player1, player2);
    };
    
    const playGame = async (player1, player2) => {
        let didWin;
        let roundNum = 1;
        let turn = Math.floor(Math.random() * 2);  // 0 - p1, 1 - p2

        while (!board.areAllCellsMarked()) {
            renderer.editMessage(`Player's ${turn+1} turn!`);

            let currentPlayer = (turn == 0) ? player1 : player2;
            didWin = await playRound(currentPlayer, roundNum, turn);
            if (didWin) {
                break;
            }

            turn = (turn + 1) % 2;
            roundNum++;
        }

        renderer.render(board.getCells());

        if (didWin) {
            renderer.editMessage(`Player ${turn+1} wins!`);
        } else {
            renderer.editMessage(`It's a draw!`);
        }
    };
    
    const playRound = async (player) => {
        let cellIdx = await player.play();
        renderer.render(board.getCells());

        let didWin = board.checkWinCondition(cellIdx, player.getSymbol());
        return didWin;
    };

    return {
        startGame,
    };
})(board, htmlRenderer);


function player(cellSymbol) {
    const getSymbol = () => cellSymbol;

    return { getSymbol };
}

function getHumanPlayer(board, htmlRenderer, cellSymbol) {
    let thisPlayer = player(cellSymbol);

    let cellIdx = -1;
    const waitForClick = (cells, event) => {
        const promises = [];
        
        for (let cell of cells) {
            let cellPromise = new Promise((resolve) => {
                const listener = (e) => {
                    cellIdx = e.target.className.split("-")[1];

                    cell.removeEventListener(event, listener);
                    resolve();
                }
                cell.addEventListener(event, listener);
            });

            promises.push(cellPromise);
        }

        return Promise.race(promises)
    };

    const play = async () => {
        const htmlCells = htmlRenderer.getEmptyHtmlCells(board.getCells());

        await waitForClick(htmlCells, "click");

        board.markCell(cellIdx, cellSymbol);
        return cellIdx;
    };


    return Object.assign({}, thisPlayer, { play });
}

function getComputerPlayer(board, cellSymbol, difficulty) {
    let thisPlayer = player(cellSymbol);

    let difficultyScore;
    switch (difficulty) {
        case "easy":
            difficultyScore = 20;
            break;
        case "medium":
            difficultyScore = 50;
            break;
        case "hard":
            difficultyScore = 80;
            break;
        case "impossible":
            difficultyScore = 100;
            break;
        default:
            throw new Error("Invalid difficulty: ", difficulty);
    }

    const hasTwoInARow = (cellIdx, cellSymbol) => {
        board.markCell(cellIdx, cellSymbol);
        if (board.checkWinCondition(cellIdx, cellSymbol)) {
            board.unmarkCell(cellIdx);
            return cellIdx;
        }
        board.unmarkCell(cellIdx);
        return -1;
    };

    const findEmptyAndOwn = (cells, cellIdx, cellSymbol, targetEmpty, targetOwn) => {
        let log = "";

        // row
        let cellRow = Math.floor(cellIdx / 3);
        let cellColumn = cellIdx % 3;
        let countMatches = 0;
        let countEmpty = 0;
        let countOwn = 0;
        for (let c = 0; c < 3; c++) {
            if (cells[cellRow][c] == cellSymbol) {
                countOwn++;
            } else if (cells[cellRow][c] == " ") {
                countEmpty++;
            }
        }
        if (countEmpty == targetEmpty && countOwn == targetOwn) {
            log += "r ";
            countMatches++;
        }
        countOwn = 0;
        countEmpty = 0;

        // column
        for (let r = 0; r < 3; r++) {
            if (cells[r][cellColumn] == cellSymbol) {
                countOwn++;
            } else if (cells[r][cellColumn] == " ") {
                countEmpty++;
            }
        }
        if (countEmpty == targetEmpty && countOwn == targetOwn) {
            log += "c ";
            countMatches++;
        }
        countOwn = 0;
        countEmpty = 0;

        // diagonal left
        if (cellRow == cellColumn) {
            for (let r = 0, c = 0; r < 3, c < 3; r++, c++) { 
                if (cells[r][c] == cellSymbol) {
                    countOwn++;
                } else if (cells[r][c] == " ") {
                    countEmpty++;
                }
            }
            if (countEmpty == targetEmpty && countOwn == targetOwn) {
                log += "dl ";
                countMatches++;
            }
            countOwn = 0;
            countEmpty = 0;
        }

        // diagonal right
        if (Math.abs(cellRow - cellColumn) || cellRow == cellColumn) {
            for (let r = 0, c = 2; r < 3, c >= 0; r++, c--) { 
                if (cells[r][c] == cellSymbol) {
                    countOwn++;
                } else if (cells[r][c] == " ") {
                    countEmpty++;
                }
            }
            if (countEmpty == targetEmpty && countOwn == targetOwn) {
                log += "dr ";
                countMatches++;
            }
            countOwn = 0;
            countEmpty = 0;
        }

        return countMatches;
    };

    const findFork = (cells, cellIdx, cellSymbol) => {
        board.markCell(cellIdx, cellSymbol);
        
        let countMatches = findEmptyAndOwn(cells, cellIdx, cellSymbol, 1, 2);
        board.unmarkCell(cellIdx);
        return countMatches >= 2;
    };

    let opponentSymbol = null;
    const play = async () => {
        let cells = board.getCells();
        let emptyCellIndexes = board.getEmptyCellIndexes();

        // can be null when the computer plays in the first round
        if (opponentSymbol === null) {
            opponentSymbol = board.getOpponentSymbol(cellSymbol);          
        }

        const determinedCellIndex = await (async () => {
            // take time to think
            await sleepAsync(2000);

            // difficulty check
            let randomValue = Math.floor(Math.random() * 100);
            if (randomValue >= difficultyScore) {
                return emptyCellIndexes[Math.floor(Math.random() * emptyCellIndexes.length)];
            }

            // 1. Win: If the player has two in a row, they can place a third to get three in a row.
            for (let cellIdx of emptyCellIndexes) {
                let index = hasTwoInARow(cellIdx, cellSymbol);
                if (index != -1) {
                    return index;
                }
            }

            // 2. Block: If the opponent has two in a row, the player must play the third themselves to block the opponent.
            if (opponentSymbol !== null) {
                for (let cellIdx of emptyCellIndexes) {
                    let index = hasTwoInARow(cellIdx, opponentSymbol);
                    if (index != -1) {
                        return index;
                    }
                }
            }

            // 3. Fork: Cause a scenario where the player has two ways to win (two non-blocked lines of 2).
            let forkableCellIndexes = [];
            for (let cellIdx of emptyCellIndexes) {
                if (findFork(cells, cellIdx, cellSymbol)) {
                    forkableCellIndexes.push(cellIdx);
                };
            }
            if (forkableCellIndexes.length > 0) {
                return forkableCellIndexes[Math.floor(Math.random() * forkableCellIndexes.length)];
            }

            // 4. Reacting to opponent's potential fork
            if (opponentSymbol !== null) {
                // 4.1. Blocking an opponent's fork: If there is only one possible fork for the opponent, the player should
                // block it. 
                let enemyForkIndexes = [];
                for (let cellIdx of emptyCellIndexes) {
                    if (findFork(cells, cellIdx, opponentSymbol)) {
                        enemyForkIndexes.push(cellIdx);
                    };
                }
                if (enemyForkIndexes.length == 1) {
                    return enemyForkIndexes[0];
                }

                // 4.2. Otherwise, the player should block all forks in any way that simultaneously allows them to make 
                // two in a row. 
                if (enemyForkIndexes.length > 1) {
                    let blockIndexes = [];
                    for (let cellIdx of enemyForkIndexes) {
                        let countMatches = findEmptyAndOwn(cells, cellIdx, cellSymbol, 2, 1);
                        if (countMatches > 0) {
                            blockIndexes.push(cellIdx);
                        }
                    }
                    if (blockIndexes.length > 0) {
                        return blockIndexes[Math.floor(Math.random() * blockIndexes.length)];
                    }
                }

                // 4.3. Otherwise, the player should make a two in a row to force the opponent into defending, as long as 
                // it does not result in them producing a fork.
                if (enemyForkIndexes.length > 1) {
                    let emptyNonForkIndexes = [];
                    for (let cellIdx of emptyCellIndexes) {
                        if (enemyForkIndexes.includes(cellIdx)) {
                            continue;
                        }
    
                        let countMatches = findEmptyAndOwn(cells, cellIdx, cellSymbol, 2, 1);
                        if (countMatches > 0) {
                            emptyNonForkIndexes.push(cellIdx);
                        }
                    }
                    if (emptyNonForkIndexes.length > 0) {
                        return emptyNonForkIndexes[Math.floor(Math.random() * emptyNonForkIndexes.length)];
                    }
                }
            }

            // 5. Center: A player marks the center.
            if (cells[1][1] == " ") {
                return 4;
            }

            // 6. Opposite corner: If the opponent is in the corner, the player plays the opposite corner.
            let oppositeCornerIndexes = [];
            if (cells[0][0] == opponentSymbol && cells[2][2] == " ") {
                oppositeCornerIndexes.push(8);
            } 
            if (cells[0][2] == opponentSymbol && cells[2][0] == " ") {
                oppositeCornerIndexes.push(6);
            } 
            if (cells[2][0] == opponentSymbol && cells[0][2] == " ") {
                oppositeCornerIndexes.push(2);
            } 
            if (cells[2][2] == opponentSymbol && cells[0][0] == " ") {
                oppositeCornerIndexes.push(0);
            }
            if (oppositeCornerIndexes.length > 0) {
                return oppositeCornerIndexes[Math.floor(Math.random() * oppositeCornerIndexes.length)];
            }

            // 7. Empty corner: The player plays in a corner square.
            let emptyCornerIndexes = [];
            if (cells[0][0] == " ") {
                emptyCornerIndexes.push(0);
            }
            if (cells[0][2] == " ") {
                emptyCornerIndexes.push(2);
            } 
            if (cells[2][0] == " ") {
                emptyCornerIndexes.push(6);
            } 
            if (cells[2][2] == " ") {
                emptyCornerIndexes.push(8);
            } 
            if (emptyCornerIndexes.length > 0) {
                return emptyCornerIndexes[Math.floor(Math.random() * emptyCornerIndexes.length)];
            }

            // 8. Empty side: The player plays in a middle square on any of the four sides.
            let emptySideIndexes = [];
            if (cells[0][1] == " ") {
                emptySideIndexes.push(1);
            }
            if (cells[1][0] == " ") {
                emptySideIndexes.push(3);
            } 
            if (cells[1][2] == " ") {
                emptySideIndexes.push(5);
            } 
            if (cells[2][1] == " ") {
                emptySideIndexes.push(7);
            } 
            if (emptySideIndexes.length > 0) {
                return emptySideIndexes[Math.floor(Math.random() * emptySideIndexes.length)];
            }

            throw new Error("You've reached the Unreachable Error - congrats!");
        })();
        
        board.markCell(determinedCellIndex, cellSymbol);
        // console.log(`The computer marked the cell with index ${determinedCellIndex}`);
        return determinedCellIndex;
    };


    return Object.assign({}, thisPlayer, { play });
}

function getPlayer(playerType, playerDifficulty, board, htmlRenderer, cellSymbol) {
    let player;
    switch (playerType) {
        case "human":
            player = getHumanPlayer(board, htmlRenderer, cellSymbol);
            break;
        case "computer":
            player = getComputerPlayer(board, cellSymbol, playerDifficulty);
            break;
        default:
            throw new Error("Invalid player type: ", playerType);
    }
    return player;
}

let gameSettingsForm = document.querySelector(".game-settings");
gameSettingsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    let settingsData = new FormData(gameSettingsForm);
    game.startGame(settingsData);
});

function sleepSync(ms) {
    let date = new Date();
    let currDate = null;
    do { currDate = new Date(); }
    while (currDate-date < ms);
}

async function sleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}