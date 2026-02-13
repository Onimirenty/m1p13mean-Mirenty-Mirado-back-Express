const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    contact: {
      type: String,
      required: [true, 'Contact is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },

    role: {
      type: String,
      enum: ['admin', 'proprietaire', 'acheteur'],
      default: 'acheteur'
    },

    status: {
      type: String,
      enum: ['actif', 'desactive'],
      default: 'actif'
    }
  },
  {
    timestamps: true
  }
);

//  Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//  Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
