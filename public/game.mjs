import Player from './Player.mjs';
import Collectible from './Collectible.mjs';


let socket = io("http://localhost:3000");
const canvas = document.getElementById('game-window');
let rankText = document.getElementById('rank');
let restartText = document.getElementById('restart-message');
let width = Number(canvas.width);
let height = Number(canvas.height);
const context = canvas.getContext('2d');
let scoreTarget = 77;
let playerRadius = 20;
let index = -1;
let r = Math.floor(Math.random() * 256);
let g = Math.floor(Math.random() * 256);
let b = Math.floor(Math.random() * 256);
let player = new Player({
    x: Math.random() * (width - 2 * playerRadius) + playerRadius, 
    y: Math.random() * (height - 2 * playerRadius) + playerRadius,
    score: 0,
    id: Date.now()
},
"rgb(" + r + ", " + g + ", " + b + ")");
let collectible = new Collectible(0, 0, 0, 0);
// console.log(player);

let playerArray = [];



// key event listeners
let canMove = true;
let down = false;
let directions = []

window.addEventListener('keydown', e => {
    let key = e.key;
    if(e.key == 'w') {
        key = 'ArrowUp';
    } else if (e.key == 'a') {
        key = 'ArrowLeft';
    } else if (e.key == 's') {
        key = 'ArrowDown';
    } else if (e.key == 'd') {
        key = 'ArrowRight';
    }
    if(directions.indexOf(key) == -1) {
        directions.push(key);
    }
    if(down === false) {
        down = true;
        if(canMove)  requestAnimationFrame(draw);
    }
    
})

window.addEventListener('keyup', e => {
    let key = e.key;
    if(e.key == 'w') {
        key = 'ArrowUp';
    } else if (e.key == 'a') {
        key = 'ArrowLeft';
    } else if (e.key == 's') {
        key = 'ArrowDown';
    } else if (e.key == 'd') {
        key = 'ArrowRight';
    }
    directions.splice(directions.indexOf(key), 1);
    
    if(directions.length == 0) {
        down = false;
    }
})

///////////////////////////////





function draw() {
    context.clearRect(0, 0, width, height);
    // console.log('cuh');
    drawPlayers();
    drawCollectible();
    // checkCollision();
    drawUI();
    // requestAnimationFrame(draw);
    if(down) {
        for(let i = 0; i < directions.length; i++) {
            let d = directions[i].slice(5).toLowerCase();
            playerArray[index].movePlayer(d, 1);
        }
        checkCollision();
        checkWin();
        socket.emit('player moved', {
            x: playerArray[index].x,
            y: playerArray[index].y,
            index
        });
        
        requestAnimationFrame(draw);
    }
    
}

function drawUI() {
     rankText.innerHTML = playerArray[index].calculateRank(playerArray);
}

function checkCollision() {
    if(playerArray[index].collision(collectible)) {
        // console.log(playerArray.slice().sort((a, b) => a.score - b.score));
        playerArray[index].score += collectible.value;
        socket.emit('player scored', {
            index,
            score: playerArray[index].score
        });
        socket.emit('new collectible');
        
    }
}

function checkWin() {
    if(playerArray[index].score >= scoreTarget) {
        restartText.innerHTML = 'You Win! Restart to Play Again!';
        restartText.style.visibility = 'visible';
        // win!!!
        socket.emit('player won', {
            index,
            id: playerArray[index].id // just to be safe
        })
    }
}

function drawPlayers() {
    for(let i = 0; i < playerArray.length; i++) {
        // console.log('wuh');
        context.beginPath();
        context.arc(playerArray[i].x, playerArray[i].y, playerArray[i].radius, 0, 2 * Math.PI);
        context.fillStyle = playerArray[i].color;
        context.fill();
    }
}

function drawCollectible() {
    context.beginPath();
    context.arc(collectible.x, collectible.y, collectible.radius, 0, 2 * Math.PI);
    context.fillStyle = collectible.color;
    context.fill();
}


// general socket shit

// right away we need to emit a message to give the server the data of the new player and add the player to the server array
socket.emit('new player', player);
socket.emit('requesting collectible data');
socket.on('update playerArr', arr => {
    playerArray = arr;
    for(let i = 0; i < playerArray.length; i++) {
        playerArray[i] = new Player({
            x: playerArray[i].x,
            y: playerArray[i].y,
            score: playerArray[i].score,
            id: playerArray[i].id
        }, playerArray[i].color)
    }
    
    // console.log(playerArray.slice(-1)[0]);
    if(playerArray.slice(-1)[0].id == player.id) {
        
        // player that was just added was us, set index to last index of array
        index = playerArray.length - 1;
        console.log('index ' + index);
    }
    if(!down) requestAnimationFrame(draw);
    
})
socket.on('collectible data', c => {
    collectible.x = c.x;
    collectible.y = c.y;
    collectible.value = c.value;
    collectible.id = c.id;
    collectible.color = c.color;
    if(!down) requestAnimationFrame(draw);
    
})
socket.on('player moved', (obj) => {
    if(index != obj.index) {
        playerArray[obj.index].x = obj.x;
        playerArray[obj.index].y = obj.y;
        if(!down) requestAnimationFrame(draw);
    }
    
    
    
})

socket.on('update player score', ({index, score}) => {
    playerArray[index].score = score;
})

socket.on('update based on win', i => {
    canMove = false;
    down = false;
    if(index != i) {
        // lost lul
        restartText.innerHTML = 'You Lose! Restart to Play Again!';
        restartText.style.visibility = 'visible';
    }
})

socket.on('player disconnected', ({arr, i}) => {
    // console.log(i);
    if(index > i) {
        index--;
        // console.log('index ' + index);
        socket.emit('update server index', index);
    }
    playerArray = arr;
    for(let i = 0; i < playerArray.length; i++) {
        playerArray[i] = new Player({
            x: playerArray[i].x,
            y: playerArray[i].y,
            score: playerArray[i].score,
            id: playerArray[i].id
        }, playerArray[i].color)
    }
    if(!down) requestAnimationFrame(draw);
})
