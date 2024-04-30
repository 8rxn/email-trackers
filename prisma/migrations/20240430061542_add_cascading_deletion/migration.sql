-- DropForeignKey
ALTER TABLE "ScheduledEmails" DROP CONSTRAINT "ScheduledEmails_logsId_fkey";

-- DropForeignKey
ALTER TABLE "Tracker" DROP CONSTRAINT "Tracker_emailId_fkey";

-- AddForeignKey
ALTER TABLE "ScheduledEmails" ADD CONSTRAINT "ScheduledEmails_logsId_fkey" FOREIGN KEY ("logsId") REFERENCES "EmailLogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tracker" ADD CONSTRAINT "Tracker_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "EmailLogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
