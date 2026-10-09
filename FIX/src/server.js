require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/*
========================================================
MONGODB CONFIGURATION
========================================================

IMPORTANT:
Only change MONGO_PASSWORD below.

Do NOT add mongodb+srv:// here.
Do NOT add < > around the password.

Example:

const MONGO_PASSWORD = 'MyPassword123';

If your MongoDB password contains special characters
such as @ : / ? # [ ] %, encodeURIComponent() below
will handle them automatically.
*/

const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_CLUSTER = process.env.MONGO_CLUSTER;
const MONGO_DB = process.env.MONGO_DB || 'garuda-fitness-zone';

if (!MONGO_USER || !MONGO_PASSWORD || !MONGO_CLUSTER) {
  throw new Error('Missing MongoDB environment variables: MONGO_USER, MONGO_PASSWORD, MONGO_CLUSTER');
}

const MONGO_URI =
  `mongodb+srv://${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_CLUSTER}/${encodeURIComponent(MONGO_DB)}?retryWrites=true&w=majority&appName=Cluster0`;


/*
========================================================
MODELS
========================================================
*/

const {
  Order,
  Payment,
  Member,
  Notification,
  Setting,
  Admin,
  Media
} = require('./models');


/*
========================================================
ROUTES / MIDDLEWARE
========================================================
*/

const { startRenewalScheduler } = require('./notifications');
const { ensureCatalog } = require('./bootstrap');

const auth = require('./routes/auth');
const catalog = require('./routes/catalog');
const members = require('./routes/members');
const payments = require('./routes/payments');
const admin = require('./routes/admin');
const state = require('./routes/state');

const {
  notFound,
  errorHandler
} = require('./middleware/error');


/*
========================================================
APP
========================================================
*/

const app = express();

app.set('trust proxy', 1);

app.disable('x-powered-by');


/*
========================================================
SECURITY
========================================================
*/

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },
    contentSecurityPolicy: false
  })
);


/*
========================================================
CORS
========================================================
*/

app.use(
  cors({
    origin: (origin, cb) => {

      const allowed = String(process.env.CORS_ORIGIN || '')
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);

      /*
       * Allow requests when no CORS_ORIGIN is configured.
       * This is useful for the deployed frontend/backend setup.
       */

      if (
        !origin ||
        !allowed.length ||
        allowed.includes(origin)
      ) {
        return cb(null, true);
      }

      return cb(new Error('CORS blocked'));
    },

    credentials: true
  })
);


/*
========================================================
LOGGING
========================================================
*/

app.use(morgan('combined'));


/*
========================================================
RATE LIMITING
========================================================
*/

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);


/*
========================================================
HEALTH CHECK
========================================================
*/

app.get('/healthz', (req, res) => {

  res.json({
    ok: true,
    service: 'garuda-fitness-zone',
    time: new Date().toISOString()
  });

});


/*
========================================================
RAZORPAY WEBHOOK
========================================================
*/

