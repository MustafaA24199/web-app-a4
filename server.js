const express = require('express');
const exphbs = require('express-handlebars');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require('./store-service');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

cloudinary.config({
  cloud_name: "dyzupsv5u",
  api_key: "391944133355469",
  api_secret: "Og7dSw026kms_k2Xd_duYIYjCNQ",
  secure: true,
});

const upload = multer(); // For handling file uploads in memory

// Set up Handlebars with helpers
const hbs = exphbs.create({
  extname: '.hbs',
  helpers: {
    ifActive: function (path, options) {
      const currentPath = options.data.root.currentPath || '';
      if (currentPath === path) {
        return 'active';
      }
      return '';
    },
    ifEquals: function (a, b, options) {
      return a == b ? options.fn(this) : options.inverse(this);
    },
  },
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.redirect('/shop');
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About Us', currentPath: req.path });
});

app.get('/shop', (req, res) => {
  const category = req.query.category;

  const fetchItems = category
    ? storeService.getPublishedItemsByCategory(category)
    : storeService.getPublishedItems();

  Promise.all([storeService.getCategories(), fetchItems])
    .then(([categories, items]) => {
      // Sort items by date (newest first)
      items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

      res.render('shop', {
        categories,
        items,
        title: category ? 'Shop - Filtered' : 'Shop',
        currentPath: req.path,
        selectedCategory: category || '',
      });
    })
    .catch((err) => {
      res.render('shop', {
        categories: [],
        items: [],
        message: err,
        title: 'Shop',
        currentPath: req.path,
        selectedCategory: category || '',
      });
    });
});





app.get('/items', (req, res) => {
  if (req.query.category) {
    storeService.getItemsByCategory(req.query.category)
      .then((items) => {
        res.render('items', {
          items,
          title: 'Filtered Items',
          currentPath: req.path,
          filtered: true,
        });
      })
      .catch((err) => {
        res.render('items', {
          message: err,
          title: 'Filtered Items',
          currentPath: req.path,
          filtered: true,
        });
      });
  } else {
    storeService.getAllItems()
      .then((items) => {
        res.render('items', {
          items,
          title: 'Items',
          currentPath: req.path,
          filtered: false,
        });
      })
      .catch((err) => {
        res.render('items', {
          message: err,
          title: 'Items',
          currentPath: req.path,
          filtered: false,
        });
      });
  }
});


app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then((categories) => {
      res.render('categories', { categories, title: 'Categories', currentPath: req.path });
    })
    .catch((err) => {
      res.render('categories', { message: err, title: 'Categories', currentPath: req.path });
    });
});

app.get('/items/add', (req, res) => {
  storeService.getCategories()
    .then((categories) => {
      res.render('addItems', { categories, title: 'Add Item', currentPath: req.path });
    })
    .catch((err) => {
      res.render('addItems', { message: err, title: 'Add Item', currentPath: req.path });
    });
});

app.post('/items/add', upload.single('featureImage'), async (req, res) => {
  let imageUrl = '';
  if (req.file) {
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    try {
      const result = await streamUpload(req);
      imageUrl = result.url;
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  }

  req.body.featureImage = imageUrl;
  storeService.addItem(req.body)
    .then(() => {
      res.redirect('/items');
    })
    .catch((err) => {
      res.status(500).send('Unable to add item');
    });
});

app.get('/items/:id', (req, res) => {
  const itemId = req.params.id;

  storeService.getItemById(itemId)
    .then((item) => {
      // Render the existing items.hbs with a single item as the array
      res.render('items', { items: [item], title: `Item ${itemId}`, currentPath: req.path });
    })
    .catch((err) => {
      res.status(404).render('404', { message: err, title: 'Item Not Found', currentPath: req.path });
    });
});

app.get('/shop/:id', (req, res) => {
  const itemId = req.params.id;

  storeService.getItemById(itemId)
    .then((item) => {
      // Render the existing shop.hbs with a single item as the array
      res.render('shop', { items: [item], title: `Shop - Item ${itemId}`, currentPath: req.path });
    })
    .catch((err) => {
      res.status(404).render('404', { message: err, title: 'Item Not Found', currentPath: req.path });
    });
});



// Catch-all route for 404 errors
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found', currentPath: req.path });
});



// Initialize store-service and start the server
storeService.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(`Failed to initialize store-service: ${err}`);
  });
