const express = require('express');
const morgan = require('morgan');
const flash = require('express-flash');
const session = require('express-session');
const { body, validationResult } = require('express-validator');
const store = require('connect-loki');
const PgPersistence = require('./lib/pg-persistence');
const catchError = require('./lib/catch-error');

const app = express();
const host = 'localhost';
const port = 3001;
const LokiStore = store(session);

app.set('views', './views');
app.set('view engine', 'pug');

app.use(morgan('common'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: '/',
    secure: false,
  },
  name: 'fit-pork-session-id',
  resave: false,
  saveUninitialized: true,
  secret: 'the big secret',
  store: new LokiStore({}),
}));

app.use(flash());

// Set up persistent session data
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

const requiresAuthentication = (req, res, next) => {
  if (!res.locals.signedIn) {
    res.redirect(302, '/users/signin');
  } else {
    next();
  }
};

// Redirect start page
app.get('/', (req, res) => {
  res.redirect('/reviews');
});

// Render the list of reviews
app.get('/reviews',
  requiresAuthentication,
  catchError(async (req, res) => {
    if (!res.locals.signedIn) res.redirect('/users/signin');
    const reviewList = await res.locals.store.sortedReviews();

    res.render('reviews', {
      reviewList,
    });
  }));

app.get('/users/signin', (req, res) => {
  req.flash('info', 'Please sign in.');
  res.render('signin', {
    flash: req.flash(),
  });
});

app.post('/users/signin',
  catchError(async (req, res) => {
    const username = req.body.username.trim();
    const { password } = req.body;

    const validUser = await res.locals.store.authenticate(username, password);
    if (!validUser) {
      req.flash('error', 'Invalid credentials.');
      res.render('signin', {
        flash: req.flash(),
        username: req.body.username,
      });
    } else {
      req.session.username = username;
      req.session.signedIn = true;
      req.flash('info', 'Welcome!');
      res.redirect('/reviews');
    }
  }));

app.post('/users/signout', (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.redirect('/users/signin');
});

// Render new review page
app.get('/reviews/new',
  requiresAuthentication,
  (req, res) => {
    res.render('new-review');
  });

// Create a new review
app.post('/review',
  requiresAuthentication,
  [
    body('title')
      .trim()
      .isLength({ min: 1 })
      .withMessage('The list title is required.')
      .isLength({ max: 100 })
      .withMessage('List title must be between 1 and 100 characters.')
  ],
  catchError(async (req, res) => {
    const errors = validationResult(req);
    const { title, artist } = req.body;

    const rerenderNewList = () => {
      res.render('new-review', {
        title,
        artist,
        flash: req.flash(),
      });
    };

    if (!errors.isEmpty()) {
      errors.array().forEach((message) => req.flash('error', message.msg));
      rerenderNewList();
    } else {
      const created = await res.locals.store.createReview(title, artist);
      if (!created) {
        req.flash('error', 'The review title must be unique.');
        rerenderNewList();
      } else {
        req.flash('success', 'The todo list has been created.');
        res.redirect('/lists');
      }
    }
  }));

// Render a single review
app.get('/reviews/:reviewId',
  requiresAuthentication,
  catchError(async (req, res) => {
    const { reviewId } = req.params;
    const review = await res.locals.store.loadReview(+reviewId);
    if (review === undefined) throw new Error('Not found.');

    res.render('review', {
      review,
    });
  }));

// Delete a review
app.post('/reviews/:reviewId/destroy',
  requiresAuthentication,
  catchError(async (req, res) => {
    const { reviewId } = req.params;
    const deleted = await res.locals.store.removeReview(+reviewId);
    if (!deleted) throw new Error('Not found.');
    req.flash('success', 'The review has been deleted.');

    res.redirect('/reviews');
  }));

// Render edit review form
app.get('/reviews/:reviewId/edit',
  requiresAuthentication,
  catchError(async (req, res, next) => {
    const { reviewId } = req.params;
    const review = res.locals.store.loadReview(+reviewId);
    if (!review) throw new Error('Not found.');

    res.render('edit-review', { review });
  }));

// Edit a review
app.post('/reviews/:reviewId/edit',
  requiresAuthentication,
  [
    body('title')
      .trim()
      .isLength({ min: 1 })
      .withMessage('The list title is required.')
      .isLength({ max: 100 })
      .withMessage('Review title must be between 1 and 100 characters.')
  ],
  catchError(async (req, res, next) => {
    const { reviewId } = req.params;
    const { title, artist } = req.body;

    const rerenderEditReview = async () => {
      const review = await res.locals.store.loadReview(+reviewId);
      if (!review) throw new Error('Not found.');

      res.render('edit-review', {
        title,
        review,
        artist,
        flash: req.flash(),
      });
    };

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach((message) => req.flash('error', message.msg));
        rerenderEditReview();
      } else {
        const updated = await res.locals.store.updateReview(+reviewId, title, artist);
        if (!updated) throw new Error('Not found.');

        req.flash('success', 'Review updated.');
        res.redirect(`/lists/${reviewId}`);
      }
    } catch (error) {
      if (store.isUniqueConstraintViolation(error)) {
        req.flash('error', 'The list title must be unique.');
        rerenderEditReview();
      } else {
        throw error;
      }
    }
  }));

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});
