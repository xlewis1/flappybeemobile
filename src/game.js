const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const GROUND_Y = 595;

const GRAVITY = 1000;
const JUMP_STRENGTH = -380;
const GAME_SPEED = 300;

const FLOWER_START_X = SCREEN_WIDTH + 150;

const assets = {
    background: null,
    wingsUp: null,
    wingsDown: null,
    shortFlower: null,
    tallFlower: null
};

function loadImage(path) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(
            new Error(`Failed to load ${path}`)
        );

        image.src = path;
    });
}

export async function loadAssets() {
    const base = import.meta.env.BASE_URL;

    const [
        background,
        wingsUp,
        wingsDown,
        shortFlower,
        tallFlower
    ] = await Promise.all([
        loadImage(`${base}Background.png`),
        loadImage(`${base}Bumble_1.png`),
        loadImage(`${base}Bumble_2.png`),
        loadImage(`${base}flower_1.png`),
        loadImage(`${base}Flower_2.png`)
    ]);

    assets.background = background;
    assets.wingsUp = wingsUp;
    assets.wingsDown = wingsDown;
    assets.shortFlower = shortFlower;
    assets.tallFlower = tallFlower;
}

function checkCollision(
    x1,
    y1,
    w1,
    h1,
    x2,
    y2,
    w2,
    h2
) {
    return (
        x1 < x2 + w2 &&
        x2 < x1 + w1 &&
        y1 < y2 + h2 &&
        y2 < y1 + h1
    );
}

export function createGame() {
    const game = {
        gameActive: false,
        deadState: false,

        score: 0,
        highScore: 0,

        lastTime: 0,

        background: {
            x1: 0,
            x2: SCREEN_WIDTH,
            speed: 140
        },

        bee: {
            x: 150,
            y: 200,

            width: 80,
            height: 75,

            velocity: 0,

            animTimer: 0,
            wingsUp: true
        },

        flowers: [],

        spawnTimer: 0,
        spawnInterval: 2.3
    };

    return game;
}

export function resetGame(game) {
    game.score = 0;

    game.gameActive = true;
    game.deadState = false;

    game.background.x1 = 0;
    game.background.x2 = SCREEN_WIDTH;

    game.bee.x = 150;
    game.bee.y = 200;
    game.bee.velocity = 0;
    game.bee.animTimer = 0;
    game.bee.wingsUp = true;

    game.flowers = [];

    game.spawnTimer = 0;
    game.spawnInterval = 2.3;
}

export function flap(game) {
    if (!game.gameActive) {
        return;
    }

    game.bee.velocity = JUMP_STRENGTH;
}

function getBeeRect(game) {
    return {
        x: game.bee.x + 18,
        y: game.bee.y + 14,
        width: game.bee.width - 36,
        height: game.bee.height - 28
    };
}

function spawnFlower(game, isTall) {
    const flower = {
        x: FLOWER_START_X,
        isTall,
        passed: false,

        width: 180,
        height: isTall ? 500 : 380
    };

    const visualYOffset = isTall ? 130 : 170;

    flower.y =
        SCREEN_HEIGHT -
        flower.height +
        visualYOffset;

    game.flowers.push(flower);
}

function updateBackground(game, dt) {
    game.background.x1 -=
        game.background.speed * dt;

    game.background.x2 -=
        game.background.speed * dt;

    if (
        game.background.x1 <=
        -SCREEN_WIDTH
    ) {
        game.background.x1 =
            game.background.x2 +
            SCREEN_WIDTH;
    }

    if (
        game.background.x2 <=
        -SCREEN_WIDTH
    ) {
        game.background.x2 =
            game.background.x1 +
            SCREEN_WIDTH;
    }
}

function updateBee(game, dt) {
    const bee = game.bee;

    bee.velocity += GRAVITY * dt;
    bee.y += bee.velocity * dt;

    if (bee.y < 0) {
        bee.y = 0;
        bee.velocity = 0;
    }

    bee.animTimer += dt;

    if (bee.animTimer > 0.08) {
        bee.wingsUp = !bee.wingsUp;
        bee.animTimer = 0;
    }
}

function updateFlowers(game, dt) {
    game.spawnTimer += dt;

    if (
        game.spawnTimer >=
        game.spawnInterval
    ) {
        const isTall =
            Math.floor(Math.random() * 2) === 0;

        spawnFlower(game, isTall);

        game.spawnInterval =
            2.0 +
            Math.floor(Math.random() * 51) /
                100;

        game.spawnTimer = 0;
    }

    const beeRect = getBeeRect(game);

    for (
        let i = game.flowers.length - 1;
        i >= 0;
        i--
    ) {
        const flower = game.flowers[i];

        flower.x -= GAME_SPEED * dt;

        if (
            !flower.passed &&
            flower.x + 80 < beeRect.x
        ) {
            game.score++;

            if (
                game.score >
                game.highScore
            ) {
                game.highScore =
                    game.score;
            }

            flower.passed = true;
        }

        if (
            flower.x + flower.width < 0
        ) {
            game.flowers.splice(i, 1);
        }
    }
}

function checkGameCollision(game) {
    const bee = getBeeRect(game);

    if (
        checkCollision(
            bee.x,
            bee.y,
            bee.width,
            bee.height,
            0,
            GROUND_Y,
            SCREEN_WIDTH,
            SCREEN_HEIGHT - GROUND_Y
        )
    ) {
        game.gameActive = false;
        game.deadState = true;

        return;
    }

    for (const flower of game.flowers) {
        const flowerRect = {
            x: flower.x + 20,
            y: flower.y + 10,
            width: flower.width - 40,
            height: flower.height - 20
        };

        if (
            checkCollision(
                bee.x,
                bee.y,
                bee.width,
                bee.height,
                flowerRect.x,
                flowerRect.y,
                flowerRect.width,
                flowerRect.height
            )
        ) {
            game.gameActive = false;
            game.deadState = true;

            return;
        }
    }
}

export function updateGame(game, dt) {
    if (!game.gameActive) {
        return;
    }

    updateBackground(game, dt);
    updateBee(game, dt);
    updateFlowers(game, dt);
    checkGameCollision(game);
}

function drawBackground(ctx, game) {
    const image = assets.background;

    ctx.drawImage(
        image,
        game.background.x1,
        0,
        SCREEN_WIDTH,
        SCREEN_HEIGHT
    );

    ctx.drawImage(
        image,
        game.background.x2,
        0,
        SCREEN_WIDTH,
        SCREEN_HEIGHT
    );
}

function drawFlowers(ctx, game) {
    for (const flower of game.flowers) {
        const image =
            flower.isTall
                ? assets.tallFlower
                : assets.shortFlower;

        ctx.drawImage(
            image,
            flower.x,
            flower.y,
            flower.width,
            flower.height
        );
    }
}

function drawBee(ctx, game) {
    const bee = game.bee;

    const image =
        bee.wingsUp
            ? assets.wingsUp
            : assets.wingsDown;

    ctx.drawImage(
        image,
        bee.x,
        bee.y,
        bee.width,
        bee.height
    );
}

export function renderGame(ctx, game) {
    ctx.clearRect(
        0,
        0,
        SCREEN_WIDTH,
        SCREEN_HEIGHT
    );

    ctx.save();

    ctx.imageSmoothingEnabled = true;

    drawBackground(ctx, game);
    drawFlowers(ctx, game);
    drawBee(ctx, game);

    ctx.restore();
}

export function getGameDimensions() {
    return {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    };
}