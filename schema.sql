CREATE TABLE reviews (
  id serial PRIMARY KEY,
  title text NOT NULL,
  artist text NOT NULL,
  username text NOT NULL,
  score integer,
  review_text text,
  cover_art text DEFAULT 'https://www.pngkey.com/png/full/402-4029485_phonograph-record-lp-record-phonograph-cylinder-gramophone-vinyl.png'
);

CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL
);
