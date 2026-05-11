const SampleItem = require('../models/SampleItem');

const USE_MEMORY_STORE = !process.env.MONGO_URI;
const memoryItems = new Map();
const createId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const normalizeItem = (item) => ({
  _id: item._id,
  name: item.name,
  description: item.description,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const listSampleItems = async (_req, res, next) => {
  try {
    if (USE_MEMORY_STORE) {
      const items = Array.from(memoryItems.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(normalizeItem);
      return res.status(200).json(items);
    }

    const items = await SampleItem.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

const getSampleItemById = async (req, res, next) => {
  try {
    if (USE_MEMORY_STORE) {
      const item = memoryItems.get(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Sample item not found' });
      }
      return res.status(200).json(normalizeItem(item));
    }

    const item = await SampleItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Sample item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};

const createSampleItem = async (req, res, next) => {
  try {
    const { name, description = '' } = req.body;

    if (!String(name || '').trim()) {
      return res.status(400).json({ message: 'name is required' });
    }

    if (USE_MEMORY_STORE) {
      const now = new Date();
      const item = {
        _id: createId(),
        name: String(name).trim(),
        description: String(description || '').trim(),
        createdAt: now,
        updatedAt: now,
      };

      memoryItems.set(item._id, item);
      return res.status(201).json(normalizeItem(item));
    }

    const item = await SampleItem.create({
      name: String(name).trim(),
      description: String(description || '').trim(),
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

const updateSampleItem = async (req, res, next) => {
  try {
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      const name = String(req.body.name || '').trim();
      if (!name) {
        return res.status(400).json({ message: 'name cannot be empty' });
      }
      updates.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      updates.description = String(req.body.description || '').trim();
    }

    if (USE_MEMORY_STORE) {
      const item = memoryItems.get(req.params.id);

      if (!item) {
        return res.status(404).json({ message: 'Sample item not found' });
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
        item.name = updates.name;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
        item.description = updates.description;
      }

      item.updatedAt = new Date();
      memoryItems.set(item._id, item);

      return res.status(200).json(normalizeItem(item));
    }

    const item = await SampleItem.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ message: 'Sample item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};

const deleteSampleItem = async (req, res, next) => {
  try {
    if (USE_MEMORY_STORE) {
      if (!memoryItems.has(req.params.id)) {
        return res.status(404).json({ message: 'Sample item not found' });
      }

      memoryItems.delete(req.params.id);
      return res.status(200).json({ message: 'Sample item deleted' });
    }

    const item = await SampleItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Sample item not found' });
    }

    res.status(200).json({ message: 'Sample item deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSampleItems,
  getSampleItemById,
  createSampleItem,
  updateSampleItem,
  deleteSampleItem,
};
