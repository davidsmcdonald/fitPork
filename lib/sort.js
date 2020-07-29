const compareByTitle = (itemA, itemB) => {
  const titleA = itemA.title.toLowerCase();
  const titleB = itemB.title.toLowerCase();

  if (titleA < titleB) {
    return -1;
  }
  if (titleA > titleB) {
    return 1;
  }
  return 0;
};

module.exports = {
  // sort a list of reviews
  sortReviews(reviews) {
    // return reviews.sort(compareByTitle);
    return reviews;
  },
};
