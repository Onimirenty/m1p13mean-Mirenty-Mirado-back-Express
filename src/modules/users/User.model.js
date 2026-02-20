const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2
    },
    contact: {
      type: Number,
      required: [true, 'Contact is required'],
      unique: true,
      trim: true,
      minlength: 10
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },

    role: {
      type: String,
      enum: ['admin', 'owner', 'customer'],
      default: 'customer'
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    deactivation_reason: {
      type: String,
      minlength: 10

    }
  },
  {
    timestamps: true
  }
);

//  Hash password before save
userSchema.pre('save', async function () {
  try {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error('Password not loaded for comparison');
  }
  return bcrypt.compare(candidatePassword, this.password);
};



module.exports = mongoose.model('User', userSchema);
