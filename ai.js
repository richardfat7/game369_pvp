colors = require("./colors");

let input = `111010001
010000100
010001010
100010010
001000100
000100111
010000111
001111111
100100001`;
let input1 = `000000000
000000000
000000000
000000000
000000000
000000000
000000000
000000000
000000000`;

let input_split = input.split("\n");

encodeCoArray = (aa) => {
    result = new Array();
    for (const [i, j] of aa) {
        result.push(encodeCo([i, j]));
    }
    return result;
}

encodeCo = (a) => {
    return a[0] + "_" + a[1];
};

decodeCoArray = (aa) => {
    result = new Array();
    for (const cell of aa) {
        result.push(decodeCo(cell));
    }
    return result;
}

decodeCo = (s) => {
    let i, j;
    [i, j] = s.split("_");
    return [parseInt(i), parseInt(j)];
}

const width = 9;
const height = 9;

let boardHash = {};

// let boardCount = 0;
let board = new Array(height * width);

const printBoard = (board, scorableCell, step) => {
    // Only support up to 36 steps
    console.log("  123456789");
    for (let i = 0; i < height; i++) {
        let s = String.fromCharCode(65 + i) + "|";
        for (let j = 0; j < width; j++) {
            if (board[i * width + j] === true) {
                s += "X";
            } else {
                let found = false;
                if (!found && step) {
                    for (const [index, cell] of step.entries()) {
                        [i2, j2] = decodeCo(cell);
                        if (i == i2 && j == j2) {
                            if (index >= 36) {
                                s += colors.FgRed + (index - 36).toString(36) + colors.Reset;
                            } else {
                                s += colors.FgCyan + index.toString(36) + colors.Reset;
                            }
                            found = true;
                            break;
                        }
                    }
                }
                if (!found && scorableCell) {
                    for (const cell of scorableCell) {
                        [i2, j2] = decodeCo(cell);
                        if (i == i2 && j == j2) {
                            s += colors.FgGreen + "$" + colors.Reset;
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    s += " ";
                }
            }
        }
        console.log(s);
    }
}

// Count number of continous cell along +-dr, +-dc from r, c (including r, c), return the value if it mod3 == 0
const countCell = (board, r, c, width, height, dr, dc) => {
    let count = 0;
    let i = r;
    let j = c;
    while (board[i * width + j] && i >= 0 && i < height && j >= 0 && j < width) {
        count++;
        i += dr;
        j += dc;
    }
    i = r;
    j = c;
    while (board[i * width + j] && i >= 0 && i < height && j >= 0 && j < width) {
        count++;
        i -= dr;
        j -= dc;
    }
    // double counted the center cell
    count -= 1;
    if (count % 3 === 0) {
        return count;
    }
    return 0;
}


const concatPath = (path) => {
    let s = "";
    for (let op of path) {
        let p;
        if (typeof op === "string") {
            p = decodeCo(op);
        } else {
            p = op
        }
        s += String.fromCharCode(65 + p[0]) + "" + (p[1] + 1) + ",";
    }
    return s;
}

const aiMove = (board, scorableCell, depth, path, score) => {
    let max = score;
    let maxMove = path;
    for (const cell of scorableCell) {
        [i, j] = decodeCo(cell);
        if (!board[i * width + j]) {
            const newBoard = Array.from(board);
            newBoard[i * width + j] = true;
            const boardString = convertBoardToString(newBoard);
            if (boardString in boardHash) {
                // expanded before
                continue;
                newScore = boardHash[boardString];
                if (newScore > max) {
                    max = newScore;
                    maxMove = path.concat([[i, j]]);
                }
            }

            let relatedCell = new Set(scorableCell);
            // remove current cell
            relatedCell.delete(cell);
            for (let c = 0; c < height; c++) {
                relatedCell.add(encodeCo([c, j]));
            }
            for (let c = 0; c < width; c++) {
                relatedCell.add(encodeCo([i, c]));
            }
            relatedCell = filterScorable(newBoard, relatedCell);

            let moveScore = 0;
            moveScore += countCell(newBoard, i, j, width, height, 1, 0);
            moveScore += countCell(newBoard, i, j, width, height, 0, 1);
            // console.log(depth + 1, concatPath([[i,j]]), i, j, score + moveScore, concatPath(path.concat([[i, j]])))
            if (moveScore > 0) {
                const [newScore, bestMove] = aiMove(newBoard, relatedCell, depth + 1, path.concat([[i, j]]), score + moveScore);
                if (newScore > max) {
                    max = newScore;
                    maxMove = bestMove;
                }
            } else {
                continue;
            }
        }
    }
    const boardString = convertBoardToString(board);
    boardHash[boardString] = max;
    return [max, maxMove];
}

const aiMoveRandom = (board, scorableCell, depth, path, score) => {
    const list = new Array();
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (!board[i * width + j]) {
                list.push([i, j]);
            }
        }
    }
    if (list.length > 0) {
        return [-1, [list[Math.floor(Math.random() * list.length)]]];
    } else {
        return [-1, []];
    }
}

