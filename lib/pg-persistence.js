/* eslint-disable class-methods-use-this */
const bcrypt = require('bcrypt');
const { dbQuery } = require('./db-query');

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  async authenticate(username, password) {
    const VALID_USER = 'SELECT * FROM users WHERE username = $1';

    const result = await dbQuery(VALID_USER, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

  // Returns `true` if `error` seems to indicate a `UNIQUE` constraint
  // violation, `false` otherwise.
  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  // Delete a todo from the specified todo list. Returns a promise that resolves
  // to `true` on success, `false` on failure.
  async deleteReview(review_id) {
    const DELETE_REVIEW = `DELETE FROM review WHERE review_id = $1
                         AND username = $2`;

    const result = await dbQuery(DELETE_REVIEW, review_id, this.username);
    return result.rowCount > 0;
  }

  async createReview(title, artist, score, reviewText, url) {
    const NEW_TODO = `INSERT INTO reviews (title, artist, score, review_text, cover_art, username)
                      VALUES ($1, $2, $3, $4, $5, $6)`;

    const result = await dbQuery(NEW_TODO, title, artist, score, reviewText, url, this.username);
    return result.rowCount > 0;
  }

  // Returns a copy of the indicated todo in the indicated todo list. Returns
  // `undefined` if either the todo list or the todo is not found. Note that
  // both IDs must be numeric.
  async loadReview(review_id) {
    const FIND_REVIEW = 'SELECT * FROM reviews WHERE id = $1 AND username = $2;';

    const result = await dbQuery(FIND_REVIEW, review_id, this.username);
    return result.rows[0];
  }

  // Toggle a todo between the done and not done state. Returns a promise that
  // resolves to `true` on success, `false` if the todo list or todo doesn't
  // exist. The id arguments must both be numeric.

  async updateReview(reviewId, title, artist, score, reviewText, url) {
    const EDIT_REVIEW = `UPDATE reviews SET title = $2, artist = $3,
                         score = $4, review_text = $5, cover_art = $6
                         WHERE id = $1 AND username = $7`;

    const result = await dbQuery(EDIT_REVIEW, reviewId, title, artist, score, reviewText, url, this.username);
    return result.rowCount > 0;
  }

  // Returns `true` if a todo list with the specified title exists in the list
  // of todo lists, `false` otherwise.
  async existsTodoListTitle(title) {
    const ALL_LISTS = `SELECT * FROM todolists WHERE lower(title) = $1
                       AND username = ${this.username}`;

    const result = await dbQuery(ALL_LISTS, title);
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
