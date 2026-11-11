import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], default: 'expense' },
  category: { 
    type: String, 
    required: true,
    enum: ['Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Salary/Income', 'Other']
  },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);