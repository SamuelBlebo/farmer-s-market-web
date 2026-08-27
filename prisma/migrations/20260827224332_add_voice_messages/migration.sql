-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'VOICE');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "audioDurationSec" INTEGER,
ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';
