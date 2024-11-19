CREATE TABLE `ol_authors`(
	`key` TEXT NOT NULL,
	`name` TEXT
);

CREATE TABLE `ol_work_authors`(
	`work_key` TEXT NOT NULL,
	`author_key` TEXT NOT NULL
);

CREATE TABLE `ol_works`(
	`key` TEXT NOT NULL,
	`rating` REAL
);

CREATE TABLE `ol_editions_isbn_10` (
    `edition_key` TEXT NOT NULL,
    `isbn_10` TEXT NOT NULL
);

CREATE TABLE `ol_editions_isbn_13` (
    `edition_key` TEXT NOT NULL,
    `isbn_13` TEXT NOT NULL
);

CREATE TABLE `ol_editions`(
	`key` TEXT NOT NULL,
	`title` TEXT,
	`number_of_pages` INTEGER,
	`work_key` TEXT
);
