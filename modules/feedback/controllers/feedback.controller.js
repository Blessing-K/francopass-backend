import Feedback from "../models/feedback.model.js";

export const getFeedback = async (req, res) => {
  try {
    const {
      userId,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};
    if (userId) query.userId = userId;

    const feedback = await Feedback.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("userId", "username email");

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFeedbackById = async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id).populate(
      "userId",
      "username email"
    );
    if (!fb) return res.status(404).json({ error: "Feedback not found" });
    res.json(fb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createFeedback = async (req, res) => {
  try {
    const fb = await Feedback.create(req.body);
    res.status(201).json(fb);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateFeedback = async (req, res) => {
  try {
    const updated = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Feedback not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Feedback not found" });
    res.json({ message: "Feedback deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
