// Google Drive REST API helpers.
// Requires an OAuth2 access token with scope: drive.file

import type { OrgNode } from '../types';

const FOLDER_NAME = 'Torg';
const FILE_NAME = 'TASKS.md';
const DATA_FILE_NAME = 'TASKS.json';

export interface DriveSyncResult {
    fileId: string;
    webViewLink: string;
}

async function driveJson<T>(
    method: string,
    url: string,
    token: string,
    body?: string,
    contentType?: string,
): Promise<T> {
    const res = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(contentType ? { 'Content-Type': contentType } : {}),
        },
        ...(body !== undefined ? { body } : {}),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => res.status.toString());
        throw new Error(`Drive API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
}

async function getOrCreateFolder(token: string): Promise<string> {
    const q = encodeURIComponent(
        `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    );
    const list = await driveJson<{ files: { id: string }[] }>(
        'GET',
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
        token,
    );
    if (list.files.length > 0) return list.files[0].id;

    const folder = await driveJson<{ id: string }>(
        'POST',
        'https://www.googleapis.com/drive/v3/files?fields=id',
        token,
        JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
        'application/json',
    );
    return folder.id;
}

async function findFile(token: string, folderId: string, name = FILE_NAME): Promise<string | null> {
    const q = encodeURIComponent(
        `name='${name}' and '${folderId}' in parents and trashed=false`,
    );
    const list = await driveJson<{ files: { id: string }[] }>(
        'GET',
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
        token,
    );
    return list.files.length > 0 ? list.files[0].id : null;
}

async function readTextFile(token: string, fileId: string): Promise<string> {
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`Drive API ${res.status}`);
    return res.text();
}

async function uploadFile(
    token: string,
    folderId: string,
    fileId: string | null,
    name: string,
    content: string,
    mimeType = 'text/plain; charset=UTF-8',
): Promise<{ id: string; webViewLink: string }> {
    if (fileId) {
        return driveJson<{ id: string; webViewLink: string }>(
            'PATCH',
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=id,webViewLink`,
            token,
            content,
            mimeType,
        );
    }

    const boundary = 'torg_mp_boundary';
    const body = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify({ name, parents: [folderId] }),
        `--${boundary}`,
        `Content-Type: ${mimeType}`,
        '',
        content,
        `--${boundary}--`,
    ].join('\r\n');

    return driveJson<{ id: string; webViewLink: string }>(
        'POST',
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink`,
        token,
        body,
        `multipart/related; boundary=${boundary}`,
    );
}

async function setPublicReadable(token: string, fileId: string): Promise<void> {
    // Idempotent — ignore errors (permission may already exist)
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'anyone', role: 'reader' }),
    }).catch(() => {});
}

export async function syncToDrive(
    token: string,
    markdown: string,
    nodes: OrgNode[],
): Promise<DriveSyncResult> {
    const folderId = await getOrCreateFolder(token);

    // Write human-readable markdown (public)
    const mdFileId = await findFile(token, folderId, FILE_NAME);
    const mdFile = await uploadFile(token, folderId, mdFileId, FILE_NAME, markdown);
    await setPublicReadable(token, mdFile.id);

    // Write full JSON data (for round-trip load)
    const jsonFileId = await findFile(token, folderId, DATA_FILE_NAME);
    await uploadFile(
        token, folderId, jsonFileId, DATA_FILE_NAME,
        JSON.stringify(nodes),
        'application/json; charset=UTF-8',
    );

    return { fileId: mdFile.id, webViewLink: mdFile.webViewLink };
}

export async function loadFromDrive(token: string): Promise<OrgNode[] | null> {
    const q = encodeURIComponent(
        `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    );
    const folderList = await driveJson<{ files: { id: string }[] }>(
        'GET',
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
        token,
    );
    if (folderList.files.length === 0) return null;
    const folderId = folderList.files[0].id;

    const fileId = await findFile(token, folderId, DATA_FILE_NAME);
    if (!fileId) return null;

    const text = await readTextFile(token, fileId);
    return JSON.parse(text) as OrgNode[];
}

/** @deprecated use syncToDrive */
export async function syncMarkdownToDrive(token: string, markdown: string): Promise<DriveSyncResult> {
    const folderId = await getOrCreateFolder(token);
    const fileId = await findFile(token, folderId, FILE_NAME);
    const file = await uploadFile(token, folderId, fileId, FILE_NAME, markdown);
    await setPublicReadable(token, file.id);
    return { fileId: file.id, webViewLink: file.webViewLink };
}
