const {
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
} = require("./ai");

const width = 9;
const height = 9;

let input = `011111111
101000000
100100010
100000100
100100001
100011000
101001000
100010001
110100010`;
board = praseBoardString(input);

[r, c] = [0, 0];

// board[r * width + c] = true;

let [score, path] = aiMoveWithLastMove(board, getScorableCellSet(board), 0, [], 0);
newBoard = executePath(board, path);
scoreableCell = getScorableCellSet(newBoard);
printBoard(board, scoreableCell, encodeCoArray(path))
console.log(score, path);