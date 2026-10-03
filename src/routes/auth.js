import { Router } from "express";
import controller from "../controller/authControlle.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authenticate, controller.me);

export default router;