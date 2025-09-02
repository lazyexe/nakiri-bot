import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import secretToken from '../middleware/secretToken.js';
import { rateLimit } from 'express-rate-limit';
import GroupController from '../controller/group.controller.js';
import AccountController from '../controller/account.controller.js';

const router = express.Router();
const group = new GroupController();
const account = new AccountController();

const middlewareApi = [
  authenticateToken,
  rateLimit({
    windowMs: 60 * 1000, // 1 minutes
    limit: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    ipv6Subnet: 56,
    handler: (req, res) => {
      res.status(429).json({
        message: 'Too many requests. Please try again later.',
      });
    },
  }),
];

router.get('/', (req, res) => {
  res.json({
    version: 'v1',
    github: 'https://github.com/ilsyaa',
    message: 'API is running.',
  });
});

// Group
const groupRouter = express.Router();

groupRouter.get('/', middlewareApi, group.index.bind(group));
groupRouter.get('/:id', middlewareApi, group.detail.bind(group));
groupRouter.get('/:id/participants', middlewareApi, group.participants.bind(group));
groupRouter.put('/:id/settings/visible', [ secretToken, ...middlewareApi ], group.settingVisible.bind(group));
groupRouter.put('/:id/settings/database', [ secretToken, ...middlewareApi ], group.settingDatabase.bind(group));
groupRouter.put('/:id/settings/participant', [ secretToken, ...middlewareApi ], group.settingParticipant.bind(group));
groupRouter.put('/:id/settings/metadata', [ secretToken, ...middlewareApi ], group.settingMetadata.bind(group));


router.use('/groups', groupRouter);

// Account
const accountRouter = express.Router();
accountRouter.get('/', middlewareApi, account.index.bind(account));
accountRouter.get('/logout', middlewareApi, account.logout.bind(account));
accountRouter.get('/groups', middlewareApi, account.MyGroups.bind(account));

router.use('/me', accountRouter);

export default router;