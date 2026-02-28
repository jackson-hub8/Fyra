-- CreateTable
CREATE TABLE `user_profile_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userEmail` VARCHAR(255) NOT NULL,
    `blobUrl` VARCHAR(2048) NOT NULL,
    `blobPathname` VARCHAR(512) NOT NULL,
    `contentType` VARCHAR(100) NULL,
    `sizeBytes` INTEGER NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` TIMESTAMP(6) NOT NULL,

    UNIQUE INDEX `user_profile_photos_userEmail_key`(`userEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_profile_photos` ADD CONSTRAINT `user_profile_photos_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `user_profiles`(`userEmail`) ON DELETE CASCADE ON UPDATE CASCADE;
