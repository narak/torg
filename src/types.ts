export type TodoState = 'TODO' | 'DONE' | 'DOING' | 'WAITING' | null;
export type Priority  = 'A' | 'B' | 'C' | null;

export interface OrgNode {
  id: string;
  level: number;
  title: string;
  state: TodoState;
  tags: string[];
  collapsed: boolean;
  priority: Priority;
  createdAt?: number;
}

export interface GuideInfo {
  guides: boolean[];
  isLastSibling: boolean;
}

export interface FilterState {
  states: TodoState[];
  tags: string[];
  datePreset: 'today' | 'week' | 'month' | null;
}