const convertBoardToString = (board) => {
    let s = "";
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            s += board[i * width + j] ? "1" : " ";
        }
    }
    return s;
}

const isScorable = (board, r, c) => {
    if (board[r * width + c]) {
        return false;
    }
    board[r * width + c] = true;
    let moveScore = 0;
    moveScore = countCell(board, r, c, width, height, 1, 0);
    if (moveScore > 0) {
        board[r * width + c] = false;
        return true;
    }
    moveScore = countCell(board, r, c, width, height, 0, 1);
    if (moveScore > 0) {
        board[r * width + c] = false;
        return true;
    }
    board[r * width + c] = false;
    return false;
}

const filterScorable = (board, list) => {
    return new Set([...list].filter((co) => {
        const [i, j] = decodeCo(co);
        return isScorable(board, i, j);
    }));
}

const getScorableCellSet = (board) => {
    scorableCell = new Set();
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            scorableCell.add(encodeCo([i, j]));
        }
    }
    scorableCell = filterScorable(board, scorableCell);
    return scorableCell;
}

const convertBoardFromGame2AI = (board) => {
    const newBoard = Array.from(board);
    return newBoard.map(v => v === "X");
}

const setBoard = (aBoard) => {
    board = aBoard;
}

const getBoard = () => {
    return board;
}

const aiMoveMinOpp = (board, scorableCell, depth, path, score) => {
    // all possible move
    let minScore = 99999999;
    let minMove = [];
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (!board[i * width + j]) {
                // possibleMove.push([i, j]);
                const newBoard = Array.from(board);
                newBoard[i * width + j] = true;
                boardHash = {};
                const [bestScore, bestMoves] = aiMove(newBoard, getScorableCellSet(newBoard), 0, [], 0);
                if (bestScore < minScore) {
                    minScore = bestScore;
                    minMove = [[i, j]];
                } else if (bestScore == minScore) {
                    minMove.push([i, j]);
                }
            }
        }
    }
    if (minMove.length == 0) {
        return [0, []];
    }
    const minMoveChosen = minMove[Math.floor(Math.random() * minMove.length)];
    return [minScore, [minMoveChosen]];
}

const aiMoveWithLastMove = (board, scorableCell, depth, path, score) => {
    const newBoard = Array.from(board);
    let [maxScore, maxPath] = aiMove(newBoard, scorableCell, depth, path, score);
    console.log("MY_MAX", maxScore, maxPath);
    for (let i = 0; i < maxPath.length; i++) {
        let [r, c] = maxPath[i];
        newBoard[r * width + c] = true;
    }
    let [minScore, minPath] = aiMoveMinOpp(newBoard, scorableCell, depth, path, score);
    console.log("OPP_MIN", minScore, minPath);
    if (minPath.length > 0) {
        return [maxScore - minScore, maxPath.concat(minPath)];
    } else {
        return [maxScore, maxPath];
    }
}

const praseBoardString = (input) => {
    // Example input
    //`111010001
    // 010000100
    // 010001010
    // 100010010
    // 001000100
    // 000100111
    // 010000111
    // 001111111
    // 100100001`;
    let input_split = input.split("\n");
    let board = new Array(height * width);

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const value = input_split[i][j];
            if (value === "1") {
                board[i * width + j] = true;
                // boardCount++;
            } else {
                board[i * width + j] = false;
            }
        }
    }
    return board;
}

const executePath = (board, path) => {
    const newBoard = Array.from(board);
    for (let i = 0; i < path.length; i++) {
        let [r, c] = path[i];
        newBoard[r * width + c] = true;
    }
    return newBoard;
}

// for (let i = 0; i < height; i++) {
//     for (let j = 0; j < width; j++) {
//         const value = input_split[i][j];
//         if (value === "1") {
//             board[i * width + j] = true;
//             // boardCount++;
//         } else {
//             board[i * width + j] = false;
//         }
//     }
// }

// printBoard(board);
// let [bestScore, bestMove] = aiMove(board, getScorableCellSet(board), 0, [], 0);
// console.log(bestScore, bestMove);
// for (let i = 0; i < bestMove.length; i++) {
//     let [r, c] = bestMove[i];
//     board[r*width+c] = true;
// }
// let [bestScore2, bestMove2] = aiMoveMinOpp(board, getScorableCellSet(board), 0, [], 0);
// console.log(bestScore2, bestMove2);

module.exports = {
    setBoard,
    getBoard,
    aiMove,
    getScorableCellSet,
    convertBoardFromGame2AI,
    aiMoveRandom,
    printBoard,
    aiMoveWithLastMove,
    praseBoardString,
    countCell,
    executePath,
};