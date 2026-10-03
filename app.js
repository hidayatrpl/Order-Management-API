import express from "express";
import categoriesRoutes from "./src/routes/categories.js";
import errorHandler from "./src/middleware/errorHandler.js";
import productsRoutes from "./src/routes/products.js";
import authRoutes from "./src/routes/auth.js";
import response from "./response.js";

const app = express();

app.use(express.json());
app.use('/categories', categoriesRoutes);
app.use('/products', productsRoutes);
app.use('/auth', authRoutes);

app.use((req, res, next) => {
    response(404, null, 'Not Found', res);
});

app.use(errorHandler);

export default app;