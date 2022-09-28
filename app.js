const express = require("express");
const nunjucks = require("nunjucks");
const app = express();
const port = 5010;
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { customAlphabet } = require("nanoid");
const { count } = require("console");
const nanoid = customAlphabet("0123456789", 5);

let games = {};

const gameConfig = {
  width: 9,
  height: 9,
}


nunjucks.configure("views", {
  autoescape: true,
  express: app
});

app.use(express.static("public"));


app.get("/", (req, res) => {
  res.render("game369.html")
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  socket.on("new", (cb) => {
    console.log("New game");
    roomID = nanoid();
    socket.join(roomID);
    cb(roomID);
  });

  socket.on("join", (roomID, cb) => {
    console.log("Join game", roomID);
    const playerList = io.of("/").adapter.rooms.get(roomID);
    if (playerList && playerList.size == 1) {
      socket.join(roomID);
      cb(roomID);
      startGame(roomID);
    } else {
      cb(-1);
    }
  });

  socket.on("move", (roomID, r, c, cb) => {
    // if (socket.rooms.has(roomID)) {
    //   // Do something if socket is in room 'abc'
    // } else {
    //   // Do something if socket is NOT in room 'abc'
    // }
    playerID = games[roomID].player.indexOf(socket.id);
    if (games[roomID].whoToMove == playerID) {
      if (games[roomID].board[r * games[roomID].width + c] === "X") {
        cb(null, "Already occupied.");
        return;
      }

      games[roomID].lastMove[playerID] = [r, c];
      console.log("MOVE", roomID, playerID, r, c);

      const [revealed, turnOver] = clickedCell(games[roomID], r, c, playerID);


      cb(revealed, null);

      io.to(roomID).emit("reveal", revealed, turnOver);
      io.to(roomID).emit("last_move", games[roomID].lastMove);
      io.to(roomID).emit("score", games[roomID].score);
      
      if (turnOver) {
        games[roomID].whoToMove = 1 - games[roomID].whoToMove;
        io.to(roomID).emit("turn", games[roomID].whoToMove);
      }

      if (games[roomID].occupied == games[roomID].width * games[roomID].height) {
        // Game end calculate who win
        if (games[roomID].score[0] > games[roomID].score[1]) {
          io.to(roomID).emit("finish", 0, null);
        } else if (games[roomID].score[0] < games[roomID].score[1]) {
          io.to(roomID).emit("finish", 1, null);
        } else {
          io.to(roomID).emit("finish", null, null);
        }
      }
    } else {
      cb(null, "Not your turn yet.");
    }
  })
});

io.of("/").adapter.on("leave-room", (roomID, id) => {
  console.log(`socket ${id} has left room ${roomID}`);
  if (roomID in games) {
    io.to(roomID).emit("leave", null);
  }
});

io.of("/").adapter.on("delete-room", (roomID) => {
  console.log(`room ${roomID} deleted`);
  if (roomID in games) {
    delete games[roomID];
  }
});

function* whoToStart() {
  const first = Math.random() < 0.5;
  yield first;
  return !first;
}

const startGame = (roomID) => {
  const s = whoToStart();
  const player = new Array(2);
  for (const sid of io.of("/").adapter.rooms.get(roomID)) {
    const turn = s.next().value;
    if (turn) {
      player[0] = sid;
      io.to(sid).emit("start", 0);
    } else {
      player[1] = sid;
      io.to(sid).emit("start", 1);
    }
  }
  games[roomID] = initBoard(9, 9);
  games[roomID].player = player;
  games[roomID].whoToMove = 0;
  games[roomID].score = [0, 0];
  games[roomID].lastMove = [null, null];
  games[roomID].gameConfig = gameConfig;
  games[roomID].occupied = 0;
}

const initBoard = (width, height) => {
  board = new Array(width * height);
  board.fill(" ");
  printBoard(board, height, width);
  return {
    board: board,
    height: height,
    width: width,
  }
}

const clickedCell = (game, r, c, playerID) => {
  const board = game.board;
  const width = game.width;
  const height = game.height;
  const score = game.score;
  board[r * width + c] = "X";
  game.occupied += 1;
  let moveScore = 0;
  // Vertical
  moveScore += countCell(board, r, c, width, height, 1, 0);
  // Horizontal
  moveScore += countCell(board, r, c, width, height, 0, 1);
  // // Diagonal
  // moveScore += countCell(board, r, c, width, height, 1, 1);
  // // Diagonal2
  // moveScore += countCell(board, r, c, width, height, -1, 1);
  score[playerID] += moveScore;
  const turnOver = moveScore == 0;
  return [[[r, c, 0, "X"]], turnOver];
}

const countCell = (board, r, c, width, height, dr, dc) => {
  let count = 0;
  let i = r;
  let j = c;
  while (board[i * width + j] == "X" && i >= 0 && i < height && j >= 0 && j < width) {
    count++;
    i += dr;
    j += dc;
  }
  i = r;
  j = c;
  while (board[i * width + j] == "X" && i >= 0 && i < height && j >= 0 && j < width) {
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

const printBoard = (board, height, width) => {
  for (let i = 0; i < height; i++) {
    let s = "";
    for (let j = 0; j < width; j++) {
      s += board[i * width + j];
    }
    console.log(s);
  }
}

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});