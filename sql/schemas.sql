CREATE TYPE categories AS ENUM ('clothes', 'footwear', 'accessories', 'personal_items');

-- FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
  BEGIN
		NEW.updated_at := now();
		RETURN NEW;
	END;
$$ LANGUAGE plpgsql;


CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(30) NOT NULL,
	email VARCHAR(320) NOT NULL,
	birthday date,
	password VARCHAR (255) NOT NULL
);

CREATE TABLE packing_lists (
	id SERIAL PRIMARY KEY,
	name VARCHAR(30) NOT NULL,
	created_at TIMESTAMP DEFAULT current_timestamp,
	updated_at TIMESTAMP DEFAULT now()
);

-- CREATE OR REPLACE TRIGGER update
CREATE TRIGGER update_packing_lists_updated_at
	BEFORE UPDATE ON packing_lists
	FOR EACH ROW 
	EXECUTE FUNCTION 
	update_updated_at();


-- CREATE TRIPS TABLE TO SAVE THE WHOLE TRIP
CREATE TABLE trips (
	id SERIAL PRIMARY KEY,
	destination VARCHAR(30) NOT NULL,
	trip_date daterange,
	packing_list_id INT NOT NULL,
	user_id INT NOT NULL,
	created_at TIMESTAMP DEFAULT current_timestamp,
	updated_at TIMESTAMP DEFAULT now(),
	FOREIGN KEY (packing_list_id) REFERENCES packing_lists (id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- CREATE OR REPLACE TRIGGER update
CREATE TRIGGER update_trips_updated_at
	BEFORE UPDATE ON trips
	FOR EACH ROW
	EXECUTE FUNCTION
	update_updated_at();

CREATE TABLE packing_lists_items (
	id SERIAL PRIMARY KEY,
	packing_list_id INT NULL,
	activity_id INT NULL,
	name VARCHAR(30),
	category categories NOT NULL,
	quantity INT NULL,
	FOREIGN KEY (packing_list_id) REFERENCES packing_lists (id) ON DELETE SET NULL,
	FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE CASCADE
);

-- CERATE ACTIVITIES TABLE
CREATE TABLE activities (
	id SERIAL PRIMARY KEY,
	activity VARCHAR(30) NOT NULL
);

-- Junction table
CREATE TABLE trip_activities (
	trip_id INT  NOT NULL,
	activity_id INT NOT NULL,
	PRIMARY KEY (trip_id, activity_id),
	FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
	FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE CASCADE
);

-- CREATE category types
CREATE TYPE categories AS ENUM ('clothes', 'footwear', 'accessories', 'personal_items');