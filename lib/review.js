const nextId = require("./next-id");

class Review {
  constructor(title, cover, year, label, score) {
    this.id = nextId();
    this.title = title;
    this.cover = cover;
    this.year = year;
    this.label = label;
    this.score = score;
  }

  setCover(link) {
    this.cover = link;
  }

  setScore(score) {
    this.score = score;
  }

  setTitle(title) {
    this.title = title;
  }

  static makeReview(rawReview) {
    return Object.assign(new Review(), rawReview);
  }
}

module.exports = Review;
