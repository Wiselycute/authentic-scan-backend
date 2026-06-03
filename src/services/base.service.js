class BaseService {
  constructor(model) {
    if (!model) {
      throw new Error("Model is required");
    }
    this.model = model;
  }
  async create(data) {
    try {
      const result = await this.model.create(data);
      return {
        error: false,
        data: result,
        message: "Item created successfully!!!",
      };
    } catch (error) {
      return {
        error: true,
        message: error.message || "Error, Please try again later.",
      };
    }
  }

  async find(filter) {
    try {
      const result = await this.model.find(filter);
      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        message: error.message || "Error, Please try again later.",
      };
    }
  }

  async findBy(filter) {
    try {
      const isString = typeof filter === "string";
      const where = isString ? { _id: filter } : filter || {};
      const result = isString
        ? await this.model.findById(filter)
        : await this.model.find(where);
      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        message: error.message || "Error, Please try again later.",
      };
    }
  }

  async update(id, data) {
    try {
      if (!id || !data) {
        return {
          error: true,
          message: "please send both id and data.",
        };
      }
      const result = await this.model.findByIdAndUpdate(id, data);
      return {
        error: false,
        data: result,
        message: "Item updated successfully!!!",
      };
    } catch (error) {
      return {
        error: true,
        message: error.message || "Error, Please try again later.",
      };
    }
  }

  async remove(id) {
    try {
      if (!id) {
        return {
          error: true,
          message: "please send id.",
        };
      }
      const result = await this.model.findByIdAndDelete(id);
      return {
        error: false,
        data: result,
        message: "Item deleted successfully!!!",
      };
    } catch (error) {
      return {
        error: true,
        message: error.message || "Error, Please try again later.",
      };
    }
  }
}

module.exports = BaseService;