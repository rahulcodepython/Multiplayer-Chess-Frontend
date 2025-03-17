import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import Modal from "react-modal";

Modal.setAppElement('#root');

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const WAITING_FOR_PLAYER = "waiting_for_player";
export const GAME_QUEUE_FULL = "game_queue_full";

const chessItemTable = {
    p: 'Pawn',
    n: 'Knight',
    b: 'Bishop',
    r: 'Rook',
    q: 'Queen',
    k: 'King'
};
const Game = () => {
    const { socket, queueFull } = useSocket();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [color, setColor] = useState<"black" | "white" | null>(null);
    const [status, setStatus] = useState<'idle' | 'waiting' | 'playing'>('idle');

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
                    setStatus('playing');
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

    const handlePlayGame = () => {
        socket?.send(JSON.stringify({ type: INIT_GAME }));
        setStatus('waiting');
    };

    return (
        <div className="flex items-center justify-center h-screen container mx-auto">
            <div className={`grid ${status === 'playing' ? 'grid-cols-[1fr_40rem_1fr]' : 'grid-cols-1'} gap-8`}>
                {
                    !chess.isCheckmate() && !chess.isDraw() && status === 'playing' && <div className={`text-4xl text-white  col-span-3`}>
                        {chess.turn() === color?.slice(0, 1) ? 'Your turn' : 'Opponent turn'}
                    </div>
                }
                {
                    status === 'playing' ? <ChessHistory chess={chess} color={'w'} /> : <div></div>
                }
                <div className="grid grid-cols-1 gap-4 relative">
                    <div className={`flex w-full ${status === 'playing' ? '' : 'invisible'}`}>
                        <ChessBoard chess={chess} setBoard={setBoard} board={board} socket={socket} color={color} turn={chess.turn()} />
                    </div>
                    {
                        status !== 'playing' && <div className="absolute top-1/2 w-full flex justify-center">
                            {
                                queueFull ? <p className="px-8 py-4 rounded-md bg-green-700 text-white text-lg">Game queue is full. Try again later.</p> :
                                    status === 'waiting' ? <p className="px-8 py-4 rounded-md bg-green-700 text-white text-lg">Waiting for opponent...</p> :
                                        status === 'idle' ? <button className="px-8 py-4 rounded-md bg-green-700 text-white text-lg cursor-pointer" onClick={handlePlayGame}>Play Game</button> : null

                            }
                        </div>
                    }
                </div>
                {
                    status === 'playing' && <ChessHistory chess={chess} color={'b'} />
                }
            </div>
        </div>
    );
};


