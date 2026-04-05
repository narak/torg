import { useState, useEffect, useRef, useCallback } from 'react';
import {
    syncToDrive as apiSync,
    loadFromDrive as apiLoad,
    type DriveSyncResult,
} from '../lib/driveSync';
import type { OrgNode } from '../types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

// Minimal types for Google Identity Services token client
interface GisTokenResponse {
    access_token: string;
    expires_in: number;
    error?: string;
}
interface GisTokenClient {
    requestAccessToken(opts?: { prompt?: string }): void;
}
interface GisOAuth2 {
    initTokenClient(cfg: {
        client_id: string;
        scope: string;
        callback: (r: GisTokenResponse) => void;
    }): GisTokenClient;
}
declare global {
    interface Window {
        google?: { accounts?: { oauth2?: GisOAuth2 } };
    }
}

export type DriveStatus = 'idle' | 'loading' | 'syncing' | 'synced' | 'error';

export interface DriveState {
    driveStatus: DriveStatus;
    driveLastSynced: Date | null;
    driveError: string | null;
    driveFileUrl: string | null;
    driveConfigured: boolean;
    syncToDrive: (markdown: string, nodes: OrgNode[]) => void;
    loadFromDrive: () => void;
}

type PendingAction =
    | { type: 'load' }
    | { type: 'sync'; markdown: string; nodes: OrgNode[] };

export function useDriveSync(onLoad: (nodes: OrgNode[]) => void): DriveState {
    const [status, setStatus] = useState<DriveStatus>('idle');
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    const tokenRef = useRef<string | null>(null);
    const tokenExpiresRef = useRef<number>(0);
    const tokenClientRef = useRef<GisTokenClient | null>(null);
    const pendingRef = useRef<PendingAction | null>(null);
    const onLoadRef = useRef(onLoad);
    onLoadRef.current = onLoad;

    const driveConfigured = Boolean(CLIENT_ID);

    const doSync = useCallback(async (markdown: string, nodes: OrgNode[]) => {
        if (!tokenRef.current) return;
        setStatus('syncing');
        setError(null);
        try {
            const result: DriveSyncResult = await apiSync(tokenRef.current, markdown, nodes);
            setFileUrl(result.webViewLink);
            setLastSynced(new Date());
            setStatus('synced');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Sync failed';
            setError(msg);
            setStatus('error');
        }
    }, []);

    const doLoad = useCallback(async () => {
        if (!tokenRef.current) return;
        setStatus('loading');
        setError(null);
        try {
            const nodes = await apiLoad(tokenRef.current);
            if (nodes) {
                onLoadRef.current(nodes);
                setStatus('synced');
            } else {
                setStatus('idle'); // no file yet — fresh install
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Load failed';
            setError(msg);
            setStatus('error');
        }
    }, []);

    // Dispatch pending action after token is available
    const dispatchPending = useCallback(() => {
        const p = pendingRef.current;
        pendingRef.current = null;
        if (!p) return;
        if (p.type === 'load') doLoad();
        else doSync(p.markdown, p.nodes);
    }, [doLoad, doSync]);

    // Initialize the GIS token client once the library has loaded
    useEffect(() => {
        if (!CLIENT_ID) return;

        const initClient = () => {
            const oauth2 = window.google?.accounts?.oauth2;
            if (!oauth2) return;
            tokenClientRef.current = oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPE,
                callback: (response) => {
                    if (response.error) {
                        setError(response.error);
                        setStatus('error');
                        pendingRef.current = null;
                        return;
                    }
                    tokenRef.current = response.access_token;
                    tokenExpiresRef.current = Date.now() + (response.expires_in - 60) * 1000;
                    dispatchPending();
                },
            });

            // Auto-load on startup — request token silently (no popup if already authed)
            pendingRef.current = { type: 'load' };
            tokenClientRef.current.requestAccessToken({ prompt: '' });
        };

        if (window.google?.accounts?.oauth2) {
            initClient();
        } else {
            const id = setInterval(() => {
                if (window.google?.accounts?.oauth2) {
                    clearInterval(id);
                    initClient();
                }
            }, 200);
            return () => clearInterval(id);
        }
    }, [dispatchPending]);

    const requestToken = useCallback((action: PendingAction) => {
        if (!tokenClientRef.current) return;
        const needsToken = !tokenRef.current || Date.now() >= tokenExpiresRef.current;
        if (needsToken) {
            pendingRef.current = action;
            tokenClientRef.current.requestAccessToken({ prompt: '' });
        } else {
            pendingRef.current = action;
            dispatchPending();
        }
    }, [dispatchPending]);

    const syncToDrive = useCallback(
        (markdown: string, nodes: OrgNode[]) => {
            if (!driveConfigured) return;
            requestToken({ type: 'sync', markdown, nodes });
        },
        [driveConfigured, requestToken],
    );

    const loadFromDrive = useCallback(() => {
        if (!driveConfigured) return;
        requestToken({ type: 'load' });
    }, [driveConfigured, requestToken]);

    return {
        driveStatus: status,
        driveLastSynced: lastSynced,
        driveError: error,
        driveFileUrl: fileUrl,
        driveConfigured,
        syncToDrive,
        loadFromDrive,
    };
}
