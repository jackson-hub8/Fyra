-- CreateTable
CREATE TABLE `users` (
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userEmail` VARCHAR(255) NOT NULL,
    `profilePicture` VARCHAR(500) NULL,
    `bio` TEXT NULL,
    `major` VARCHAR(100) NULL,
    `graduationYear` INTEGER NULL,
    `gender` VARCHAR(50) NULL,
    `pronouns` VARCHAR(50) NULL,
    `dietaryRestrictions` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `user_profiles_userEmail_key`(`userEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `public_preferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userEmail` VARCHAR(255) NOT NULL,
    `sleepSchedule` VARCHAR(100) NULL,
    `cleanliness` VARCHAR(50) NULL,
    `noiseLevel` VARCHAR(50) NULL,
    `guestsFrequency` VARCHAR(50) NULL,
    `socialLevel` VARCHAR(50) NULL,

    UNIQUE INDEX `public_preferences_userEmail_key`(`userEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `private_preferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userEmail` VARCHAR(255) NOT NULL,
    `religiousPreference` VARCHAR(100) NULL,
    `politicalLeaning` VARCHAR(100) NULL,
    `dealBreakers` TEXT NULL,
    `drinking` VARCHAR(50) NULL,
    `smoking` VARCHAR(50) NULL,

    UNIQUE INDEX `private_preferences_userEmail_key`(`userEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pet_peeves` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userEmail` VARCHAR(255) NOT NULL,
    `petPeeve` VARCHAR(255) NOT NULL,
    `severity` VARCHAR(50) NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userEmail1` VARCHAR(255) NOT NULL,
    `userEmail2` VARCHAR(255) NOT NULL,
    `matchScore` DOUBLE NULL,
    `status` VARCHAR(50) NOT NULL,
    `matchedAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `matches_userEmail1_idx`(`userEmail1`),
    INDEX `matches_userEmail2_idx`(`userEmail2`),
    UNIQUE INDEX `matches_userEmail1_userEmail2_key`(`userEmail1`, `userEmail2`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `public_preferences` ADD CONSTRAINT `public_preferences_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `private_preferences` ADD CONSTRAINT `private_preferences_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pet_peeves` ADD CONSTRAINT `pet_peeves_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_userEmail1_fkey` FOREIGN KEY (`userEmail1`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_userEmail2_fkey` FOREIGN KEY (`userEmail2`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;
