export type TodoState = 'TODO' | 'DONE' | 'DOING' | 'WAITING' | null;
export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | null;
export type Severity = 'S0' | 'S1' | 'S2' | 'S3' | null;

export interface OrgNode {
    id: string;
    level: number;
    title: string;
    state: TodoState;
    tags: string[];
    collapsed: boolean;
    priority: Priority;
    severity: Severity;
    createdAt?: number;
}

export interface GuideInfo {
    guides: boolean[];
    isLastSibling: boolean;
}

export interface FilterState {
    states: TodoState[];
    priorities: Priority[];
    severities: Severity[];
    tags: string[];
    datePreset: 'today' | 'week' | 'month' | null;
    hideDone: boolean;
}
