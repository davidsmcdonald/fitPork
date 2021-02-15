/* eslint-disable class-methods-use-this */
const bcrypt = require('bcrypt');
const { dbQuery } = require('./db-query');
const fs = require('fs');
const dataSql = fs.readFileSync('./lib/sample-data.sql').toString();

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  async uniqueUser(username) {
    const VALID_USERNAME = 'SELECT * FROM users WHERE username = $1';
    const result = await dbQuery(VALID_USERNAME, username);
    return result.rowCount === 0;
  }

  async addUser(username, password) {
    const NEW_USER = `INSERT INTO users (username, password)
                      VALUES ($1, $2)`

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const added = await dbQuery(NEW_USER, username, hash);
    return (added ? true : false);
  }

  async resetSample() {
    const DELETE_REVIEWS = `DELETE FROM reviews WHERE username = 'admin'`;

    const result = await dbQuery(DELETE_REVIEWS);
    const updated = await dbQuery(dataSql);

  }

  async authenticate(username, password) {
    const VALID_USER = 'SELECT * FROM users WHERE username = $1';

    if (username === 'admin') {
      this.resetSample();
    }

    const result = await dbQuery(VALID_USER, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

  async deleteReview(review_id) {
    const DELETE_REVIEW = `DELETE FROM reviews WHERE id = $1
                         AND username = $2`;

    const result = await dbQuery(DELETE_REVIEW, review_id, this.username);
    return result.rowCount > 0;
  }

  async createReview(title, artist, score, reviewText, detail, url) {
    const NEW_TODO = `INSERT INTO reviews (title, artist, score, review_text, cover_art, detail, username)
                      VALUES ($1, $2, $3, $4, $5, $6, $7)`;

    const result = await dbQuery(NEW_TODO, title, artist, score, reviewText, url, detail, this.username);
    return result.rowCount > 0;
  }

  async loadReview(review_id) {
    const FIND_REVIEW = 'SELECT * FROM reviews WHERE id = $1 AND username = $2;';

    const result = await dbQuery(FIND_REVIEW, review_id, this.username);
    return result.rows[0];
  }

  async loadReviews(search_term) {
    const FIND_REVIEWS = `SELECT * FROM reviews WHERE artist ILIKE '%'||$1||'%' OR title ILIKE '%'||$1||'%' AND username = $2`;

    const result = await dbQuery(FIND_REVIEWS, search_term, this.username);
    return result.rows;
  }

  async updateReview(reviewId, title, artist, score, reviewText, detail, url) {
    const EDIT_REVIEW = `UPDATE reviews SET title = $2, artist = $3,
                         score = $4, review_text = $5, detail = $6, cover_art = $7
                         WHERE id = $1 AND username = $8`;

    const result = await dbQuery(EDIT_REVIEW, reviewId, title, artist, score, reviewText, detail, url, this.username);
    return result.rowCount > 0;
  }

  async sortedReviews() {
    const REVIEWS = `SELECT * FROM reviews
                     WHERE username = $1
                     ORDER BY lower(artist) ASC`;

    const result = await dbQuery(REVIEWS, this.username);
    return result.rows;
  }
};
