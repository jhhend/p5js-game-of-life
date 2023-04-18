
// Classes

class Grid {

  constructor(size) {
    this.size = size;
    this.grid = Array(size);
    for (let i = 0; i < size; i++) {
      this.grid[i] = Array(size).fill(false);
    }
  }

  at(x, y) {
    return this.grid[x][y];
  }

  advance() {
    let newGrid = new Grid(GRID_SIZE);

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        let count = this.neighborCount(row, col);
  
        if (grid.at(row, col)) {
          newGrid.set(row, col, count === 2 || count === 3)
        } else {
          newGrid.set(row, col, count === 3);
        }
      }
    }
  
    // Update the main grid
    this.mount(newGrid);
  }

  cellColor(x, y) {
    let cell = this.grid[x][y];
    let mode = colorModes[currentColorMode];

    // Don't bother with color calcluations if cell is dead
    if (!cell) {
      return color(0);
    }

    if (mode === 'normal') {
      return color(cell ? 255 : 0);
    } else if (mode === 'heatmap') {
      colorMode(HSB);
      let n = this.neighborCount(x, y);
      return color(255*((8 - n)/9), 100, 100);
    } else if (mode === 'survive') {
      colorMode(RGB);
      let n = this.neighborCount(x, y);
      if (n === 2 || n === 3) {
        return color(0, 255, 0);
      } else {
        return color(255);
      }
    }
  }

  density() {
    return this.grid.reduce((total, row) => {
      return total + row.reduce((rowTotal, cell) => {
        return rowTotal + (+cell);
      }, 0);
    }, 0) / (GRID_SIZE*GRID_SIZE);
  }

  draw() {
    noStroke();
    stroke(255);
    fill(0);
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        let cell = grid.at(row, col);

        fill(this.cellColor(row, col))

        /*
        if (cellColor === 'normal') {
          fill(cell ? 255 : 0);
        } else if (cellColor === 'heatmap') {
          // heatmap mode test
          if (!cell) {
            fill(0);
          } else {
            let n = grid.neighborCount(row, col);

            colorMode(HSB);
            fill(color(255*((8 - n)/8), 100, 100))

          }
        } else if (cellColor === 'survive') {
          // heatmap mode test
          if (!cell) {
            fill(0);
          } else {
            let n = grid.neighborCount(row, col);
            if (n === 2 || n === 3) {
              fill(color(0, 255, 0))
            } else {
              fill(255)
            }
          }        
        }
        */

        rect(row*CELL_SIZE, col*CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }    
  }

  stateCount(state) {
    return this.grid.reduce((total, row) => {
      return total + row.reduce((rowTotal, cell) => {
        return rowTotal + +(cell == state);
      }, 0);
    }, 0);    
  }

  mount(other) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        this.set(i, j, other.at(i, j));
      }
    }
  }

  neighborCount(x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let xx = x + i;
        let yy = y + j;
        if (xx < 0) {
          xx = GRID_SIZE - 1 
        } else if (xx >= GRID_SIZE) {
          xx = 0;
        }
  
        if (yy < 0) {
          yy = GRID_SIZE - 1;
        } else if (yy >= GRID_SIZE) {
          yy = 0;
        }
        count += this.grid[xx][yy];
      }
    }
    count -= this.grid[x][y];
    return count;
  }

  randomize() {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        this.set(i, j, !!Math.floor(random(0, 2)));
      }
    }
  }

  set(x, y, value) {
    this.grid[x][y] = value;
  }

  toggle(x, y) {
    this.set(x, y, !this.at(x, y));
  }

}

class Button {

  constructor(x, y, image, action, canClick, mouseOverText) {
    this.x = x;
    this.y = y;
    this.image = (typeof image !== 'function') ? () => image : image;
    this.action = action;
    this.canClick = (typeof canClick !== 'function') ? () => canClick : canClick;
    this.mouseOverText = (typeof mouseOverText !== 'function') ? () => mouseOverText : mouseOverText;
  }