app.post(
  '/api/payments/webhook',
  express.raw({
    type: 'application/json',
    limit: '256kb'
  }),

  async (req, res) => {

    try {

      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!secret) {
        return res.status(503).json({
          error: 'Webhook secret not configured'
        });
      }

      const signature =
        req.get('x-razorpay-signature') || '';

      const expected =
        crypto
          .createHmac('sha256', secret)
          .update(req.body)
          .digest('hex');

      if (signature !== expected) {

        return res.status(400).json({
          error: 'Invalid webhook signature'
        });

      }

      const payload =
        JSON.parse(req.body.toString('utf8'));

      const event = payload.event;

      const entity =
        payload.payload?.payment?.entity ||
        payload.payload?.order?.entity;

      const providerPaymentId =
        entity?.id;

      const providerOrderId =
        entity?.order_id;

      const order =
        providerOrderId
          ? await Order.findOne({
              razorpayOrderId: providerOrderId
            })
          : null;


      if (
        order &&
        ['payment.captured', 'order.paid'].includes(event)
      ) {

        order.status = 'paid';

        if (providerPaymentId) {
          order.paymentId = providerPaymentId;
        }

        await order.save();


        /*
        ---------------------------------------------
        CREATE PAYMENT RECORD
        ---------------------------------------------
        */

        if (
          providerPaymentId &&
          !(await Payment.exists({
            paymentId: providerPaymentId
          }))
        ) {

          await Payment.create({

            paymentId: providerPaymentId,

            orderId: order.orderId,

            memberId: order.memberId,

            memberName: order.customer?.name,

            phone: order.customer?.phone,

            address: order.customer?.address,

            amount: order.total,

            method: 'razorpay',

            mode: order.type,

            status: 'Paid',

            providerPaymentId,

            providerOrderId

          });

        }


        /*
        ---------------------------------------------
        MEMBERSHIP RENEWAL
        ---------------------------------------------
        */

        if (
          order.type === 'membership-renewal' &&
          order.memberId
        ) {

          const member =
            await Member.findOne({
              memberCode: order.memberId
            });

          if (member) {

            const currentDueDate =
              member.feeDueDate ||
              new Date().toISOString().slice(0, 10);

            const currentDate =
              new Date(
                `${currentDueDate}T00:00:00`
              );

            const baseDate =
              new Date(
                Math.max(
                  Date.now(),
                  currentDate.getTime()
                )
              );

            baseDate.setDate(
              baseDate.getDate() + 30
            );

            member.feeDueDate =
              baseDate.toISOString().slice(0, 10);

            await member.save();


            await Notification.create({

              memberId: member.memberCode,

              title: 'Payment received',

              message:
                `Your membership payment of ₹${order.total.toLocaleString('en-IN')} was received. Your fee due date is ${member.feeDueDate}.`,

              type: 'payment-sms'

            });

          }

        }

      }


      return res.json({
        ok: true
      });

    } catch (error) {

      console.error(
        'Webhook processing failed:',
        error
      );

      return res.status(500).json({
        error: 'Webhook processing failed'
      });

    }

  }
);


/*
========================================================
BODY PARSERS
========================================================
*/

app.use(
  express.json({
    limit: '2mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb'
  })
);


/*
========================================================
API ROUTES
========================================================
*/

app.use(
  '/api/auth',
  authLimiter,
  auth
);

app.use(
  '/api',
  catalog
);

app.use(
  '/api/members',
  members
);

app.use(
  '/api/payments',
  payments
);

app.use(
  '/api/admin',
  admin
);

app.use(
  '/api/state',
  state
);


/*
========================================================
IMAGE UPLOAD
========================================================
*/

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 8
  },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only image uploads are allowed'));
  }
});

const { requireAuth, requireRole } = require('./middleware/auth');

/*
 * Persistent media endpoint.
 * Files are stored in MongoDB instead of Render's ephemeral filesystem.
 * This means member/product/gallery images survive redeploys and restarts.
 */
app.post(
  '/api/uploads/image',
  requireAuth,
  upload.array('images', 8),
  async (req, res, next) => {
    try {
      if (!Array.isArray(req.files) || !req.files.length) {
        return res.status(400).json({ error: 'No images uploaded' });
      }

      const files = [];
      for (const file of req.files) {
        const media = await Media.create({
          filename: file.originalname,
          contentType: file.mimetype,
          size: file.size,
          data: file.buffer,
          uploadedBy: req.user?.role || 'authenticated'
        });

        files.push({
          url: `/api/media/${media._id}`,
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          id: String(media._id)
        });
      }

      return res.status(201).json({ files });
    } catch (error) {
      next(error);
    }
  }
);

app.get('/api/media/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).end();
    }

    const media = await Media.findById(req.params.id).lean();
    if (!media) return res.status(404).end();

    res.set('Content-Type', media.contentType || 'application/octet-stream');
    if(media.filename){
      res.set('Content-Disposition', 'inline; filename*=UTF-8\'\''+encodeURIComponent(media.filename));
      res.set('X-Media-Filename', encodeURIComponent(media.filename));
    }
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Content-Length', String(media.data?.length || 0));
    return res.send(media.data);
  } catch (error) {
    next(error);
  }
});

