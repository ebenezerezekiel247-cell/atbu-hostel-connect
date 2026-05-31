import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import channelsRouter from "./channels";
import maintenanceRouter from "./maintenance";
import marketplaceRouter from "./marketplace";
import sosRouter from "./sos";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(channelsRouter);
router.use(maintenanceRouter);
router.use(marketplaceRouter);
router.use(sosRouter);
router.use(statsRouter);

export default router;
