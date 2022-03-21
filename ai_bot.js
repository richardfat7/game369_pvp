const { init, path } = require("express/lib/application");
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


const { io } = require("socket.io-client");
const socket = io("http://localhost:5010/");

const {
    setBoard,
    getBoard,
    aiMove,
    getScorableCellSet,
    convertBoardFromGame2AI,
    aiMoveRandom,
    printBoard,
    aiMoveWithLastMove
} = require("./ai");

let playerID = null;
let botBoard = null;
let roomID = null;
let width = 9;
let height = 9;


const initBoard = (width, height) => {
    b = new Array(width * height);
    b.fill(" ");
    // printBoard(board, height, width);
    return {
        board: b,
        height: height,
        width: width,
    }
}



socket.connect();

socket.on("disconnect", (reason) => {

});
socket.on("start", (aplayerID) => {
    botBoard = initBoard(9, 9);
    playerID = aplayerID;
    console.log("PlayerID: ", playerID);
    if (playerID == 0) {
        // you first
        console.log("My turn - Start");
        setBoard(convertBoardFromGame2AI(botBoard.board));
        let [score, path] = aiMoveWithLastMove(getBoard(), getScorableCellSet(getBoard()), 0, [], 0);
        // console.log(score, path);
        for (let i = 0; i < path.length; i++) {
            console.log("Move " + path[i][0], path[i][1]);
            setTimeout(() => {socket.emit("move", roomID, path[i][0], path[i][1], (result, err) => {console.log(err)})}, 500 * i + 500);
        }

    } else {
    }
});
socket.on("turn", (aplayerID) => {
    if (aplayerID == playerID) {
        // your turn
        console.log(" ######### My turn ######## ");
        setBoard(convertBoardFromGame2AI(botBoard.board));
        printBoard(getBoard());
        let [score, path] = aiMoveWithLastMove(getBoard(), getScorableCellSet(getBoard()), 0, [], 0);
        // console.log(score, path);
        for (let i = 0; i < path.length; i++) {
            console.log("Move " + path[i][0], path[i][1]);
            setTimeout(() => {socket.emit("move", roomID, path[i][0], path[i][1], (result, err) => {if (err) console.log(err)})}, 500 * i + 500);
        }
    } else {
        // not your turn
        console.log(" ^^^^^^^^ Opp turn ^^^^^^^^ ");
        setBoard(convertBoardFromGame2AI(botBoard.board));
        printBoard(getBoard());
        let [score, path] = aiMoveWithLastMove(getBoard(), getScorableCellSet(getBoard()), 0, [], 0);
        // console.log(score, path);
        for (let i = 0; i < path.length; i++) {
            console.log("opp best move " + path[i][0], path[i][1]);
        }
    }
});
socket.on("reveal", (revealed, turnOver) => {
    for (let i = 0; i < revealed.length; i++) {
        let r = revealed[i][0],
            c = revealed[i][1],
            v = revealed[i][3];
        botBoard.board[r * width + c] = v;
    }
});
socket.on("score", (score) => {
    console.log("SCORE " + score);
    // $(".message2").html(`${score[0]} R | B ${score[1]}`);
});
socket.on("last_move", (lastMove) => {
    // this.board.setLastMove(lastMove);
});
socket.on("finish", (winner, revealed) => {
    console.log("FINISH WINNER " + winner);
    // if (winner == null) {
    //     $(".message1").html("Tie.");
    //     this.setMovable(false);
    // } else if (winner == this.playerID) {
    //     $(".message1").html("You win.");
    //     this.setMovable(false);
    // } else {
    //     $(".message1").html("You lose.");
    //     this.setMovable(false);
    // }
    // for (let i = 0; i < revealed.length; i++) {
    //     setTimeout(() => {
    //         this.board.reveal.bind(this.board)(revealed[i][0], revealed[i][1], revealed[i][3]);
    //     }, revealed[i][2] * 50);
    // }
});
socket.on("leave", (revealed) => {
    console.log("Opponenet left");
    // $(".message1").html("Opponenet left.");
    // this.setMovable(false);
    // for (let i = 0; i < revealed.length; i++) {
    //     setTimeout(() => {
    //         this.board.reveal.bind(this.board)(revealed[i][0], revealed[i][1], revealed[i][3]);
    //     }, revealed[i][2] * 50);
    // }
});

rl.question("Room ID? ", function (aRoomID) {
    socket.emit("join", aRoomID, (retRoomID) => { });
    roomID = aRoomID
    rl.close();
});