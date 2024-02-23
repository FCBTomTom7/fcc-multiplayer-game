const windowWidth = 640;
const windowHeight = 480;
class Player {
  constructor({x, y, score, id}, color='beige') {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
    // both player and collectible are going to be circles
    this.radius = 20;
    this.color = color;
  }

  movePlayer(dir, speed) {
   switch(dir) {
    case 'left':
      if(this.x - this.radius < speed) {
        this.x = this.radius;
      } else {
        this.x -= speed;
      }
      
      break;
    case 'up':
      if(this.y - this.radius < speed) {
        this.y = this.radius;
      } else {
        this.y -= speed;
      }
      break;
    case 'right':
      if(this.x + this.radius > windowWidth - speed) {
        this.x = windowWidth - this.radius;
      } else {
        this.x += speed;
      }
      break;
    case 'down':
      if(this.y + this.radius > windowHeight - speed) {
        this.y = windowHeight - this.radius;
      } else {
        this.y += speed;
      }
      break;
   }
  }

  collision(item) {
    /*
    detects when player colides w another mf? 
    */
   return this.distanceFrom(item) < this.radius + item.radius;

  }

  distanceFrom(item) {
    return Math.sqrt(Math.pow(item.x - this.x, 2) + Math.pow(item.y - this.y, 2));
  }

  calculateRank(arr) {
    let position = arr.slice().sort((a, b) => a.score - b.score).reverse().map(player => player.id).indexOf(this.id) + 1;
    if(position > 0) {
      return "Rank: " + position + " / " + arr.length;
    } else {
      return "Player not in array?????";
    }
  }
}



export default Player;
