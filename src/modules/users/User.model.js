const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const logger = require('../../utils/logger')
const AppError = require('../../utils/AppError')
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // required: [true, 'Name is required'],
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
    phone_number: {
      type: String,
      // required: [true, 'Contact is required'],
      unique: true,
      sparse: true,
      trim: true,
      minlength: 10
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    passwordChangedAt: {
      type: Date
    },

    role: {
      type: String,
      enum: ['ADMIN', 'OWNER', 'CUSTOMER'],
      default: 'CUSTOMER'
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
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
    this.passwordChangedAt = Date.now();

    if (this.isModified('status') || this.isModified('role')) {
      this.status = this.status.toUpperCase();
      this.role = this.role.toUpperCase();
    }
    
  } catch (error) {
    logger.error('Password hashing failed', { error });
    throw error
  }
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  try {

    if (!this.password) {
      throw new AppError('Password not loaded for comparison', 404);
    }
    // logger.info("\n");
    // logger.info("Comparing passwords...");
    // logger.info("Candidate Password:", candidatePassword);
    // logger.info("Stored Hashed Password:", this.password);
    // logger.info("comparaison : ", await bcrypt.compare(candidatePassword, this.password));
    // logger.info("\n");
    // logger.info("\n");

    return bcrypt.compare(candidatePassword, this.password);
  }
  catch (error) {
    logger.error('Error in comparePassword method', { error });
    throw error;
  }
};



module.exports = mongoose.model('User', userSchema);
