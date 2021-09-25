document.getElementsByTagName("body")[0].style = "align: center; background-color: #111"; //set body style
document.write("<canvas id='canvas' style='border: solid 3px #181; padding:1px; background-color: #4D4; width: 98%;'></canvas>"); //create styled canvas for snake
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';
let miniBlockSize = 4;
let arenaSize = [40, 30];
let snakeArena = document.getElementById('canvas');
let defaultSnake = [
    [7, 2, 0],
    [6, 2, 0],
    [5, 2, 0],
    [4, 2, 0],
    [3, 2, 0],
    [2, 2, 0]
];
let snake = [...defaultSnake];
let food_location = [5, 5];
let snakeDelay = 100;
snakeArena.setAttribute('width', arenaSize[0] * miniBlockSize * 4);
snakeArena.setAttribute('height', arenaSize[1] * miniBlockSize * 4);

function printBlock(intBlockData, x, y) //blockData is 2byte hex (0xFFFF)
{
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

var currentKey = "KeyD";
var snakeDirection = "KeyD";

function keyboardHandler(e) {
    currentKey = e.code;
}

document.addEventListener('keypress', keyboardHandler);

function renderSnake(snakeArray) {	
    let snakeLength = snake.length - 1;
    let UP = -1;
    let RIGHT = 2;
    let DOWN = 1;
    let LEFT = -2;
    //HEAD OF SNAKE RENDER
    let headDirection = (snake[0][0] - snake[1][0]) * 2 + (snake[0][1] - snake[1][1]); //snake headDirection x*2 + y //UNFINISHED&&&
    if (headDirection == RIGHT) {
        if (food_location[0] == (snake[0][0] + 1) && food_location[1] == snake[0][1]) {
            printBlock(0x5AE1, snake[0][0], snake[0][1]) //snake head - right open mouth
        } else {
            printBlock(0x4BF0, snake[0][0], snake[0][1]) //snake head - right
        }
    } else if (headDirection == DOWN) {
        if (food_location[0] == snake[0][0] && food_location[1] == (snake[0][1] + 1)) {
            printBlock(0x6A69, snake[0][0], snake[0][1]) //snake head - down open mouth
        } else {
            printBlock(0x6A66, snake[0][0], snake[0][1]) //snake head - down
        }
    } else if (headDirection == LEFT) {
        if (food_location[0] == (snake[0][0] - 1) && food_location[1] == snake[0][1]) {
            printBlock(0xA578, snake[0][0], snake[0][1]) //snake head - left open mouth
        } else {
            printBlock(0x2DF0, snake[0][0], snake[0][1]) //snake head - left
        }
    } else if (headDirection == UP) {
        if (food_location[0] == snake[0][0] && food_location[1] == (snake[0][1] - 1)) {
            printBlock(0x96A6, snake[0][0], snake[0][1]) //snake head - up open mouth
        } else {
            printBlock(0x66A6, snake[0][0], snake[0][1]) //snake head - up
        }
    }

    /////////printBlock(snakeHead[direction], snakeArray[0][0], snakeArray[0][1]);
    //MIDDLE OF SNAKE RENDER
    for (let i = 1; i < snakeLength; i++) {
        block1pos = (snake[i - 1][0] - snake[i][0]) * 2 + (snake[i - 1][1] - snake[i][1]);
        block2pos = (snake[i + 1][0] - snake[i][0]) * 2 + (snake[i + 1][1] - snake[i][1]);

        //snake[i][2] == 1 - if piece has eaten food
        if (block1pos == LEFT && block2pos == RIGHT) {
            if (snake[i][2] == 1) {
                printBlock(0x6BD6, snake[i][0], snake[i][1]) //food block piece ^ <
            } else {
                printBlock(0x0BD0, snake[i][0], snake[i][1]) //horizontal block piece <
            }
        } else if (block1pos == RIGHT && block2pos == LEFT) {
            if (snake[i][2] == 1) {
                printBlock(0x6DB6, snake[i][0], snake[i][1]) //food block piece v >
            } else {
                printBlock(0x0DB0, snake[i][0], snake[i][1]) //horizontal block piece >
            }
        } else if (block1pos == UP && block2pos == DOWN) {
            if (snake[i][2] == 1) {
                printBlock(0x6BD6, snake[i][0], snake[i][1]) //food block piece ^ <
            } else {
                printBlock(0x6246, snake[i][0], snake[i][1]) //vertical block piece ^
            }
        } else if (block1pos == DOWN && block2pos == UP) {
            if (snake[i][2] == 1) {
                printBlock(0x6DB6, snake[i][0], snake[i][1]) //food block piece v >
            } else {
                printBlock(0x6426, snake[i][0], snake[i][1]) //vertical block piece v
            }
        } else if ((block1pos == UP && block2pos == LEFT) || (block1pos == LEFT && block2pos == UP)) {
            if (snake[i][2] == 1) {
                printBlock(0xEAC0, snake[i][0], snake[i][1]) //up-left & left-up food eaten piece
            } else {
                printBlock(0x6AC0, snake[i][0], snake[i][1]) //up-left & left-up block piece
            }
        } else if ((block1pos == DOWN && block2pos == RIGHT) || (block1pos == RIGHT && block2pos == DOWN)) {
            if (snake[i][2] == 1) {
                printBlock(0x0357, snake[i][0], snake[i][1]) //down-right & right-down food eaten piece
            } else {
                printBlock(0x0356, snake[i][0], snake[i][1]) //down-right & right-down block piece
            }
            //printBlock(, snake[i][0], snake[i][1]) //down-right & right-down piec
        } else if ((block1pos == DOWN && block2pos == LEFT) || (block1pos == LEFT && block2pos == DOWN)) {
            if (snake[i][2] == 1) {
                printBlock(0x0CAE, snake[i][0], snake[i][1]) //down-left & left-down food eaten piece
            } else {
                printBlock(0x0CA6, snake[i][0], snake[i][1]) //down-left & left-down block piece
            }
        } else if ((block1pos == UP && block2pos == RIGHT) || (block1pos == RIGHT && block2pos == UP)) {
            if (snake[i][2] == 1) {
                printBlock(0x7530, snake[i][0], snake[i][1]) //up-right & right-up food eaten piece
            } else {
                printBlock(0x6530, snake[i][0], snake[i][1]) //up-right & right-up block piece
            }
        }
        /*else if (x == && y == )
		  {
		  
		  } */
    }

    //let tailDirection = (snake[snakeLength][0]-snake[snakeLength-1][0])*2 + (snake[snakeLength][1]-snake[snakeLength-1][1]);
    let tailDirection = (snake[snakeLength - 1][0] - snake[snakeLength][0]) * 2 + (snake[snakeLength - 1][1] - snake[snakeLength][1]);
    if (tailDirection == RIGHT) {
        printBlock(0x0170, snake[snakeLength][0], snake[snakeLength][1]); //snake tail - right
    } else if (tailDirection == DOWN) {
        printBlock(0x0226, snake[snakeLength][0], snake[snakeLength][1]); //snake tail - down
    } else if (tailDirection == LEFT) {
        printBlock(0x08E0, snake[snakeLength][0], snake[snakeLength][1]); //snake tail - left
    } else if (tailDirection == UP) {
        printBlock(0x6220, snake[snakeLength][0], snake[snakeLength][1]); //snake tail - up
    }


    //END OF SNAKE RENDER
    //RENDER FOOD
    printBlock(0x2520, food_location[0], food_location[1]);
}
renderSnake(snake);

function handleSnake() {
    let key = currentKey;

    if (key == "KeyD" && snakeDirection != "KeyA") {
        snakeDirection = "KeyD";
    } else if (key == "KeyS" && snakeDirection != "KeyW") {
        snakeDirection = "KeyS";
    } else if (key == "KeyW" && snakeDirection != "KeyS") {
        snakeDirection = "KeyW";
    } else if (key == "KeyA" && snakeDirection != "KeyD") {
        snakeDirection = "KeyA";
    }

    if (snakeDirection == "KeyD") {
        snake.unshift([snake[0][0] + 1, snake[0][1], 0]);
    } else if (snakeDirection == "KeyS") {
        snake.unshift([snake[0][0], snake[0][1] + 1, 0]);
    } else if (snakeDirection == "KeyW") {
        snake.unshift([snake[0][0], snake[0][1] - 1, 0]);
    } else if (snakeDirection == "KeyA") {
        snake.unshift([snake[0][0] - 1, snake[0][1], 0]);
    }

    if (snake[0][0] == food_location[0] && snake[0][1] == food_location[1]) //snake head is in food, means food is eaten
    {
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
        snake[0][2] = 1; //set the part of snake to to show it ate a food, required for rendering "fat" parts of snake
    } else {
        snake.pop(); //remove last element of snake if it didn't eat any food, or snake will grow indefinitely
    }

    for (let i = 1; i < snake.length; i++) //DYING condition check
    {
        if ((snake[i][0] == snake[0][0] && snake[i][1] == snake[0][1]) || (snake[0][0] < 0 || snake[0][0] >= arenaSize[0] || snake[0][1] < 0 || snake[0][1] >= arenaSize[1])) {
            snake = [...defaultSnake];
            currentKey = "KeyD";
            snakeDirection = "KeyD";
        }
    }


    ctx.clearRect(0, 0, canvas.width, canvas.height); //erase entire canvas
    renderSnake(snake); //render the snake and food
}
let timer = setInterval(() => {
    handleSnake(snake)
}, snakeDelay); //to control snake, lower value, higher speed