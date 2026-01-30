"use strict";

const consoleBoard = (function() {
    const cells = [[" ", " ", " "], [" ", " ", " "], [" ", " ", " "]];

    const canMarkCell = (cellIdx) => {
        return cellIdx >= 0 && cellIdx <= 8 && cells[Math.floor(cellIdx / 3)][cellIdx % 3] == " ";
    }

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
    }

    const getOpponentSymbol = (ownSymbol) => {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (cells[r][c] != " " && cells[r][c] != ownSymbol) {
                    return cells[r][c];
                }
            }
        }
        return null;
    }

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
    }
})();

const consoleRenderer = (function() {
    const render = (cells, roundNum, playerNum) => {
        let resultingString = `Round ${roundNum}`;
        resultingString = resultingString.concat(playerNum != -1 ? `, player's #${playerNum} turn` : "");
        resultingString = resultingString.concat("\n-------------\n");
        for (let r = 0; r < 3; r++) {
            resultingString = resultingString.concat("| ")
            for (let c = 0; c < 3; c++) {
                resultingString = resultingString.concat(cells[r][c], " | ");
            }
            resultingString = resultingString.concat("\n");
        }
        resultingString = resultingString.concat("-------------");

        console.log(resultingString);
    }

    return {
        render,
    }
})();

const game = (function(renderer, board) {
    let roundNum = 1;
    let turn = Math.floor(Math.random() * 2);  // 0 - p1, 1 - p2; first turn - random
    
    const playGame = (player1, player2) => {
        let didWin;
        while (!board.areAllCellsMarked()) {
            let currentPlayer = turn == 0 ? player1 : player2;
            didWin = playRound(currentPlayer);

            if (didWin) {
                break;
            }

            turn = (turn + 1) % 2;
            roundNum++;
        }

        renderer.render(board.getCells(), String(roundNum).concat(" - END"), -1);

        if (didWin) {
            console.log(`Player #${turn} wins!`);
        } else {
            console.log("It's a tie!");
        }
    }
    
    const playRound = (player) => {
        renderer.render(board.getCells(), roundNum, turn);
        let cellIdx = player.play();

        let didWin = board.checkWinCondition(cellIdx, player.getSymbol());
        return didWin;
    };

    return {
        playGame,
    }
})(consoleRenderer, consoleBoard);

