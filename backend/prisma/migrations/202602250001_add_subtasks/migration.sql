CREATE TYPE "SubtaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE');

CREATE TABLE "Subtask" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "SubtaskStatus" NOT NULL DEFAULT 'TODO',
  "effortHours" DOUBLE PRECISION,
  "createdByUserId" TEXT NOT NULL,
  "assignedToUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubtaskComment" (
  "id" TEXT NOT NULL,
  "subtaskId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SubtaskComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Subtask_ticketId_idx" ON "Subtask"("ticketId");
CREATE INDEX "Subtask_assignedToUserId_idx" ON "Subtask"("assignedToUserId");
CREATE INDEX "Subtask_status_idx" ON "Subtask"("status");

CREATE INDEX "SubtaskComment_subtaskId_createdAt_idx" ON "SubtaskComment"("subtaskId", "createdAt");

ALTER TABLE "Subtask"
  ADD CONSTRAINT "Subtask_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Subtask"
  ADD CONSTRAINT "Subtask_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Subtask"
  ADD CONSTRAINT "Subtask_assignedToUserId_fkey"
  FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SubtaskComment"
  ADD CONSTRAINT "SubtaskComment_subtaskId_fkey"
  FOREIGN KEY ("subtaskId") REFERENCES "Subtask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubtaskComment"
  ADD CONSTRAINT "SubtaskComment_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
