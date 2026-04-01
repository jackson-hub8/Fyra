-- AlterTable
ALTER TABLE `private_questionnaire` ADD COLUMN `classStanding` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `match_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fromEmail` VARCHAR(255) NOT NULL,
    `toEmail` VARCHAR(255) NOT NULL,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `match_requests_fromEmail_idx`(`fromEmail`),
    INDEX `match_requests_toEmail_idx`(`toEmail`),
    UNIQUE INDEX `match_requests_fromEmail_toEmail_key`(`fromEmail`, `toEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `match_requests` ADD CONSTRAINT `match_requests_fromEmail_fkey` FOREIGN KEY (`fromEmail`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_requests` ADD CONSTRAINT `match_requests_toEmail_fkey` FOREIGN KEY (`toEmail`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;