/*
========================================================
FRONTEND
========================================================
*/

app.use(
  express.static(
    path.join(__dirname, '../public'),
    {
      extensions: ['html'],

      maxAge:
        process.env.NODE_ENV === 'production'
          ? '7d'
          : 0
    }
  )
);


/*
========================================================
FRONTEND FALLBACK
========================================================
*/

app.get(
  /.*/,
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        '../public/index.html'
      )
    );

  }
);


/*
========================================================
ERROR HANDLERS
========================================================
*/

app.use(notFound);

app.use(errorHandler);


/*
========================================================
ADMIN ACCOUNT
========================================================
*/

async function ensureAdminAccount() {

  const username =
    String(
      process.env.ADMIN_USERNAME || 'admin'
    ).trim();

  const pin =
    String(
      process.env.ADMIN_PIN || ''
    );

  const adminName = String(process.env.ADMIN_NAME || username || 'Garuda Admin').trim();

  if (
    !username ||
    !pin
  ) {

    console.warn(
      'Admin auto-init skipped: ADMIN_USERNAME or ADMIN_PIN is missing.'
    );

    return;

  }


  if (!Admin) {

    console.error(
      'Admin model is missing from ./models'
    );

    return;

  }


  const pinHash =
    await bcrypt.hash(
      pin,
      12
    );


  await Admin.findOneAndUpdate(

    {
      username
    },

    {
      username,

      pinHash,

      name:
        adminName,

      role:
        'admin'

    },

    {
      upsert: true,

      new: true,

      setDefaultsOnInsert: true

    }

  );


  console.log(
    `Admin account initialized: ${username}`
  );

}


/*
========================================================
DEMO MEMBER
========================================================
*/

/*
========================================================
START SERVER
========================================================
*/

const port =
  Number(
    process.env.PORT || 5050
  );


(async () => {

  try {

    console.log(
      '========================================'
    );

    console.log(
      'Connecting to MongoDB...'
    );

    console.log(
      `MongoDB user: ${MONGO_USER}`
    );

    console.log(
      `MongoDB cluster: ${MONGO_CLUSTER}`
    );

    console.log(
      `MongoDB database: ${MONGO_DB}`
    );

    console.log(
      'MongoDB password: [HIDDEN]'
    );

    console.log(
      '========================================'
    );


    /*
    ---------------------------------------------
    CONNECT TO MONGODB
    ---------------------------------------------
    */

    await mongoose.connect(
      MONGO_URI,
      {
        serverSelectionTimeoutMS:
          15000,

        connectTimeoutMS:
          15000
      }
    );


    console.log(
      'MongoDB connected successfully.'
    );


    /*
    ---------------------------------------------
    INITIALIZE DATA
    ---------------------------------------------
    */

    await ensureAdminAccount();

    // Seed the catalog only once on a fresh database. Never overwrite user data.
    await ensureCatalog();


    /*
    ---------------------------------------------
    START EXPRESS
    ---------------------------------------------
    */

    app.listen(
      port,
      '0.0.0.0',
      () => {

        console.log(
          `Garuda Fitness Zone backend running on port ${port}`
        );

        console.log(
          `Health check: /healthz`
        );


        /*
        Start renewal scheduler
        */

        try {

          startRenewalScheduler();

          console.log(
            'Renewal scheduler started.'
          );

        } catch (schedulerError) {

          console.error(
            'Renewal scheduler failed:',
            schedulerError
          );

        }

      }
    );


  } catch (error) {

    console.error(
      '========================================'
    );

    console.error(
      'MongoDB connection failed'
    );

    console.error(
      '========================================'
    );

    console.error(
      error.message
    );

    console.error(
      '========================================'
    );

    process.exit(1);

  }

})();
