-- CreateTable
CREATE TABLE `swipe_actions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `swiperEmail` VARCHAR(255) NOT NULL,
    `targetEmail` VARCHAR(255) NOT NULL,
    `action` VARCHAR(10) NOT NULL,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `swipe_actions_swiperEmail_idx`(`swiperEmail`),
    INDEX `swipe_actions_targetEmail_idx`(`targetEmail`),
    UNIQUE INDEX `swipe_actions_swiperEmail_targetEmail_key`(`swiperEmail`, `targetEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matchId` INTEGER NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `dueDate` VARCHAR(10) NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `chores_matchId_idx`(`matchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chores` ADD CONSTRAINT `chores_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
