-- AlterTable: backfill updatedAt from createdAt for existing rows via default
ALTER TABLE `swipe_actions` ADD COLUMN `updatedAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6);

-- AlterTable
ALTER TABLE `users` ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `possible_matches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userEmail1` VARCHAR(255) NOT NULL,
    `userEmail2` VARCHAR(255) NOT NULL,
    `similarityScore` DOUBLE NOT NULL,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `possible_matches_userEmail1_idx`(`userEmail1`),
    INDEX `possible_matches_userEmail2_idx`(`userEmail2`),
    UNIQUE INDEX `possible_matches_userEmail1_userEmail2_key`(`userEmail1`, `userEmail2`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `possible_matches` ADD CONSTRAINT `possible_matches_userEmail1_fkey` FOREIGN KEY (`userEmail1`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `possible_matches` ADD CONSTRAINT `possible_matches_userEmail2_fkey` FOREIGN KEY (`userEmail2`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;
