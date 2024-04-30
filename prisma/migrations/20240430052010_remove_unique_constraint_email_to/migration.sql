-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'SENT');

-- CreateEnum
CREATE TYPE "TrackerType" AS ENUM ('OPEN', 'REPLY');

-- CreateTable
CREATE TABLE "ScheduledEmails" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "logsId" TEXT,

    CONSTRAINT "ScheduledEmails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLogs" (
    "id" TEXT NOT NULL,
    "emailTo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tracker" (
    "id" TEXT NOT NULL,
    "type" "TrackerType" NOT NULL,
    "emailId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tracker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledEmails_email_key" ON "ScheduledEmails"("email");

-- AddForeignKey
ALTER TABLE "ScheduledEmails" ADD CONSTRAINT "ScheduledEmails_logsId_fkey" FOREIGN KEY ("logsId") REFERENCES "EmailLogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tracker" ADD CONSTRAINT "Tracker_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "EmailLogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
