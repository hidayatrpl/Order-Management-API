import { Router } from "express";
import c from "../controller/categoriesController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get('/', c.list);
router.post('/', authenticate, authorize('admin'), c.create);
router.put('/:id', authenticate, authorize('admin'), c.update);
router.delete('/:id', authenticate, authorize('admin'), c.remove);

export default router;