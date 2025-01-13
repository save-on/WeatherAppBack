create TABLE users (
	id int auto_increment primary key,
	name varchar(30) not null,
	image_filepath varchar(2083),
	email varchar(255) not null unique,
	password varchar(255) not null,
	location varchar(255),
	allow_location bool not null
);

create table clothing_items (
	id int auto_increment primary key,
	name varchar(30) not null,
	weather_condition enum('hot', 'warm', 'cold', 'rainy') not null,
	owner int,
	affiliate_link varchar(2048),
	isLiked bool,
	created_at timestamp default current_timestamp, 
	clothingimage_filepath varchar(2083) not null,
	foreign key (owner) references users(id)
);