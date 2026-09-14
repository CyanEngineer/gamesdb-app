const API_URL = import.meta.env.VITE_API_URL;

import { useEffect, useState } from 'react';

type Game = {
    gameId: number;
    gameTitle: string;
    statusName: string;
    consoleName: string;
    score: number;
    sortingName: string;
};

export default function App() {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const gamesList = games.map(game => <li key={game.gameId}>{game.gameTitle}, {game.statusName}, {game.consoleName}, {game.score}</li>);

    useEffect(() => {
        async function loadData() {
            try {
                const games = await loadGames();
                setGames(games);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

        

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Cool stuff coming soon🔥</h1>
            <ul>
                {gamesList}
            </ul>
        </div>
    );
}

async function loadGames(): Promise<Game[]> {
    const response = await fetch(`${API_URL}/games`);
    if (!response.ok) throw new Error("Failed to fetch games");

    const data = await response.json();

    return data._embedded?.gameResponseList ?? [];
}