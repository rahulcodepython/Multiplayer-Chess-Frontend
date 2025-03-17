import { useEffect, useState } from "react"
import { GAME_QUEUE_FULL } from "../components/Game";

export const useSocket = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [queueFull, setQueueFull] = useState<boolean>(false);

    const url = "ws://localhost:8080";

    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => setSocket(ws);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case GAME_QUEUE_FULL:
                    setQueueFull(true);
                    break;
            }
        };

        ws.onclose = () => setSocket(null);

        return () => {
            ws.close();
            ws.onmessage = null;
        }
    }, []);

    return { socket, queueFull };
}