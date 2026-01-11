import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pushSubscriptionSchema = new mongoose.Schema({
    endpoint: String,
    expirationTime: Number,
    keys: {
        p256dh: String,
        auth: String
    }
}, { _id: false });

const notificationSettingsSchema = new mongoose.Schema({
    push: {
        enabled: { type: Boolean, default: false },
        subscription: pushSubscriptionSchema
    },
    whatsapp: {
        enabled: { type: Boolean, default: false },
        phone: { type: String, default: '' }
    },
    email: {
        enabled: { type: Boolean, default: false }
    }
}, { _id: false });

const preferencesSchema = new mongoose.Schema({
    minDiscountPercent: { type: Number, default: 10, min: 0, max: 99 },
    maxPrice: { type: Number, default: null },
    categories: [{ type: String }],
    darkMode: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false // Don't include password in queries by default
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    watchlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    watchCategories: [{
        type: String
    }],
    notifications: {
        type: notificationSettingsSchema,
        default: () => ({})
    },
    preferences: {
        type: preferencesSchema,
        default: () => ({})
    },
    compareList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

// Index for efficient lookups
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;
