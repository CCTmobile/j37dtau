-- Insert sample products with Supabase Storage image URLs
INSERT INTO public.products (name, description, price, category, images, image_url) VALUES
('Summer Floral Dress', 'A beautiful floral dress perfect for summer outings', 59.99, 'Dresses',
  ARRAY['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd29tZW4lMjBmbG9yYWwlMjBkcmVzc3xlbnwxfHx8fDE3NTU4MDQ4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd29tZW4lMjBmbG9yYWwlMjBkcmVzc3xlbnwxfHx8fDE3NTU4MDQ4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
('Casual Denim Jacket', 'Stylish denim jacket for casual wear', 79.99, 'Outwear',
  ARRAY['https://images.unsplash.com/photo-1544022613-e87ca75a784a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZGVuaW0lMjBqYWNrZXR8ZW58MXx8fHwxNzU1ODA0ODYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
  'https://images.unsplash.com/photo-1544022613-e87ca75a784a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZGVuaW0lMjBqYWNrZXR8ZW58MXx8fHwxNzU1ODA0ODYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
('Elegant Evening Gown', 'Elegant gown for special occasions', 129.99, 'Party',
  ARRAY['https://images.unsplash.com/photo-1566479179815-d6b91c60b846?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd29tZW4lMjBldmVuaW5nJTIwZ293bnxlbnwxfHx8fDE3NTU4MDQ4NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
  'https://images.unsplash.com/photo-1566479179815-d6b91c60b846?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd29tZW4lMjBldmVuaW5nJTIwZ293bnxlbnwxfHx8fDE3NTU4MDQ4NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
('Leather Ankle Boots', 'Comfortable leather ankle boots for everyday wear', 89.99, 'Shoes',
  ARRAY['https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc2hvZXMlMjBib290c3xlbnwxfHx8fDE3NTU4MDQ4NjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
  'https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc2hvZXMlMjBib290c3xlbnwxfHx8fDE3NTU4MDQ4NjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
('Statement Necklace', 'Bold statement necklace to elevate any outfit', 29.99, 'Accessories',
  ARRAY['https://images.unsplash.com/photo-1535630278352-8b3eb041eba8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwYWNjZXNzb3JpZXMlMjBuZWNrbGFjZXxlbnwxfHx8fDE3NTU4MDQ4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
  'https://images.unsplash.com/photo-1535630278352-8b3eb041eba8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwYWNjZXNzb3JpZXMlMjBuZWNrbGFjZXxlbnwxfHx8fDE3NTU4MDQ4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral');

-- How to create an Admin User:
-- 1. Run the application locally.
-- 2. Use the "Sign Up" form to create a new user with the email 'tynoedev@gmail.com' and a password of your choice.
-- 3. The system is configured to automatically assign the 'admin' role to this specific email address upon sign-up.
--
-- DO NOT insert the admin user directly into the 'users' table. 
-- The authentication record must be created through Supabase Auth.
-- The old, incorrect INSERT statement has been removed from this file.
