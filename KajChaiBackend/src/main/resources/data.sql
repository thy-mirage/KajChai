-- Initial data for KajChai application

-- Insert sample users (passwords are hashed for 'password123')
INSERT INTO users (id, username, email, password, role, created_at, updated_at, is_verified) VALUES 
(1, 'admin', 'admin@kajchai.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTL8rcht6l1IwjYoU6n/rjnq8VvjFzTa', 'ADMIN', NOW(), NOW(), true),
(2, 'testuser', 'test@kajchai.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTL8rcht6l1IwjYoU6n/rjnq8VvjFzTa', 'USER', NOW(), NOW(), true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (id, name, description, created_at) VALUES 
(1, 'Technology', 'All about technology and programming', NOW()),
(2, 'Health', 'Health and wellness topics', NOW()),
(3, 'Education', 'Educational content and discussions', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (id, title, content, author_id, category_id, created_at, updated_at, is_approved) VALUES 
(1, 'Welcome to KajChai!', 'This is a sample welcome post to get you started with our platform.', 1, 1, NOW(), NOW(), true),
(2, 'How to use the chat feature?', 'Learn how to use our real-time chat feature effectively.', 2, 1, NOW(), NOW(), true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequences to start from the next available ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts));