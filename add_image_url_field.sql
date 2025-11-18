-- Script SQL para adicionar o campo imageUrl à tabela benefit_cards
-- Execute este script no seu banco de dados MySQL se o campo ainda não existir

ALTER TABLE `benefit_cards` 
ADD COLUMN `imageUrl` TEXT NULL AFTER `iconName`;

-- Verificar se foi adicionado corretamente
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'primeiratroca' 
-- AND TABLE_NAME = 'benefit_cards' 
-- AND COLUMN_NAME = 'imageUrl';

