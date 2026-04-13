-- AlterTable
ALTER TABLE `swipe_actions` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `profile_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporterEmail` VARCHAR(255) NOT NULL,
    `reportedEmail` VARCHAR(255) NOT NULL,
    `reason` VARCHAR(50) NOT NULL,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `profile_reports_reportedEmail_idx`(`reportedEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profile_reports` ADD CONSTRAINT `profile_reports_reporterEmail_fkey` FOREIGN KEY (`reporterEmail`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_reports` ADD CONSTRAINT `profile_reports_reportedEmail_fkey` FOREIGN KEY (`reportedEmail`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;
