document.querySelector("body").style = "height: 90vh; display: flex; justify-content: center; align-items: center; background-color: #111"; //set body style
document.write("<canvas id='canvas' style='border: solid 4px #4D4; outline: solid 4px #181; padding:1px; background-color: #4D4;'></canvas>"); //create styled canvas for snake


let miniBlockSize = 4;
let arenaSize = [30, 20];
let defaultSnake = [[6, 2, false], [5, 2, false], [4, 2, false], [3, 2, false], [2, 2, false]];
let defaultFoodLocation = [10, 2];
let snake = [...defaultSnake];
let foodLocation = [...defaultFoodLocation];
let snakeDelay = 200;

const gameCanvas = document.getElementById('canvas');
gameCanvas.setAttribute('width', arenaSize[0] * miniBlockSize * 4);
gameCanvas.setAttribute('height', arenaSize[1] * miniBlockSize * 4);
const ctx = gameCanvas.getContext('2d');
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

// function eraseBlock(x, y) {
// 	blockSize = miniBlockSize * 4;
// 	ctx.clearRect(blockSize * x, blockSize * y, blockSize, blockSize);
// }


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
function getDirection(mainPoint, secondPoint) {
	let x = mainPoint[0] - secondPoint[0];
	let y = mainPoint[1] - secondPoint[1];
	
	if (x == 0 && y == 0) return direction.SAMEBLOCK;
	else if ( (x == 1 || x ==  1 - arenaSize[0]) && y == 0) return direction.RIGHT;
	else if (x == 0 && (y == 1 || y == 1 - arenaSize[1])) return direction.DOWN;
	else if ((x == -1 || x == arenaSize[0] - 1) && y == 0) return direction.LEFT;
	else if (x == 0 && (y == -1 || y == arenaSize[1] - 1)) return direction.UP;
	else return direction.FARAWAY;
}

let foodBlock = 0x4A40;

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

//WALLS LOGIC #####################################
let wallPiece = "#";
let walls = [
	"#".repeat(arenaSize[0]),
	"## ## ## # ## #",
	"     #  #  # #",
	"        #  # #",
	"  ####  ##  # #"
];
walls = [];
let wallRender = {};
for (let y = 0; y < walls.length; y++) {
	for (let x = 0; x < walls[0].length; x++) {
		if (walls[y][x] == wallPiece) {
			let block = 0x0660;
			if (walls[y]?.[x+1] == wallPiece) block |= 0x0110;
			if (walls[y]?.[x-1] == wallPiece) block |= 0x0880;
			if (walls[y+1]?.[x] == wallPiece) block |= 0x0006;
			if (walls[y-1]?.[x] == wallPiece) block |= 0x6000;

			wallRender[[x, y]] = block;
		} 
	}
}

//WALLS LOGIC #####################################

function renderSnakeFoodWalls(snakeArray) {
	let snakeLength = snake.length - 1;
	//HEAD OF SNAKE RENDER
	let headDirection = getDirection(snake[0], snake[1]);
	let hasFoodInFront = (headDirection == getDirection(foodLocation, snake[0]));
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
	printBlock(foodBlock, foodLocation);


	for (let coordinates in wallRender) {
		printBlock(wallRender[coordinates], coordinates.split(',')); // js string to number conversion used
	}
	//TEMP


}
//renderSnakeFoodWalls(snake);
function checkGameOverConditions() {
	for (let i = 1; i < snake.length; i++) //check if snake eats itself
	{
		if (getDirection(snake[0], snake[i]) == direction.SAMEBLOCK) {
			return true;
		}
	}

	// dying by hitting a wall condition check
	for (let wallBlockCoordinates in wallRender)
	{
		if (getDirection(wallBlockCoordinates.split(','), snake[0]) == direction.SAMEBLOCK) { // js string to number conversion used
			return true;
		}
	}
}

function reinitializeGame() {
	snake = [...defaultSnake];
	foodLocation = [...defaultFoodLocation]
	keyDirection = direction.RIGHT;
	snakeDirection = direction.RIGHT;
};

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


	// check if food is eaten (is snake head in food)s
	if (getDirection(snake[0], foodLocation) == direction.SAMEBLOCK) {
		//this do-while generates food that is not inside of snake body or wall
		let foodIsInSnakeOrWall = false;
		do {
			foodIsInSnakeOrWall  = false;
			foodLocation[0] = Math.floor(Math.random() * arenaSize[0]);
			foodLocation[1] = Math.floor(Math.random() * arenaSize[1]);
			for (let i = 0; i < snake.length; i++) {
				if (getDirection(snake[i], foodLocation) == direction.SAMEBLOCK) {
					foodIsInSnakeOrWall = true;
					break;
				}
			}
			
			//check if food generated in wall, if so new location would be selected
			if (!foodIsInSnakeOrWall) {
				for (let wallBlockCoordinates in wallRender) {
					if (getDirection(wallBlockCoordinates.split(','), foodLocation) == direction.SAMEBLOCK) {
						foodIsInSnakeOrWall = true;
						break;
					}
				}
			}
		} while (foodIsInSnakeOrWall) //if random food location is in snake, get new location		
		snake[0][2] = true; //set the part of snake to to show it ate a food, required for rendering "fat" parts of snake
	}
	else {
		snake.pop(); //remove last element of snake if it didn't eat any food, or snake will grow indefinitely
	}

	// snake dying condition checks
	let isGameOver = checkGameOverConditions();
	if (isGameOver) reinitializeGame();


	ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); //erase entire canvas
	renderSnakeFoodWalls(snake); //render the snake and food
}
setInterval(() => { gameloop(snake) }, snakeDelay); //to control snake, lower value, higher speed
