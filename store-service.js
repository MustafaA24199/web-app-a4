const fs = require("fs");
const path = require("path");
let items = [];
let categories = [];

// Function to initialize the data (read items and categories from JSON files)
module.exports.initialize = () => {
  return new Promise((resolve, reject) => {
    fs.readFile("./data/items.json", "utf8", (err, data) => {
      if (err) {
        reject("unable to read items file");
        return;
      }
      try {
        items = JSON.parse(data);
      } catch (parseError) {
        reject("unable to parse items file");
        return;
      }

      fs.readFile("./data/categories.json", "utf8", (err, data) => {
        if (err) {
          reject("unable to read categories file");
          return;
        }
        try {
          categories = JSON.parse(data);
        } catch (parseError) {
          reject("unable to parse categories file");
          return;
        }
        resolve();
      });
    });
  });
};

module.exports.addItem = (itemData) => {
  return new Promise((resolve) => {
    // Set default values and structure the new item based on the existing JSON format
    const newItem = {
      id: items.length + 1,
      category: parseInt(itemData.category) || 1, // Default to category 1 if not provided
      postDate: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
      featureImage:
        itemData.featureImage || "https://dummyimage.com/200x200/000/fff",
      price: parseFloat(itemData.price) || 0.0, // Default to 0.00 if not provided
      title: itemData.title || "Untitled", // Default to "Untitled" if not provided
      body: itemData.body || "", // Empty description if not provided
      published: itemData.published === "true", // Convert to boolean
    };

    // Add the new item to the items array
    items.push(newItem);

    // Resolve with the newly added item
    resolve(newItem);
  });
};

// Function to get all items
module.exports.getAllItems = () => {
  return new Promise((resolve, reject) => {
    if (items.length > 0) {
      resolve(items);
    } else {
      reject("no results returned");
    }
  });
};

// Function to get only published items
module.exports.getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter((item) => item.published === true);
    if (publishedItems.length > 0) {
      resolve(publishedItems);
    } else {
      reject("no results returned");
    }
  });
};

// Function to get all categories
module.exports.getCategories = () => {
  return new Promise((resolve, reject) => {
    if (categories.length > 0) {
      resolve(categories);
    } else {
      reject("no results returned");
    }
  });
};

// Function to get items by category
module.exports.getItemsByCategory = (categoryId) => {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter(
      (item) => item.category === parseInt(categoryId)
    );
    if (filteredItems.length > 0) {
      resolve(filteredItems);
    } else {
      reject("no results returned");
    }
  });
};

// Function to get items by minimum date
module.exports.getItemsByMinDate = (minDateStr) => {
  return new Promise((resolve, reject) => {
    const minDate = new Date(minDateStr);
    const filteredItems = items.filter(
      (item) => new Date(item.postDate) >= minDate
    );
    if (filteredItems.length > 0) {
      resolve(filteredItems);
    } else {
      reject("no results returned");
    }
  });
};

// Function to get a single item by ID
module.exports.getItemById = (id) => {
  return new Promise((resolve, reject) => {
    const item = items.find((item) => item.id.toString() === id);
    if (item) {
      resolve(item);
    } else {
      reject('Item not found');
    }
  });
};

module.exports.getPublishedItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter(
      (item) => item.published === true && item.category.toString() === category.toString()
    );
    if (filteredItems.length > 0) {
      resolve(filteredItems);
    } else {
      reject('No results returned');
    }
  });
};
