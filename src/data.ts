import type { OrgNode } from './types';

let _uid = 300;
export const genId = () => `node_${_uid++}`;

function d(iso: string) { return new Date(iso).getTime(); }

export const INITIAL_NODES: OrgNode[] = [
  { id: 'n1',  level: 1, title: 'Work Projects',                    state: null,      tags: ['work'],     collapsed: false, priority: null, createdAt: d('2026-01-03T09:00') },
  { id: 'n2',  level: 2, title: 'Project Alpha',                    state: 'TODO',    tags: ['alpha'],    collapsed: false, priority: 'A',  createdAt: d('2026-01-05T10:15') },
  { id: 'n3',  level: 3, title: 'Write technical specifications',   state: 'TODO',    tags: [],           collapsed: false, priority: null, createdAt: d('2026-01-06T11:00') },
  { id: 'n4',  level: 3, title: 'Set up repository and CI/CD',      state: 'DONE',    tags: [],           collapsed: false, priority: null, createdAt: d('2026-01-06T11:30') },
  { id: 'n5',  level: 3, title: 'Implement core features',          state: 'DOING',   tags: ['dev'],      collapsed: false, priority: null, createdAt: d('2026-01-10T09:00') },
  { id: 'n6',  level: 3, title: 'Write unit and integration tests', state: 'TODO',    tags: ['dev'],      collapsed: false, priority: null, createdAt: d('2026-01-10T09:05') },
  { id: 'n7',  level: 3, title: 'Code review and QA pass',          state: 'WAITING', tags: [],           collapsed: false, priority: null, createdAt: d('2026-01-10T09:10') },
  { id: 'n8',  level: 2, title: 'Project Beta',                     state: 'DOING',   tags: ['beta'],     collapsed: false, priority: null, createdAt: d('2026-01-12T14:00') },
  { id: 'n9',  level: 3, title: 'Review design documents',          state: 'DONE',    tags: [],           collapsed: false, priority: null, createdAt: d('2026-01-13T10:00') },
  { id: 'n10', level: 3, title: 'Schedule kickoff meeting',         state: 'TODO',    tags: [],           collapsed: false, priority: 'B',  createdAt: d('2026-01-13T10:30') },
  { id: 'n11', level: 3, title: 'Update project roadmap',           state: 'TODO',    tags: [],           collapsed: false, priority: null, createdAt: d('2026-01-14T08:45') },
  { id: 'n12', level: 2, title: 'Administrative',                   state: null,      tags: [],           collapsed: false, priority: null, createdAt: d('2026-01-15T09:00') },
  { id: 'n13', level: 3, title: 'Prepare Q2 status report',         state: 'TODO',    tags: ['report'],   collapsed: false, priority: 'A',  createdAt: d('2026-02-01T09:00') },
  { id: 'n14', level: 3, title: 'Expense reports for March',        state: 'DONE',    tags: [],           collapsed: false, priority: null, createdAt: d('2026-02-03T11:00') },
  { id: 'n15', level: 1, title: 'Personal',                         state: null,      tags: ['personal'], collapsed: false, priority: null, createdAt: d('2026-01-03T09:05') },
  { id: 'n16', level: 2, title: 'Health & Fitness',                 state: null,      tags: [],           collapsed: false, priority: null, createdAt: d('2026-01-04T07:30') },
  { id: 'n17', level: 3, title: 'Morning run 3x per week',          state: 'DOING',   tags: ['exercise'], collapsed: false, priority: null, createdAt: d('2026-01-04T07:35') },
  { id: 'n18', level: 3, title: 'Gym sessions (Mon/Wed/Fri)',       state: 'TODO',    tags: ['exercise'], collapsed: false, priority: null, createdAt: d('2026-01-04T07:40') },
  { id: 'n19', level: 3, title: 'Annual physical checkup',          state: 'TODO',    tags: [],           collapsed: false, priority: 'B',  createdAt: d('2026-02-10T12:00') },
  { id: 'n20', level: 2, title: 'Learning',                         state: null,      tags: ['learn'],    collapsed: false, priority: null, createdAt: d('2026-01-06T20:00') },
  { id: 'n21', level: 3, title: 'Read "Thinking, Fast and Slow"',   state: 'DOING',   tags: ['books'],    collapsed: false, priority: null, createdAt: d('2026-01-07T21:00') },
  { id: 'n22', level: 3, title: 'Complete TypeScript deep-dive',    state: 'DONE',    tags: ['dev'],      collapsed: false, priority: null, createdAt: d('2026-01-08T19:00') },
  { id: 'n23', level: 3, title: 'Study Emacs Lisp',                 state: 'DOING',   tags: ['emacs'],    collapsed: false, priority: 'B',  createdAt: d('2026-01-20T20:30') },
  { id: 'n24', level: 3, title: 'Learn Rust programming language',  state: 'TODO',    tags: ['dev'],      collapsed: false, priority: null, createdAt: d('2026-02-15T19:00') },
  { id: 'n25', level: 2, title: 'Side Projects',                    state: null,      tags: [],           collapsed: false, priority: null, createdAt: d('2026-01-10T22:00') },
  { id: 'n26', level: 3, title: 'Org-mode clone in React',          state: 'DOING',   tags: ['dev'],      collapsed: false, priority: 'A',  createdAt: d('2026-01-11T10:00') },
  { id: 'n27', level: 3, title: 'Personal website redesign',        state: 'TODO',    tags: ['design'],   collapsed: false, priority: null, createdAt: d('2026-02-20T18:00') },
  { id: 'n28', level: 1, title: 'Home',                             state: null,      tags: ['home'],     collapsed: false, priority: null, createdAt: d('2026-01-03T09:10') },
  { id: 'n29', level: 2, title: 'Fix leaking bathroom faucet',      state: 'TODO',    tags: [],           collapsed: false, priority: 'A',  createdAt: d('2026-03-01T08:00') },
  { id: 'n30', level: 2, title: 'Order groceries',                  state: 'DONE',    tags: [],           collapsed: false, priority: null, createdAt: d('2026-03-15T10:00') },
  { id: 'n31', level: 2, title: 'Schedule dentist appointment',     state: 'TODO',    tags: [],           collapsed: false, priority: null, createdAt: d('2026-03-20T09:00') },
  { id: 'n32', level: 2, title: 'Clean and organize garage',        state: 'TODO',    tags: [],           collapsed: false, priority: 'C',  createdAt: d('2026-03-22T11:00') },
];