const ChessBoard = ({ chess, setBoard, board, socket, color, turn }: {
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket?: WebSocket;
    setBoard: any;
    chess: Chess;
    color: "black" | "white" | null;
    turn: 'w' | 'b' | null;
}) => {
    const [from, setFrom] = useState<Square | null>(null);
    const [modalIsOpen, setIsOpen] = useState(false);
    const [pendingMove, setPendingMove] = useState<{ from: Square; to: Square } | null>(null);
    const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
    const [captureMoves, setCaptureMoves] = useState<Square[]>([]);

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    const handleSquareClick = (square: Square) => {
        if (!from) {
            const piece = chess.get(square);

            if (!piece || piece.color !== color?.[0] || chess.turn() !== color?.[0]) {
                return;
            }

            const legalMoves = chess.moves({ square, verbose: true });

            if (legalMoves.length === 0) {
                return;
            }

            setFrom(square);
            const possibleLegalMoves = legalMoves.map((move) => move.to);
            const captureMoves = legalMoves
                .filter((move) => move.captured)
                .map((move) => move.to);
            setPossibleMoves(possibleLegalMoves);
            setCaptureMoves(captureMoves);
        } else {
            if (possibleMoves.includes(square)) {
                try {
                    const moves = chess.moves({ verbose: true, square: from });
                    const move = moves.find(m => m.to === square);
                    if (move) {
                        if (move.promotion) {
                            setPendingMove({ from, to: square });
                            openModal();
                        } else {
                            makeMove(move);
                        }
                    }
                } catch (error) {
                    setFrom(null);

                }
            }
            setFrom(null);
            setPossibleMoves([]);
            setCaptureMoves([]);
        }
    };

    const makeMove = (move: { from: Square; to: Square; promotion?: PieceSymbol }) => {
        const result = chess.move(move);
        if (result) {
            socket?.send(JSON.stringify({
                type: MOVE, payload: {
                    move: result
                }
            }));
            setBoard(chess.board());
        }
    };

    const handlePromotion = (piece: PieceSymbol) => {
        if (pendingMove) {
            makeMove({ ...pendingMove, promotion: piece });
            setPendingMove(null);
            closeModal();
        }
    }

    return <div className={`border ${color === 'black' && !chess.isCheckmate() && !chess.isDraw() && `transform rotate-180`} text-white ${chess.isCheckmate() && chess.isDraw() && 'w-full flex items-center justify-center'}`}>
        {
            chess.isCheckmate() && <div className="text-4xl text-white text-center">
                {`Checkmate! Winner is ${chess.turn() === 'w' ? 'Black' : 'White'}.`}
            </div>
        }
        {
            chess.isDraw() && <div className="text-4xl text-white text-center">
                Draw
            </div>
        }
        {
            !chess.isCheckmate() && !chess.isDraw() && board.map((row, i) => {
                return <div key={i} className="flex">
                    {
                        row.map((square, j) => {
                            const squareValue = String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;
                            const isPossibleMove = possibleMoves.includes(squareValue);
                            const isCaptureMove = captureMoves.includes(squareValue);

                            return <div key={j} className={`w-20 h-20 flex items-center justify-center ${i % 2 === j % 2 ? 'bg-[#739552]' : 'bg-[#fcfed5]'} ${turn !== color?.slice(0, 1) ? 'hover:cursor-not-allowed' : square && color?.slice(0, 1) !== square.color ? isPossibleMove ? 'hover:cursor-grab' : 'hover:cursor-not-allowed' : 'hover:cursor-grab'}  ${color === 'black' && `transform rotate-180`} relative`} onClick={() => {
                                handleSquareClick(squareValue);
                            }}>
                                {
                                    square && <img src={`/${square?.type}_${square?.color}.png`} alt="" className={square?.type === 'p' ? 'w-8 h-8' : `w-10 h-10`} />
                                }
                                {
                                    isPossibleMove && !isCaptureMove && <div className="w-4 h-4 absolute bg-yellow-500 rounded-full"></div>
                                }
                                {
                                    isCaptureMove && <div className="w-4 h-4 absolute bg-red-500 rounded-full"></div>
                                }
                                {
                                    chess.inCheck() && chess.turn() === square?.color && square.type === 'k' && <div className="w-4 h-4 absolute bg-red-500 rounded-full"></div>
                                }
                                {
                                    from === squareValue && <div className="w-4 h-4 absolute bg-blue-500 rounded-full"></div>
                                }
                            </div>
                        })
                    }
                </div>
            })
        }
        <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            style={customStyles}
            contentLabel="Example Modal"
        >
            <div className="flex flex-col items-center gap-4">
                <span className="text-2xl text-black">
                    Select a piece to promote
                </span>
                <div className="flex gap-4">
                    {['q', 'r', 'b', 'n'].map((piece) => (
                        <img
                            key={piece}
                            src={color ? `/${piece}_${color[0]}.png` : `/${piece}_w.png`}
                            alt=""
                            className="w-10 h-10 cursor-pointer"
                            onClick={() => handlePromotion(piece as PieceSymbol)}
                        />
                    ))}
                </div>
            </div>
        </Modal>
    </div>
}


const ChessHistory = ({ chess, color }: { chess: Chess, color: Color }) => {
    return <div className="grid grid-cols-1 items-start text-center border border-white h-fit max-h-[640px] w-[370px] max-w-[370px] overflow-y-scroll">
        <div className="text-2xl font-bold text-white text-center border-b-2 py-4 h-fit">
            {color === 'w' ? 'White' : 'Black'} History
        </div>
        <div className={`text-white grid grid-cols-6 py-1`}>
            <span>#</span>
            <span>M</span>
            <span>P</span>
            <span className="flex items-center justify-center">
                <img src="/kill.png" width={20} height={20} className="bg-white" />
            </span>
            <span className="flex items-center justify-center">
                <img src="/promotion.png" width={20} height={20} className="bg-white" />
            </span>
            <span className="flex items-center justify-center">
                <img src="/castling.png" width={20} height={20} className="bg-white" />
            </span>
        </div>
        {
            chess.history({ verbose: true }).map((item, i) => {
                return item.color === color && <div key={i} className={`text-white grid grid-cols-6 h-full py-1 ${i % 2 === 0 && 'border-r'}`}>
                    <span>
                        {i + 1}.
                    </span>
                    <span className="flex items-center gap-1">
                        <span>
                            {item.from}
                        </span>
                        <span>
                            &rarr;
                        </span>
                        <span>
                            {item.to}
                        </span>
                    </span>
                    <span>
                        {chessItemTable[item.piece]}
                    </span>
                    {
                        item.captured ? <span>
                            &#10005;
                        </span> : <span>
                            &nbsp;
                        </span>
                    }
                    <span>
                        {item.isPromotion() && item.promotion ? chessItemTable[item.promotion] : ''}
                    </span>
                    {
                        item.isQueensideCastle() ? <span>
                            O-O-O
                        </span> : item.isKingsideCastle() ? <span>
                            O-O
                        </span> : <span>
                            &nbsp;
                        </span>
                    }
                </div>
            }
            )
        }
    </div>
}

export default Game;
