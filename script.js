"use strict";

const consoleBoard = (function() {
    const cells = [" ", " ", " ", " ", " ", " ", " ", " ", " "];

    const canMarkCell = (cellIdx) => {
        return cellIdx >= 0 && cellIdx <= 8 && cells[cellIdx] == " ";
    }

    const markCell = (cellIdx, cellSymbol) => {
        cells[cellIdx] = cellSymbol;
    };

    const getCells = () => cells;

    const areAllCellsMarked = () => {
        let availableCellsExist = false;
        for (let i = 0; i < 9; i++) {
            availableCellsExist = availableCellsExist || (cells[i] == " ");
        }
        return availableCellsExist;
    }

    const checkWinCondition = (cellIdx, cellSymbol) => {
        let r = Math.floor(cellIdx / 3);
        let c = cellIdx % 3;
        let didWin = false;

        let horizontal = true;
        for (let i = r * 3; i < (r + 1) * 3; i++) {
            horizontal = horizontal && (cells[i] == cellSymbol);
        }
        didWin = didWin || horizontal;

        let vertical = true;
        for (let i = c; i < 9 + c; i += 3) {
            vertical = vertical && (cells[i] == cellSymbol);
        }
        didWin = didWin || vertical;

        if (c == r || c == 1 && r == 1) {
            didWin = didWin || (cells[0] == cellSymbol) && (cells[4] == cellSymbol) && (cells[8] == cellSymbol);
        }
        if (c == r - 2 || c - 2 == r || c == 1 && r == 1) {
            didWin = didWin || (cells[2] == cellSymbol) && (cells[4] == cellSymbol) && (cells[6] == cellSymbol);
        }

        return didWin;
    };

    return {
        markCell,
        canMarkCell,
        getCells,
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
                let symbol = cells[r * 3 + c];
                resultingString = resultingString.concat(symbol, " | ");
            }
            resultingString = resultingString.concat("\n");
        }
        resultingString = resultingString.concat("-------------");

        console.log({resultingString});
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
        console.log(board.areAllCellsMarked());
        while (board.areAllCellsMarked()) {
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
