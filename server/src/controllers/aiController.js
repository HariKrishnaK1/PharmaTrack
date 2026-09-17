import { processAIQuery } from '../services/aiAssistantService.js';

export const handleAIQuery = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query string is required.' });
    }

    const result = await processAIQuery(query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};