function consolePlayer(pType, board, cellSymbol) {
    const getSymbol = () => cellSymbol;

    const humanPlay = () => {
        let cellIdx;
        while (true) {
            cellIdx = prompt("What cell to mark? Type in index, from 0 to 8.");
            if (cellIdx === null) {
                throw new Error("You've quit the game. Reload page to restart.");
            }

            cellIdx = +cellIdx;

            let canMarkCell = board.canMarkCell(cellIdx);
            if (canMarkCell) {
                break;
            }

            console.log(`Can't mark the cell with index ${cellIdx}, try again.`);
        }

        board.markCell(cellIdx, cellSymbol);
        return cellIdx;
    }

    let opponentSymbol = null;

    const computerPlay = () => {
        const determinedCellIndex = (() => {

            let cells = board.getCells();
            let emptyCellIndexes = board.getEmptyCellIndexes();
            // console.log(emptyCellIndexes);
            
            // 1. Win: If the player has two in a row, they can place a third to get three in a row.
            for (let cellIdx of emptyCellIndexes) {
                board.markCell(cellIdx, cellSymbol);
                if (board.checkWinCondition(cellIdx, cellSymbol)) {
                    console.log("1");
                    board.unmarkCell(cellIdx);
                    return cellIdx;
                }
                board.unmarkCell(cellIdx);
            }

            // can be null when the computer plays in the first round
            if (opponentSymbol === null) {
                opponentSymbol = board.getOpponentSymbol(cellSymbol);          
            }

            if (opponentSymbol !== null) {
                // 2. Block: If the opponent has two in a row, the player must play the third themselves to block the opponent.
                // row
                let count = 0;
                let lastEmptyIdx = -1;
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        if (cells[r][c] == opponentSymbol) {
                            count++;
                        } else if (cells[r][c] == " ") {
                            lastEmptyIdx = r*3 + c;
                        }
                    }
                    if (count == 2 && lastEmptyIdx != -1) {
                        console.log("2r");
                        return lastEmptyIdx;    
                    }
                    count = 0;
                    lastEmptyIdx = -1;
                }

                // column
                for (let c = 0; c < 3; c++) {
                    for (let r = 0; r < 3; r++) {
                        if (cells[r][c] == opponentSymbol) {
                            count++;
                        } else if (cells[r][c] == " ") {
                            lastEmptyIdx = r*3 + c;
                        }
                    }
                    if (count == 2 && lastEmptyIdx != -1) {
                        console.log("2c");
                        return lastEmptyIdx;    
                    }
                    count = 0;
                    lastEmptyIdx = -1;
                }

                // diagonal left
                for (let r = 0, c = 0; r < 3, c < 3; r++, c++) { 
                    if (cells[r][c] == opponentSymbol) {
                        count++;
                    } else if (cells[r][c] == " ") {
                        lastEmptyIdx = r*3 + c;
                    }
                }
                if (count == 2 && lastEmptyIdx != -1) {
                    console.log("2dl");
                    return lastEmptyIdx;    
                }
                count = 0;
                lastEmptyIdx = -1;

                // diagonal right
                for (let r = 0, c = 2; r < 3, c >= 0; r++, c--) { 
                    if (cells[r][c] == opponentSymbol) {
                        count++;
                    } else if (cells[r][c] == " ") {
                        lastEmptyIdx = r*3 + c;
                    }
                }
                if (count == 2 && lastEmptyIdx != -1) {
                    console.log("2dr");
                    return lastEmptyIdx;    
                }
                count = 0;
                lastEmptyIdx = -1;
            }

            // 3. Fork: Cause a scenario where the player has two ways to win (two non-blocked lines of 2).
            for (let cellIdx of emptyCellIndexes) {
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
                if (countEmpty == 2 && countOwn == 1) {
                    console.log("3r+", cellIdx);
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
                if (countEmpty == 2 && countOwn == 1) {
                    console.log("3c+", cellIdx);
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
                    if (countEmpty == 2 && countOwn == 1) {
                        console.log("3dl+", cellIdx);
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
                    if (countEmpty == 2 && countOwn == 1) {
                        console.log("3dr+", cellIdx);
                        countMatches++;
                    }
                    countOwn = 0;
                    countEmpty = 0;
                }
                
                if (countMatches >= 2) {
                    console.log("3 count", countMatches, cellIdx);
                    return cellIdx;
                }
            }

            // 4. Blocking an opponent's fork: If there is only one possible fork for the opponent, the player should block it. 
            // Otherwise, the player should block all forks in any way that simultaneously allows them to make two in a row. 
            // Otherwise, the player should make a two in a row to force the opponent into defending, as long as it does not result in them producing a fork.

            console.log("4");
            return emptyCellIndexes[0];

        })();
        
        board.markCell(determinedCellIndex, cellSymbol);
        console.log(`The computer marked the cell with index ${determinedCellIndex}`);
        return determinedCellIndex;
    }

    if (pType !== playerType.HUMAN && pType !== playerType.COMPUTER) {
        throw new Error(`Invalid player type ${pType}`);
    }

    const play = (pType === playerType.HUMAN) ? humanPlay : computerPlay;

    return {
        getSymbol,
        play,
    }
}

let playerType = Object.freeze({
    HUMAN: 0,
    COMPUTER: 1, 
});

let p1 = consolePlayer(playerType.HUMAN, consoleBoard, "x");
let p2 = consolePlayer(playerType.COMPUTER, consoleBoard, "o");
game.playGame(p1, p2);