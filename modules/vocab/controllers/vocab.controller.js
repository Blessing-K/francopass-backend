import Vocab from "../models/vocab.model.js";

export const getVocab = async (req, res) => {
  try {
    const {
      search,
      category,
      difficultyLevel,
      sort = "createdAt",
      order = "asc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};
    if (search) query.word = new RegExp(search, "i");
    if (category) query.category = category;
    if (difficultyLevel) query.difficultyLevel = difficultyLevel;

    const vocab = await Vocab.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(vocab);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getVocabById = async (req, res) => {
  try {
    const entry = await Vocab.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Vocab not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createVocab = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.user && req.user._id) payload.createdBy = req.user._id;
    const entry = await Vocab.create(payload);
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateVocab = async (req, res) => {
  try {
    const entry = await Vocab.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Vocab not found" });

    // Allow update if owner or admin
    if (
      !req.user ||
      (String(entry.createdBy) !== String(req.user._id) &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    Object.assign(entry, req.body);
    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteVocab = async (req, res) => {
  try {
    const entry = await Vocab.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Vocab not found" });

    // Allow deletion if owner or admin
    if (
      !req.user ||
      (String(entry.createdBy) !== String(req.user._id) &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await entry.deleteOne();
    res.json({ message: "Vocab deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
