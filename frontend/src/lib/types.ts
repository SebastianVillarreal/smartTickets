export type Role = 'ADMIN' | 'MANAGER' | 'REPORTER' | 'DEVELOPER';
export type TicketType = 'BUG' | 'SUPPORT' | 'FEATURE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Severity = 'S1' | 'S2' | 'S3' | 'S4';
export type TicketStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'BLOCKED' | 'READY_FOR_QA' | 'DONE' | 'CANCELLED';
export type SubtaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
};

export type SystemItem = {
  id: string;
  key: string;
  name: string;
  description: string;
  ownerTeam: string;
  _count?: { tickets: number };
};

export type Attachment = {
  id: string;
  ticketId: string;
  commentId?: string | null;
  uploadedByUserId: string;
  roleContext: 'REPORTER' | 'RESOLVER';
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  uploadedByUser?: Pick<User, 'id' | 'name' | 'role'>;
};

export type TicketComment = {
  id: string;
  ticketId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
  authorUser: Pick<User, 'id' | 'name' | 'role'>;
  attachments: Attachment[];
};

export type SubtaskComment = {
  id: string;
  subtaskId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
  authorUser: Pick<User, 'id' | 'name' | 'role'>;
};

export type Subtask = {
  id: string;
  ticketId: string;
  title: string;
  description?: string | null;
  status: SubtaskStatus;
  effortHours?: number | null;
  createdByUserId: string;
  assignedToUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser?: Pick<User, 'id' | 'name' | 'role'>;
  assignedToUser?: Pick<User, 'id' | 'name' | 'role'> | null;
  comments?: SubtaskComment[];
};

export type Ticket = {
  id: string;
  code: string;
  type: TicketType;
  title: string;
  description: string;
  priority: Priority;
  severity?: Severity | null;
  status: TicketStatus;
  systemId: string;
  createdByUserId: string;
  assignedToUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  triagedAt?: string | null;
  startedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  tags: string[];
  environment: 'DEV' | 'QA' | 'PROD';
  reproducible: boolean;
  stepsToReproduce?: string | null;
  expectedResult?: string | null;
  actualResult?: string | null;
  rootCause?: string | null;
  resolutionSummary?: string | null;
  blockedReason?: string | null;
  system?: SystemItem;
  createdByUser?: User;
  assignedToUser?: User | null;
  comments?: TicketComment[];
  attachments?: Attachment[];
  subtasks?: Subtask[];
  subtasksHours?: number;
  _count?: { comments: number; attachments: number };
};
