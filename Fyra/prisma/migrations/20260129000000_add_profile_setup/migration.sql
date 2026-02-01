-- AlterTable
ALTER TABLE `users` ADD COLUMN `profileSetupComplete` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `user_profiles` ADD COLUMN `topInterests` TEXT NULL, ADD COLUMN `dailyLife` TEXT NULL;

-- CreateTable
CREATE TABLE `private_questionnaire` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userEmail` VARCHAR(255) NOT NULL,
    `gender` VARCHAR(100) NULL,
    `adaAccommodations` VARCHAR(50) NULL,
    `cellPhoneProvider` VARCHAR(100) NULL,
    `cellPhoneNumber` VARCHAR(20) NULL,
    `animalAllergies` TEXT NULL,
    `varsitySport` VARCHAR(100) NULL,
    `smoking` VARCHAR(50) NULL,
    `alcohol` VARCHAR(50) NULL,
    `roomTemp` VARCHAR(50) NULL,
    `bedroomDescription` TEXT NULL,
    `sleepType` VARCHAR(100) NULL,
    `weekdayBedtime` VARCHAR(50) NULL,
    `freeTime` TEXT NULL,
    `campusActivity` VARCHAR(100) NULL,
    `visitorFrequency` VARCHAR(50) NULL,
    `weekendHomeFrequency` VARCHAR(50) NULL,
    `firstClassTime` VARCHAR(50) NULL,
    `musicPreference` VARCHAR(100) NULL,
    `politicalViews` VARCHAR(100) NULL,
    `religion` VARCHAR(100) NULL,
    `studyEnvironment` VARCHAR(100) NULL,
    `intendedMajor` VARCHAR(100) NULL,
    `vehicleToCampus` VARCHAR(50) NULL,

    UNIQUE INDEX `private_questionnaire_userEmail_key`(`userEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `private_questionnaire` ADD CONSTRAINT `private_questionnaire_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;
