import express from 'express';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all transactions for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Add new transaction
router.post('/', protect, async (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body;
    const expense = await Expense.create({
      user: req.user,
      title,
      amount: Number(amount),
      type,
      category,
      date: date || Date.now()
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ message: 'Failed to add transaction', error: err.message });
  }
});

// Delete transaction
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user });
    if (!expense) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
});

export default router;