  draw() {
    rect(this.x, this.y, BUTTON_SIZE, BUTTON_SIZE);
    image(images[this.image()], this.x, this.y);

    // Draw an x if the button is blocked from being clicked
    if (!this.canClick()) {
      image(images['x'], this.x, this.y);
    }

    // Mouse over text
    if (this.mouseIn()) {
      push();
      noStroke();
      textSize(24);
      textAlign(CENTER, CENTER);
      fill(255);
      text(this.mouseOverText(), width/2, this.y - 24);
      pop();
    }

  }

  mouseIn() {
    return mouseX > this.x && mouseX < this.x + BUTTON_SIZE && mouseY > this.y && mouseY < this.y + BUTTON_SIZE;
  }

}

// Globals

const WIDTH = 800;
const HEIGHT = WIDTH + 96;
const GRID_SIZE = 32;
const CELL_SIZE = WIDTH/GRID_SIZE;
const BUTTON_SIZE = 32;
const BUTTON_HEIGHT = HEIGHT - 48;

let iteration = 0;
let active = false;
let displayInfo = false;
let buttons = [ ];
let images = { }
const colorModes = [ 'normal', 'heatmap', 'survive' ];
let currentColorMode = 0;
let cellColorMode = 'heatmap';
let cellColor = 'heatmap';
let grid = new Grid(GRID_SIZE);

// p5.js Functions

function preload() {

  // Load in each of the required images
  let imageNames = [ 'advance', 'info', 'pause', 'play', 'question', 'x', '1', '2', '3' ];
  imageNames.forEach(name => {
    images[name] = loadImage(`public/${name}.png`)
  });

}

function setup() {
  preload();

  createCanvas(WIDTH, HEIGHT);

  // Start with a randomized grid
  grid.randomize();

  // Buttons
  buttons.push(
    // Pause/play
    new Button(32, BUTTON_HEIGHT, () => active ? 'pause' : 'play', () => {
      active = !active; 
    }, true, () => active ? 'Pause' : 'Play'),

    // Advance
    new Button(96, BUTTON_HEIGHT, 'advance', () => {
        grid.advance();
        iteration++;
    }, () => !active, 'Advance 1 iteration'),

    // Randomize
    new Button(160, BUTTON_HEIGHT, 'question', () => {
     grid.randomize(); 
     iteration = 0; 
    }, () => !active, 'Randomize'),

    // Color Mode
    new Button(224, BUTTON_HEIGHT, () => `${currentColorMode + 1}`, () => {
      if (currentColorMode == colorModes.length - 1) {
        currentColorMode = 0;
      } else {
        currentColorMode++;
      }
    }, true, () => `Color Mode: ${colorModes[currentColorMode]}`),

    // Infomation
    new Button(288, BUTTON_HEIGHT, 'info', () => {
      displayInfo = !displayInfo; 
    }, true, 'Toggle Info'),
  );

}

function mousePressed() {

  if (mouseX >= 0 && mouseX <= WIDTH && mouseY >= 0 && mouseY <= WIDTH) {
    // Within the grid, modify one of the cells if we are paused
    if (active) {
      return;
    }
    let gridX = (Math.floor(mouseX / CELL_SIZE)*CELL_SIZE) / CELL_SIZE;
    let gridY = (Math.floor(mouseY / CELL_SIZE)*CELL_SIZE) / CELL_SIZE;
    grid.toggle(gridX, gridY);
  } else {
    // Otherwise check the buttons
    buttons.forEach(button => {
      if (!button.canClick()) {
        return;
      }

      if (button.mouseIn()) {
        button.action();
      }
    })

  }

}

function draw() {

  if (active && frameCount % 5 === 0) {
    grid.advance();
    iteration++;
  }

  background(0);

  grid.draw();

  if (displayInfo) {

    let infos = [
      () => `Active: ${active}`,
      () => `Iteration: ${iteration}`,
      () => `Live cells: ${grid.stateCount(true)}`,
      () => `Density: ${(grid.density()*100).toFixed(2)}%`,
      () => `Color mode: ${colorModes[currentColorMode]}`
    ];

    push()
    textSize(32)
    textAlign(LEFT, TOP)
    fill('red')
    infos.forEach((info, idx) => {
      text(info(), 4, 4 + 32*idx);
    });
    pop()
  }

  // Draw each of the buttons
  fill(0)
  buttons.forEach(button => {
    button.draw()
  });

}
