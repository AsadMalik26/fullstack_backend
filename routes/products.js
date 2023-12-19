var express = require('express');
var router = express.Router();
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Star a product and store user information
router.post('/star-product/:productId', async (req, res) => {
  const { name, email } = req.body;
  const productId = parseInt(req.params.productId, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      productId,
    },
  });

  res.json(user);
});

// Get starred products and user information
router.get('/starred-products', async (req, res) => {
  const starredProducts = await prisma.user.findMany({
    include: {
      product: true,
    },
  });
  res.json(starredProducts);
});

// Fetch all products - DONE
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new product
router.post('/products', async (req, res) => {
  try {
    const { name, price, rating, description } = req.body;

    // Validate request body
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required fields.' });
    }

    // Validate rating if present
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Create a new product
    const product = await prisma.product.create({
      data: {
        name,
        price,
        rating,
        description,
      },
    });

    res.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Scheduled job to update product prices every 24 hours
cron.schedule('0 0 */24 * * *', async () => {
  try {
    // Fetch all products
    const products = await prisma.product.findMany();

    // Update prices (Increase each price by 10%)
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        const newPrice = product.price * 1.1; // Increase price by 10%
        return await prisma.product.update({
          where: { id: product.id },
          data: { price: newPrice },
        });
      })
    );

    console.log('Product prices updated:', updatedProducts);
  } catch (error) {
    console.error('Error updating product prices:', error);
  }
});


module.exports = router;
