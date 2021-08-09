import { Standings } from '../interfaces/Standings';

const fetchJson = async <T>(url: string): Promise<T> => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(res.statusText);
    }
    const obj = (await res.json()) as T;
    return obj;
};

export const fetchContestStandings = async (contestSlug: string): Promise<Standings> => {
    const url = `https://atcoder.jp/contests/${contestSlug}/standings/json`;
    return await fetchJson<Standings>(url);
};
