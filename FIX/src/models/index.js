const mongoose = require('mongoose');
const { Schema } = mongoose;

const MemberSchema = new Schema({
  memberCode: { type: String, unique: true, index: true, required: true },
  name: { type: String, required: true, trim: true },
  pinHash: { type: String, required: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  age: Number, gender: String, joiningWeight: Number, currentWeight: Number, height: Number,
  bodyType: String, joiningDate: String, feeDueDate: String, monthlyFee: { type: Number, default: 1499 },
  weightGoalType: { type: String, enum: ['gain','lose',''], default: '' }, targetWeight: Number, previousWeight: Number, goalAchieved: { type: Boolean, default: false }, goalMedalAwarded: { type: Boolean, default: false },
  photo: String, socials: Schema.Types.Mixed,
  followers: [String], following: [String], active: { type: Boolean, default: true }
}, { timestamps: true });

const AdminSchema = new Schema({ username: { type: String, unique: true, index: true }, pinHash: { type: String, required: true }, name: String, role: { type: String, default: 'admin' } }, { timestamps: true });
const ProductSchema = new Schema({ id: { type: String, unique: true, index: true }, name: String, price: Number, category: String, img: String, images: [String], inStock: { type: Boolean, default: true }, description: String, uses: String, precautions: String, reviews: Schema.Types.Mixed, customerImages: [String] }, { timestamps: true });
const PlanSchema = new Schema({ name: { type: String, unique: true }, price: Number, period: String, tag: String, features: [String] }, { timestamps: true });
const GallerySchema = new Schema({ name: String, description: String, imageUrl: String, sortOrder: { type: Number, default: 0 }, active: { type: Boolean, default: true } }, { timestamps: true });
const CouponSchema = new Schema({ code: { type: String, unique: true, index: true }, type: { type: String, enum: ['percent','flat'], default: 'percent' }, value: Number, minOrder: { type: Number, default: 0 }, active: { type: Boolean, default: true }, expiresAt: Date, usageLimit: Number, usedCount: { type: Number, default: 0 } }, { timestamps: true });
const OrderSchema = new Schema({ orderId: { type: String, unique: true, index: true }, memberId: String, customer: { name: String, phone: String, address: String }, items: Schema.Types.Mixed, subtotal: Number, discount: Number, total: Number, couponCode: String, type: { type: String, enum: ['store','membership-renewal'], default: 'store' }, status: { type: String, enum: ['created','paid','failed','refunded','cancelled'], default: 'created' }, razorpayOrderId: String, paymentId: String }, { timestamps: true });
const PaymentSchema = new Schema({ paymentId: { type: String, unique: true, index: true }, idempotencyKey: { type: String, unique: true, sparse: true, index: true }, orderId: String, memberId: String, memberName: String, phone: String, address: String, amount: Number, method: String, mode: String, status: String, provider: { type: String, default: 'razorpay' }, providerPaymentId: String, providerOrderId: String, date: { type: Date, default: Date.now }, raw: Schema.Types.Mixed }, { timestamps: true });
const AttendanceSchema = new Schema({ memberId: { type: String, index: true }, date: { type: String, index: true }, weight: Number, title: String, workouts: Schema.Types.Mixed, media: [String] }, { timestamps: true });
const NotificationSchema = new Schema({ memberId: { type: String, index: true }, title: String, message: String, type: String, channel: { type: String, default: 'in-app' }, dedupeKey: { type: String, index: true }, readBy: [String], media: [String], smsStatus: { type: String, enum: ['pending','sent','failed','skipped'] }, smsMessageId: String, smsError: String }, { timestamps: true });
const SettingSchema = new Schema({ key: { type: String, unique: true, index: true }, value: Schema.Types.Mixed }, { timestamps: true });
const MediaSchema = new Schema({ filename: String, contentType: { type: String, required: true }, size: Number, data: { type: Buffer, required: true }, uploadedBy: String }, { timestamps: true });

module.exports = {
  Member: mongoose.model('Member', MemberSchema), Admin: mongoose.model('Admin', AdminSchema), Product: mongoose.model('Product', ProductSchema),
  Plan: mongoose.model('Plan', PlanSchema), Gallery: mongoose.model('Gallery', GallerySchema), Coupon: mongoose.model('Coupon', CouponSchema),
  Order: mongoose.model('Order', OrderSchema), Payment: mongoose.model('Payment', PaymentSchema), Attendance: mongoose.model('Attendance', AttendanceSchema),
  Notification: mongoose.model('Notification', NotificationSchema), Setting: mongoose.model('Setting', SettingSchema),
  Media: mongoose.model('Media', MediaSchema)
};
