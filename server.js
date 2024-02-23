require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');

const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
app.use(helmet());
  // contentSecurityPolicy: false, 
  // xXssProtection: false
  // contentSecurityPolicy: {
  //   useDefaults: false,
  //   directives: {
  //     defaultSrc: ["'self'"],
  //     styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com/css?family=Press+Start+2P&display=swap", "https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nYivN04w.woff2"],
  //     scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.4/socket.io.min.js"]
  //   }
  // }

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});


const portNum = process.env.PORT || 3000;


// socket / game logic


let playerArr = [];
let width = 640;
let height = 480;
let playerRadius = 20;
let collectible = {
  x: Math.random() * (width - 2 * playerRadius) + playerRadius, 
  y: Math.random() * (height - 2 * playerRadius) + playerRadius,
  value: Math.floor(Math.random() * 5) + 1,
  id: Date.now(),
  color: "rgb(" + Math.floor(Math.random() * 256) + ", " + Math.floor(Math.random() * 256) + ", " + Math.floor(Math.random() * 256) + ")"
}

io.on('connection', socket => {
   console.log('connection: ' + socket.id);
  //  console.log(io.clients());


  socket.on('new player', player => {
    socket.index = playerArr.length;
    playerArr.push(player);
    // socket.playerId = player.id;
    
    io.emit('update playerArr', playerArr);
  })

  socket.on('requesting collectible data', () => {
    // well do socket emit bc only one socket is requesting it in this instance
    socket.emit('collectible data', collectible)
  })

  socket.on('new collectible', () => {
    collectible = {
      x: Math.random() * (width - 2 * playerRadius) + playerRadius, 
      y: Math.random() * (height - 2 * playerRadius) + playerRadius,
      value: Math.floor(Math.random() * 5) + 1,
      id: Date.now(),
      color: "rgb(" + Math.floor(Math.random() * 256) + ", " + Math.floor(Math.random() * 256) + ", " + Math.floor(Math.random() * 256) + ")"
    }
    io.emit('collectible data', collectible);
  })

  socket.on('player moved', ({x, y, index}) => {
    // console.log(playerArr) 
    if(playerArr.length > 0) {
      // console.log(index);
      playerArr[index].x = x;
      playerArr[index].y = y;
    }
    
    io.emit('player moved', {x, y, index});
  })
  
  socket.on('player scored', ({index, score}) => {
    playerArr[index].score = score;
    io.emit('update player score', {index, score});
  })

  socket.on('player won', ({index, id}) => {
    // implement htis man AJJHFKASJDFLKASDJFLK
    io.emit('update based on win', index);
    // for(let i = 0; i < playerArr.length; i++) {
    //   playerArr[i].score = 0;
    // }
  })

  socket.on('update server index', index => {
    socket.index = index;
    // console.log('new index for ' + socket.id + ': ' + socket.index);
  })

   socket.on('disconnect', () => {
    console.log('disconnect: ' + socket.id);
    // console.log('INDEX ' + socket.index + ' DISCONNECTED');
    // console.log('before');
    // console.log(playerArr);
    // console.log(socket.index);
    playerArr.splice(socket.index, 1);
    io.emit('player disconnected', {
      arr: playerArr,
      i: socket.index
    });
    // console.log('after');
    // console.log(playerArr);
    
   })
})
// Set up server and tests
http.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing
