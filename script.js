"use strict";

const consoleBoard = (function() {
    const cells = [[" ", " ", " "], [" ", " ", " "], [" ", " ", " "]];

    const canMarkCell = (cellIdx) => {
        return cellIdx >= 0 && cellIdx <= 8 && cells[Math.floor(cellIdx / 3)][cellIdx % 3] == " ";
    }

    const markCell = (cellIdx, cellSymbol) => {
        cells[Math.floor(cellIdx / 3)][cellIdx % 3] = cellSymbol;
    };

    const getCells = () => cells;

    const getEmptyCells = () => {
        let emptyCells = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (cells[r][c] == " ") {
                    emptyCells.push(cells[r][c]);
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
        canMarkCell,
        getCells,
        getEmptyCells,
        checkWinCondition,
        areAllCellsMarked,
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
        console.log(!board.areAllCellsMarked());
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

    const computerPlay = () => {
        // idk yet
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
let p2 = consolePlayer(playerType.HUMAN, consoleBoard, "o");
game.playGame(p1, p2);
