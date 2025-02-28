-- Postgres Schema
CREATE TYPE weather AS enum ('hot', 'warm', 'cold', 'wet');

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(30) NOT NULL,
	image_filepath TEXT,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	location VARCHAR(255)
);

CREATE TABLE clothing_items (
	id SERIAL PRIMARY KEY,
	name VARCHAR(30) NOT NULL,
	weather_condition weather NOT NULL,
	owner INT REFERENCES users(id) ON DELETE CASCADE,
	affiliate_link VARCHAR(2048),
	likes INT[],
	created_at TIMESTAMP DEFAULT current_timestamp,
	clothing_image TEXT NOT NULL
);

CREATE TABLE clothing_item_likes (
	clothing_item_id INT REFERENCES clothing_items(id) ON DELETE CASCADE,
	user_id INT REFERENCES users(id) ON DELETE CASCADE,
	created_at TIMESTAMP DEFAULT current_timestamp,
	PRIMARY KEY (clothing_item_id, user_id)
);

CREATE TABLE packing_lists (
	packing_list_id SERIAL PRIMARY KEY,
	name VARCHAR(50) NOT NULL,
	weather_condition weather NOT NULL,
	owner INT REFERENCES users(id) ON DELETE CASCADE,
	created_at TIMESTAMP DEFAULT current_timestamp,
	clothing_image TEXT NOT NULL
)