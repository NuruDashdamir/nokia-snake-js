document.querySelector("body").style = "height: 90vh; display: flex; justify-content: center; align-items: center; background-color: #111"; //set body style
document.write("<canvas id='canvas' style='border: solid 4px #181; padding:1px; background-color: #4D4;'></canvas>"); //create styled canvas for snake


let miniBlockSize = 4;
let arenaSize = [30, 20];
let defaultSnake = [[6, 2, false], [5, 2, false], [4, 2, false], [3, 2, false], [2, 2, false]];
let snake = [...defaultSnake];
let food_location = [5, 5];
let snakeDelay = 100;

const snakeArenaCanvas = document.getElementById('canvas');
snakeArenaCanvas.setAttribute('width', arenaSize[0] * miniBlockSize * 4);
snakeArenaCanvas.setAttribute('height', arenaSize[1] * miniBlockSize * 4);
const ctx = snakeArenaCanvas.getContext('2d');
ctx.fillStyle = 'black';

function printBlock(intBlockData, coordinates) //blockData is 2byte hex (0xFFFF)
{
	let x = coordinates[0];
	let y = coordinates[1];
	//"miniBlockSize" per mini block, "4* miniBlockSize"  will be whole block
	for (let i = 0; i < 4; i++) {
		let current = intBlockData % 16;
		intBlockData = Math.floor(intBlockData / 16);
		for (let j = 0; j < 4; j++) {
			if (current % 2 == 1) ctx.fillRect(miniBlockSize * (4 * x + 3 - j), miniBlockSize * (4 * y + 3 - i), miniBlockSize, miniBlockSize);
			current = Math.floor(current / 2)
		}
	}

}

function eraseBlock(x, y) {
	ctx.fillStyle = 'white';
	blockSize = miniBlockSize * 4;
	ctx.fillRect(blockSize * x, blockSize * y, blockSize, blockSize);
	ctx.fillStyle = 'black';
}


///NEW
let direction = {
	UP: -1,
	RIGHT: 2,
	DOWN: 1,
	LEFT: -2,
	SAMEBLOCK: 0,
	FARAWAY: 10
};

let reverseDirection = {
	[direction.UP]: direction.DOWN,
	[direction.RIGHT]: direction.LEFT,
	[direction.DOWN]: direction.UP,
	[direction.LEFT]: direction.RIGHT
};

// keyboard handler
let keyDirection = direction.RIGHT;
let snakeDirection = direction.RIGHT;
let directionKeyMapping = {
	KeyW: direction.UP,
	KeyA: direction.LEFT,
	KeyS: direction.DOWN,
	KeyD: direction.RIGHT
};
function keyboardHandler(e) {
	let mappedDirectionKey = directionKeyMapping[e.code];
	if (mappedDirectionKey)	keyDirection = mappedDirectionKey;
}
document.addEventListener('keypress', keyboardHandler);

// get direction with wrapping around snake in mind
function getDirection(main, secondary) {
	let x = main[0] - secondary[0];
	let y = main[1] - secondary[1];
	
	if (x == 0 && y == 0) return direction.SAMEBLOCK;
	else if ( (x == 1 || x ==  1 - arenaSize[0]) && y == 0) return direction.RIGHT;
	else if (x == 0 && (y == 1 || y == 1 - arenaSize[1])) return direction.DOWN;
	else if ((x == -1 || x == arenaSize[0] - 1) && y == 0) return direction.LEFT;
	else if (x == 0 && (y == -1 || y == arenaSize[1] - 1)) return direction.UP;
	else return direction.FARAWAY;
}

let foodBlock = 0x0660;

//false - no food in front, true - has food in front
let snakeHeadBlock = {
	[direction.RIGHT]: {true: 0x5AE1, false: 0x4BF0},
	[direction.DOWN]: {true: 0x6A69, false: 0x6A66},
	[direction.LEFT]: {true: 0xA578, false: 0x2DF0},
	[direction.UP]: {true: 0x96A6, false: 0x66A6}
};

//false - no food in body piece (thin), true - has food in body piece (fat)
let snakeBodyBlock = {
	[direction.RIGHT]: {
		[direction.DOWN]: { true: 0x0357, false: 0x0356}, //cloned to down-right
		[direction.LEFT]: { true: 0x6DB6, false: 0x0DB0 },
		[direction.UP]: { true: 0x7530, false: 0x6530 } //cloned to up-right
	},
	[direction.DOWN]: {
		[direction.RIGHT]: { true: 0x0357, false: 0x0356 }, //clone
		[direction.LEFT]: { true: 0x0CAE, false: 0x0CA6 }, //clone
		[direction.UP]: { true: 0x6DB6, false: 0x6426 }
	},
	[direction.LEFT]: {
		[direction.RIGHT]: { true: 0x6BD6, false: 0x0BD0 },
		[direction.DOWN]: { true: 0x0CAE, false: 0x0CA6 }, //cloned to down-left
		[direction.UP]: { true: 0xEAC0, false: 0x6AC0 } //cloned to up-left
	},
	[direction.UP]: {
		[direction.RIGHT]: { true: 0x7530, false: 0x6530 }, //clone
		[direction.DOWN]: { true: 0x6BD6, false: 0x6246 },
		[direction.LEFT]: { true: 0xEAC0, false: 0x6AC0 } //clone
	}
}

