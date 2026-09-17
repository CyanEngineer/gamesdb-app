const API_URL = import.meta.env.VITE_API_URL;

import { useEffect, useState } from 'react';

type Game = {
    gameId: number;
    gameTitle: string;
    statusId: number;
    consoleId: number;
    score: number;
    sortingName: string;
};

type KeyValPair = {
    id: number;
    name: string;
}

export default function App() {
    const [games, setGames] = useState<Game[]>([]);
    const [statuses, setStatuses] = useState<Record<number, string>>({});
    const [consoles, setConsoles] = useState<Record<number, string>>({});
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const [fetchedGames, fetchedStatuses, fetchedConsoles] = await Promise.all([
                    fetchGames(),
                    fetchStatuses(),
                    fetchConsoles()
                ]);

                setGames(fetchedGames);
                setStatuses(fetchedStatuses);
                setConsoles(fetchedConsoles);
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
            {buildGamesList(games, statuses, consoles)}
        </div>
    );
}

async function fetchGames(): Promise<Game[]> {
    const response = await fetch(`${API_URL}/games`);
    if (!response.ok) throw new Error("Failed to fetch games");

    const json = await response.json();

    return json._embedded?.gameResponseList ?? [];
}

async function fetchStatuses(): Promise<Record<number, string>> {
    const response = await fetch(`${API_URL}/statuses`);
    if (!response.ok) throw new Error("Failed to fetch statuses");

    const json = await response.json();
    const data = json._embedded?.statusResponseList ?? [];

    return toKeyValPair(data);
}

async function fetchConsoles(): Promise<Record<number, string>> {
    const response = await fetch(`${API_URL}/consoles`);
    if (!response.ok) throw new Error("Failed to fetch consoles");

    const json = await response.json();
    const data = json._embedded?.consoleResponseList ?? [];

    return toKeyValPair(data);
}

function toKeyValPair<T extends KeyValPair>(items: T[]): Record<number, string> {
    return Object.fromEntries(
        items.map(({ id:key, name:value }) => [key, value])
    );
}

function buildGamesList(games: Game[], statuses: Record<number, string>, consoles: Record<number, string>) {
    return (
        <div className='games-list'>
            {buildGamesTable(games, statuses, consoles)}
        </div>
    );
}

function buildGamesTable(games: Game[], statuses: Record<number, string>, consoles: Record<number, string>) {
    const tableRows = games.map((game) => {
        return (
            <tr>
                <td>{game.gameTitle}</td>
                <td>{statuses[game.statusId]}</td>
                <td>{consoles[game.consoleId]}</td>
                <td>{game.score}</td>
            </tr>
        );
    })
    
    return (
        <table className='games-table'>
            <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Console</th>
                <th>Score</th>
            </tr>
            {tableRows}
        </table>
    );
}