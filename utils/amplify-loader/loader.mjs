import { v4 } from 'uuid';
import axios from 'axios';
import awsmobile from './aws-exports.mjs';
const SOURCE_BUCKET_URL = 'https://retail-demo-store-us-east-1.s3.amazonaws.com';

import * as yaml from 'js-yaml'
import * as fs from 'fs';

const CATEGORY_DATA = './data/categories.yaml';
const PRODUCT_DATA = './data/products.yaml';

const APPSYNC_API_ENDPOINT_URL = awsmobile.aws_appsync_graphqlEndpoint;
const APPSYNC_API_KEY = awsmobile.aws_appsync_apiKey;

const REVIEWS = [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

const appsyncClient = () => {
  if (!APPSYNC_API_ENDPOINT_URL) throw Error('Invalid API Endpoint');
  return axios.create({
    baseURL: APPSYNC_API_ENDPOINT_URL,
    headers: { 'x-api-key': APPSYNC_API_KEY },
  });
};

const categoryMutation = (cat) => {
  return `
    mutation Mutation {
      createCategory(input: {
        id: "${cat.id}", 
        image: "${cat.image}", 
        name: "${cat.name}", 
        description: "${cat.description}", 
        styles: ${JSON.stringify(cat.styles || [])}
      }) {
        createdAt
        description
        id
        image
        name
        updatedAt
        styles
      }
    }`;
};

const productMutation = (prod) => {
  return `
    mutation Mutation {
      createProduct(input: {
        categoryID: "${prod.categoryId}", 
        current_stock: ${prod.current_stock}, 
        description: "${prod.description}", 
        image: "${prod.image}", 
        name: "${prod.name}", 
        price: ${prod.price}, 
        rating: ${REVIEWS[Math.floor(Math.random() * REVIEWS.length)]}, 
        style: "${prod.style}"
      }) {
        categoryID
        createdAt
        current_stock
        description
        id
        image
        name
        price
        rating
        style
        updatedAt
      }
    }`;
};

const hasError = (response) => {
  if (response.status != 200) 
    return response.status;
  if (Array.isArray(response.data.errors) && (response.data.errors.length > 0))
    return JSON.stringify(response.data.errors[0]);
  return false;
}

const loadData = async () => {
  console.log('---- BEGINNING DATA LOAD ----');

  // Load the Categories

  const categoryData = yaml.load(fs.readFileSync(CATEGORY_DATA, 'utf8'));

  const categories = {};
  categoryData.forEach((cat) => {
    categories[cat.name] = {
      "id": v4(),
      "name": cat.name,
      "description": cat.description,
      "image": `${SOURCE_BUCKET_URL}/images/${cat.name.toLowerCase()}/${cat.image}`,
      "styles": []
    }
  });
  console.log(`Product Categories Found: ${Object.keys(categories).length}`);

  // Load the Products
  const productData = yaml.load(fs.readFileSync(PRODUCT_DATA, 'utf8'));

  const products = [];
  productData.forEach((prod) => {
    products.push({
      "id": prod.id,
      "categoryId": categories[prod.category].id,
      "current_stock": prod.current_stock,
      "description": prod.description,
      "image": `${SOURCE_BUCKET_URL}/images/${prod.category.toLowerCase()}/${prod.image}`,
      "name": prod.name,
      "price": prod.price,
      "style": prod.style
    });
    
    // Update available styles for product category
    if (!categories[prod.category].styles.includes(prod.style)) {
      categories[prod.category].styles.push(prod.style);
    }
  });
  console.log(`Products Found: ${products.length}`);

  const appsync = appsyncClient();

  // Load the categories
  let cnt = 0;
  let lastErr;
  console.log('Beginning Category Import ----');
  for (let key in categories) {
    const resp = await appsync.post('', {
      query: categoryMutation(categories[key]),
    });
    if (hasError(resp)) {
      process.stdout.write('x');
      cnt += 1;
      lastErr=hasError(resp)
    } else process.stdout.write('.');
  }
  console.log('');
  console.log(
    `Category Import Completed ---- ${
      cnt > 0 ? `${cnt} records failed - ${lastErr}` : 'no errors'
    }`
  );

  //Load the products - if categories loaded
  if (cnt ===0) {
    cnt = 0;
    console.log('Beginning Product Import ----');
    for (let prod of products) {
      const resp = await appsync.post('', { query: productMutation(prod) });
      if (hasError(resp)) {
        process.stdout.write('x');
        cnt += 1;
        lastErr=hasError(resp)
      } else process.stdout.write('.');
    }
    console.log('');
    console.log(
      `Product Import Completed ---- ${
        cnt > 0 ? `${cnt} records failed - ${lastErr}` : 'no errors'
      }`
    );
  }
  console.log('---- DATA LOAD COMPLETE ----');
};

loadData();