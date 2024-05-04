import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Chess, Color, PieceSymbol, Square } from "chess.js";

export const INIT_GAME = 'init_game';
export const MOVE = 'move';
export const GAME_OVER = 'game_over';

const Game = () => {
    const socket = useSocket();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [color, setColor] = useState<Color | null>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!socket) {
            return;
        }

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case INIT_GAME:
                    setChess(pre => pre);
                    setBoard(chess.board());
                    setColor(data.payload.color);
                    setStarted(true);
                    break;
                case MOVE:
                    const move = data.payload;
                    chess.move(move);
                    setBoard(chess.board());
                    break;
                case GAME_OVER:
                    break;
                default:
                    break;
            }
        };

        return () => {
            socket.onmessage = null;
        };
    }, [socket]);

    if (!socket) {
        return <div>Connecting...</div>;
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-wrap w-[40rem]">
                    <ChessBoard chess={chess} setBoard={setBoard} board={board} socket={socket} />
                </div>
                <div className="flex flex-col justify-center items-center px-24">
                    {
                        !started && <button className="px-8 py-4 rounded-md bg-green-700 text-white w-full text-lg font-bold" onClick={() => {
                            socket.send(JSON.stringify({ type: INIT_GAME }));
                        }}>
                            Play
                        </button>
                    }
                    <div className="mt-4">
                        You - {color}
                    </div>
                    <div className="mt-4">
                        Next turn for {chess.turn()}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        {chess.history()}
                    </div>
                </div>
            </div>
        </div>
    );
};


const ChessBoard = ({ chess, setBoard, board, socket }: {
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket?: WebSocket;
    setBoard: any;
    chess: Chess;
}) => {
    const [from, setFrom] = useState<Square | null>(null);

    return <div>
        {
            board.map((row, i) => {
                return <div key={i} className="flex">
                    {
                        row.map((square, j) => {
                            const squareValue = String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;
                            return <div key={j} className={`w-20 h-20 flex items-center justify-center ${i % 2 === j % 2 ? 'bg-[#739552]' : 'bg-[#EBECD0]'}`} onClick={() => {
                                if (!from) {
                                    setFrom(squareValue);
                                } else {
                                    try {
                                        socket?.send(JSON.stringify({
                                            type: MOVE, payload: {
                                                move: {
                                                    from: from,
                                                    to: squareValue
                                                }
                                            }
                                        }));
                                        chess.move({
                                            from: from,
                                            to: squareValue
                                        });
                                        setBoard(chess.board());
                                        setFrom(null);
                                    } catch (error) {
                                        setFrom(null);

                                    }
                                }
                            }}>
                                {
                                    square && <img src={`/${square?.type}_${square?.color}.png`} alt="" className={square?.type === 'p' ? 'w-8 h-8' : `w-10 h-10`} />
                                }
                            </div>
                        })
                    }
                </div>
            })
        }
    </div>
}

export default Game;
