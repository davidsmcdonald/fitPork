CREATE TABLE reviews (
  id serial PRIMARY KEY,
  title text NOT NULL UNIQUE,
  artist text NOT NULL UNIQUE,
  username text NOT NULL
);

CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL
);
