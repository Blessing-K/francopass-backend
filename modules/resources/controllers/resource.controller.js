import Resource from "../models/resource.model.js";

export const getResources = async (req, res) => {
  try {
    const {
      search,
      resourceType,
      languageLevel,
      sort = "createdAt",
      order = "asc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};
    if (search) query.title = new RegExp(search, "i");
    if (resourceType) query.resourceType = resourceType;
    if (languageLevel) query.languageLevel = languageLevel;

    const resources = await Resource.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createResource = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.user && req.user._id) payload.createdBy = req.user._id;
    const resource = await Resource.create(payload);
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: "Resource not found" });

    // Allow update if owner or admin
    if (
      !req.user ||
      (String(resource.createdBy) !== String(req.user._id) &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    Object.assign(resource, req.body);
    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: "Resource not found" });

    // Allow deletion if owner or admin
    if (
      !req.user ||
      (String(resource.createdBy) !== String(req.user._id) &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await resource.deleteOne();
    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
