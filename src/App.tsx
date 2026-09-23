const API_URL = import.meta.env.VITE_API_URL;

import { useEffect, useState } from 'react';
import PrevIcon from './assets/prev.svg';
import NextIcon from './assets/next.svg';

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
    const { games, page, totalPages, isLoading:isLoadingGames, error: errorGames, goNext, goPrev, goTo } = usePaginatedGames();
    const { statuses, consoles, isLoading:isLoadingStatusesConsoles, error:errorStatusesConsoles } = useStatusesConsoles();

    const isLoading = isLoadingGames || isLoadingStatusesConsoles
    const error = errorGames || errorStatusesConsoles

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className='games-list'>
            <GamesTable games={games} statuses={statuses} consoles={consoles} />
            <GamesNavigationBar page={page} totalPages={totalPages} goNext={goNext} goPrev={goPrev} goTo={goTo} />
        </div>
    );
}

function useStatusesConsoles() {
    const [statuses, setStatuses] = useState<Record<number, string>>({});
    const [consoles, setConsoles] = useState<Record<number, string>>({});
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<string|undefined>();

    useEffect(() => {
        setLoading(true);
        try {
            fetchStatuses().then(s => setStatuses(s));
            fetchConsoles().then(c => setConsoles(c));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, []);

    return { statuses, consoles, isLoading, error};
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

function usePaginatedGames(initial = 0) {
    const [page, setPage] = useState(initial);
    const [totalPages, setTotalPages] = useState(0);
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<string|undefined>();

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(`${API_URL}/games?page=${page}`)
            .then(r => r.json())
            .then(json => {
                if (cancelled) return;
                setTotalPages(json.page?.totalPages);
                setGames(json._embedded?.gameResponseList ?? []);
            })
            .catch(e => { if (!cancelled) setError(e.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        
        return () => { cancelled = true; };
    }, [page]);

    return {
        games, page, totalPages, isLoading, error,
        goNext: () => setPage(p => (totalPages ? Math.min(totalPages - 1, p + 1) : p + 1)),
        goPrev: () => setPage(p => (Math.max(0, p - 1))),
        goTo: (p: number) => setPage(p)
    };
}

function GamesTable({games, statuses, consoles }: { games: Game[], statuses: Record<number, string>, consoles: Record<number, string> }) {
    const tableRows = games.map((game) => {
        return (
            <tr key={game.gameId}>
                <td>{game.gameTitle}</td>
                <td>{statuses[game.statusId]}</td>
                <td>{consoles[game.consoleId]}</td>
                <td>{game.score}</td>
            </tr>
        );
    })
    
    return (
        <table className='games-table'>
            <thead>
                <tr>
                    <th className='title-header'>Title</th>
                    <th className='status-header'>Status</th>
                    <th className='console-header'>Console</th>
                    <th className='score-header'>Score</th>
                </tr>
            </thead>
            <tbody>
                {tableRows}
            </tbody>
        </table>
    );
}

function GamesNavigationBar({ page, totalPages, goNext, goPrev, goTo }: { page: number, totalPages: number, goNext: Function, goPrev: Function, goTo: Function }) {
    const isOnFirstPage = page == 0;
    const isOnLastPage = page == totalPages-1;

    return (
        <div className='navigation-bar'>
            <button className='navigation-button' disabled={isOnFirstPage} onClick={() => goPrev()}>
                <img src={PrevIcon} alt='Previous page' />
            </button>
            <div className='page-info'>
                <div className='page-number-left'>{page+1}</div>
                /
                <div className='page-number-right'>{totalPages}</div>
            </div>
            <button className='navigation-button' disabled={isOnLastPage} onClick={() => goNext()}>
                <img src={NextIcon} alt='Next page' />
            </button>
        </div>
    )
}