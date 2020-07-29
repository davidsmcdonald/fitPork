const nextId = require("./next-id");
const Review = require("./review");

class ReviewList {
  constructor(title) {
    this.id = nextId();
    this.reviews = [];
  }

  add(review) {
    if (!(review instanceof Review)) {
      throw new TypeError("can only add Review objects");
    }

    this.reviews.push(review);
  }

  size() {
    return this.reviews.length;
  }

  itemAt(index) {
    this._validateIndex(index);
    return this.reviews[index];
  }

  shift() {
    return this.reviews.shift();
  }

  pop() {
    return this.reviews.pop();
  }

  removeAt(index) {
    this._validateIndex(index);
    return this.reviews.splice(index, 1);
  }

  forEach(callback) {
    this.reviews.forEach(todo => callback(review));
  }

  filter(callback) {
    let newList = new ReviewList(this.title);
    this.forEach(review => {
      if (callback(review)) {
        newList.add(review);
      }
    });

    return newList;
  }

  findByTitle(title) {
    return this.filter(review => review.title === title).first();
  }

  findById(id) {
    return this.filter(review => review.id === id).first();
  }

  findIndexOf(reviewToFind) {
    let findId = reviewToFind.id;
    return this.reviews.findIndex(review => review.id === findId);
  }

  allReviews() {
    return this.filter(_ => true);
  }

  toArray() {
    return this.reviews.slice();
  }

  setTitle(title) {
    this.title = title;
  }

  _validateIndex(index) { // _ in name indicates "private" method
    if (!(index in this.reviews)) {
      throw new ReferenceError(`invalid index: ${index}`);
    }
  }

  static makeReviewList(rawReviewList) {
    let reviewList = Object.assign(new ReviewList(), {
      id: rawReviewList.id,
      title: rawReviewList.title,
    });

    rawReviewList.reviews.forEach(review => reviewList.add(Review.makeReview(review)));
    return reviewList;
  }
}

module.exports = ReviewList;
