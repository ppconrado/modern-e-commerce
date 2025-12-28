-- Update existing users with hashed passwords
UPDATE "User" 
SET password = '$2b$10$n.BE3xh6DydWs3WSxby/jOaslY8U/tyHrRwcZaGqkohADURaAUa8y', 
    role = 'ADMIN' 
WHERE email = 'john@example.com';

UPDATE "User" 
SET password = '$2b$10$n.BE3xh6DydWs3WSxby/jOaslY8U/tyHrRwcZaGqkohADURaAUa8y', 
    role = 'CUSTOMER' 
WHERE email = 'jane@example.com';

UPDATE "User" 
SET password = '$2b$10$n.BE3xh6DydWs3WSxby/jOaslY8U/tyHrRwcZaGqkohADURaAUa8y', 
    role = 'CUSTOMER' 
WHERE email = 'ppconrado@yahoo.com.br';