let snakeTailBlock = {
	[direction.RIGHT]: 0x0170,
	[direction.DOWN]: 0x0226,
	[direction.LEFT]: 0x08E0,
	[direction.UP]: 0x6220
};

///NEW

function renderSnakeAndFood(snakeArray) {
	let snakeLength = snake.length - 1;
	//HEAD OF SNAKE RENDER
	let headDirection = getDirection(snake[0], snake[1]);
	let hasFoodInFront = (headDirection == getDirection(food_location, snake[0]));
	printBlock(snakeHeadBlock[headDirection][hasFoodInFront], snake[0]);

	//BODY OF SNAKE RENDER
	for (let i = 1; i < snakeLength; i++) {
		let block1direction = getDirection(snake[i - 1], snake[i]);
		let block2direction = getDirection(snake[i + 1], snake[i]);

		//snake[i][2] - if piece has eaten food bool, render fat snake piece
		let hasEatenFood = snake[i][2];
		printBlock(snakeBodyBlock[block1direction][block2direction][hasEatenFood], snake[i]);
	}

	//TAIL OF SNAKE RENDER
	let tailDirection = getDirection(snake[snakeLength - 1], snake[snakeLength]);
	printBlock(snakeTailBlock[tailDirection], snake[snakeLength]); //snake tail - right

	//FOOD RENDER
	printBlock(foodBlock, food_location);
}
//renderSnakeAndFood(snake);
gameloop();
function gameloop() {
	//let key = keyDirection;

	if (keyDirection != reverseDirection[snakeDirection]) {
		snakeDirection = keyDirection;
	}

	if (snakeDirection == direction.RIGHT) {
		snake.unshift([snake[0][0] + 1, snake[0][1], false]);
	}
	else if (snakeDirection ==  direction.DOWN) {
		snake.unshift([snake[0][0], snake[0][1] + 1, false]);
	}
	else if (snakeDirection == direction.UP) {
		snake.unshift([snake[0][0], snake[0][1] - 1, false]);
	}
	else if (snakeDirection == direction.LEFT) {
		snake.unshift([snake[0][0] - 1, snake[0][1], false]);
	}

	// wrap around snake logic (mathematical way, torus-like dimension)
	// rendering should be able to handle wrapped around snake
	snake[0][0] = (snake[0][0] + arenaSize[0]) % arenaSize[0];
	snake[0][1] = (snake[0][1] + arenaSize[1]) % arenaSize[1];


	// check if food is eaten (is snake head in food)
	if (getDirection(snake[0], food_location) == direction.SAMEBLOCK) {
		//this do-while generates food that is not inside of snake body
		let foodIsInSnake = false;
		do {
			foodIsInSnake = false;
			food_location[0] = Math.floor(Math.random() * arenaSize[0]);
			food_location[1] = Math.floor(Math.random() * arenaSize[1]);
			for (let i = 0; i < snake.length; i++) {
				if (snake[i][0] == food_location[0] && snake[i][1] == food_location[1]) {
					foodIsInSnake = true;
					break;
				}
			}
		} while (foodIsInSnake) //if random food location is in snake, get new location		
		snake[0][2] = true; //set the part of snake to to show it ate a food, required for rendering "fat" parts of snake
	}
	else {
		snake.pop(); //remove last element of snake if it didn't eat any food, or snake will grow indefinitely
	}

	// snake dying condition check and game over logic (if eats itself)
	for (let i = 1; i < snake.length; i++)
	{
		if (snake[i][0] == snake[0][0] && snake[i][1] == snake[0][1]) {
			// game over logic
			snake = [...defaultSnake];
			keyDirection = direction.RIGHT;
			snakeDirection = direction.RIGHT;
		}
	}

	

	ctx.clearRect(0, 0, snakeArenaCanvas.width, snakeArenaCanvas.height); //erase entire canvas
	renderSnakeAndFood(snake); //render the snake and food
}
setInterval(() => { gameloop(snake) }, snakeDelay); //to control snake, lower value, higher speed
