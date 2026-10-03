import { Router } from "express";
import p from "../controller/productsController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get('/', p.list);
router.get('/:id', p.getById);
router.post('/', authenticate, authorize('admin'), p.create);
router.put('/:id', authenticate, authorize('admin'), p.update);
router.delete('/:id', authenticate, authorize('admin'), p.remove);

export default router;