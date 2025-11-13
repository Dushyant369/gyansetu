-- Make question content field optional
-- This allows questions to be created with just a title

ALTER TABLE questions 
ALTER COLUMN content DROP NOT NULL;

