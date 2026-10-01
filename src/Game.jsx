import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    createGame,
    flap,
    getGameDimensions,
    loadAssets,
    renderGame,
    resetGame,
    updateGame
} from "./game.js";

function Game() {
    const canvasRef = useRef(null);
    const gameRef = useRef(createGame());
    const animationRef = useRef(null);
    const musicRef = useRef(null);

    const [gameState, setGameState] =
        useState("menu");

    const [score, setScore] =
        useState(0);

    const [highScore, setHighScore] =
        useState(0);

    useEffect(() => {
        musicRef.current =
            new Audio("/beetheme.wav");

        musicRef.current.loop = true;
        musicRef.current.volume = 0.7;

        return () => {
            if (musicRef.current) {
                musicRef.current.pause();
                musicRef.current.currentTime = 0;
            }
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        async function start() {
            await loadAssets();

            if (!mounted) {
                return;
            }

            const canvas =
                canvasRef.current;

            if (!canvas) {
                return;
            }

            const ctx =
                canvas.getContext("2d");

            const dimensions =
                getGameDimensions();

            canvas.width =
                dimensions.width;

            canvas.height =
                dimensions.height;

            let lastTime =
                performance.now();

            function loop(time) {
                if (!mounted) {
                    return;
                }

                let dt =
                    (time - lastTime) /
                    1000;

                lastTime = time;

                if (dt > 0.1) {
                    dt = 0.1;
                }

                const game =
                    gameRef.current;

                updateGame(
                    game,
                    dt
                );

                renderGame(
                    ctx,
                    game
                );

                setScore(
                    game.score
                );

                setHighScore(
                    game.highScore
                );

                if (
                    game.deadState &&
                    gameState !==
                        "gameover"
                ) {
                    if (musicRef.current) {
                        musicRef.current.pause();
                        musicRef.current.currentTime = 0;
                    }

                    setGameState(
                        "gameover"
                    );
                }

                animationRef.current =
                    requestAnimationFrame(
                        loop
                    );
            }

            animationRef.current =
                requestAnimationFrame(
                    loop
                );
        }

        start();

        return () => {
            mounted = false;

            if (
                animationRef.current
            ) {
                cancelAnimationFrame(
                    animationRef.current
                );
            }
        };
    }, [gameState]);

    function handlePlay() {
        const game =
            gameRef.current;

        resetGame(game);

        setScore(0);

        if (musicRef.current) {
            musicRef.current.currentTime = 0;

            musicRef.current
                .play()
                .catch(() => {});
        }

        setGameState("playing");
    }

    function handleFlap() {
        const game =
            gameRef.current;

        flap(game);
    }

    return (
        <div className="game">
            <div className="game-frame">

                <canvas
                    ref={canvasRef}
                    className="game-canvas"
                />

                {gameState ===
                    "playing" && (
                    <div className="hud">
                        <div className="score">
                            {score}
                        </div>
                    </div>
                )}

                {gameState ===
                    "menu" && (
                    <div className="game-overlay">
                        <h1 className="game-title">
                            Flappy Bee
                        </h1>

                        <p className="game-subtitle">
                            TAP FLAP TO FLY
                        </p>

                        <p className="final-score">
                            HIGH SCORE:{" "}
                            {highScore}
                        </p>

                        <button
                            className="game-button play-button"
                            onClick={
                                handlePlay
                            }
                        >
                            PLAY
                        </button>
                    </div>
                )}

                {gameState ===
                    "gameover" && (
                    <div className="game-overlay">
                        <h1 className="game-title">
                            GAME OVER
                        </h1>

                        <p className="final-score">
                            FINAL SCORE:{" "}
                            {score}
                        </p>

                        <p className="final-score">
                            BEST DISTANCE:{" "}
                            {highScore}
                        </p>

                        <button
                            className="game-button play-button"
                            onClick={
                                handlePlay
                            }
                        >
                            PLAY AGAIN
                        </button>
                    </div>
                )}

                <button
                    className="flap-button"
                    onPointerDown={
                        handleFlap
                    }
                    disabled={
                        gameState !==
                        "playing"
                    }
                >
                    FLAP
                </button>

            </div>
        </div>
    );
}

export default Game;