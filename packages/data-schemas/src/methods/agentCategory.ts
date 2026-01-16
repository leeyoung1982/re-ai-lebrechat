import type { Model, Types } from 'mongoose';
import type { IAgentCategory } from '~/types';

export function createAgentCategoryMethods(mongoose: typeof import('mongoose')) {
  /**
   * Get all active categories sorted by order
   * @returns Array of active categories
   */
  async function getActiveCategories(): Promise<IAgentCategory[]> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.find({ isActive: true }).sort({ order: 1, label: 1 }).lean();
  }

  /**
   * Get categories with agent counts
   * @returns Categories with agent counts
   */
  async function getCategoriesWithCounts(): Promise<(IAgentCategory & { agentCount: number })[]> {
    const Agent = mongoose.models.Agent;

    const categoryCounts = await Agent.aggregate([
      { $match: { category: { $exists: true, $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(categoryCounts.map((c) => [c._id, c.count]));
    const categories = await getActiveCategories();

    return categories.map((category) => ({
      ...category,
      agentCount: countMap.get(category.value) || (0 as number),
    })) as (IAgentCategory & { agentCount: number })[];
  }

  /**
   * Get valid category values for Agent model validation
   * @returns Array of valid category values
   */
  async function getValidCategoryValues(): Promise<string[]> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.find({ isActive: true }).distinct('value').lean();
  }

  /**
   * Seed initial categories from existing constants
   * @param categories - Array of category data to seed
   * @returns Bulk write result
   */
  async function seedCategories(
    categories: Array<{
      value: string;
      label?: string;
      description?: string;
      order?: number;
      custom?: boolean;
    }>,
  ): Promise<import('mongoose').mongo.BulkWriteResult> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;

    const operations = categories.map((category, index) => ({
      updateOne: {
        filter: { value: category.value },
        update: {
          $setOnInsert: {
            value: category.value,
            label: category.label || category.value,
            description: category.description || '',
            order: category.order || index,
            isActive: true,
            custom: category.custom || false,
          },
        },
        upsert: true,
      },
    }));

    return await AgentCategory.bulkWrite(operations);
  }

  /**
   * Find a category by value
   * @param value - The category value to search for
   * @returns The category document or null
   */
  async function findCategoryByValue(value: string): Promise<IAgentCategory | null> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.findOne({ value }).lean();
  }

  /**
   * Create a new category
   * @param categoryData - The category data to create
   * @returns The created category
   */
  async function createCategory(categoryData: Partial<IAgentCategory>): Promise<IAgentCategory> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    const category = await AgentCategory.create(categoryData);
    return category.toObject() as IAgentCategory;
  }

  /**
   * Update a category by value
   * @param value - The category value to update
   * @param updateData - The data to update
   * @returns The updated category or null
   */
  async function updateCategory(
    value: string,
    updateData: Partial<IAgentCategory>,
  ): Promise<IAgentCategory | null> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.findOneAndUpdate(
      { value },
      { $set: updateData },
      { new: true, runValidators: true },
    ).lean();
  }

  /**
   * Delete a category by value
   * @param value - The category value to delete
   * @returns Whether the deletion was successful
   */
  async function deleteCategory(value: string): Promise<boolean> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    const result = await AgentCategory.deleteOne({ value });
    return result.deletedCount > 0;
  }

  /**
   * Find a category by ID
   * @param id - The category ID to search for
   * @returns The category document or null
   */
  async function findCategoryById(id: string | Types.ObjectId): Promise<IAgentCategory | null> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.findById(id).lean();
  }

  /**
   * Get all categories (active and inactive)
   * @returns Array of all categories
   */
  async function getAllCategories(): Promise<IAgentCategory[]> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.find({}).sort({ order: 1, label: 1 }).lean();
  }

  /**
   * Ensure default categories exist and update them if they don't have localization keys
   * Also deactivates any categories not in the default list (old categories)
   * @returns Promise<boolean> - true if categories were created/updated, false if no changes
   */
  async function ensureDefaultCategories(): Promise<boolean> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;

    const defaultCategories = [
      {
        value: 'business',
        label: 'com_agents_category_business',
        description: 'com_agents_category_business_description',
        order: 0,
      },
      {
        value: 'strategy',
        label: 'com_agents_category_strategy',
        description: 'com_agents_category_strategy_description',
        order: 1,
      },
      {
        value: 'creative',
        label: 'com_agents_category_creative',
        description: 'com_agents_category_creative_description',
        order: 2,
      },
      {
        value: 'media_resources',
        label: 'com_agents_category_media_resources',
        description: 'com_agents_category_media_resources_description',
        order: 3,
      },
      {
        value: 'procurement',
        label: 'com_agents_category_procurement',
        description: 'com_agents_category_procurement_description',
        order: 4,
      },
      {
        value: 'hr',
        label: 'com_agents_category_hr',
        description: 'com_agents_category_hr_description',
        order: 5,
      },
      {
        value: 'general',
        label: 'com_agents_category_general',
        description: 'com_agents_category_general_description',
        order: 6,
      },
    ];

    const defaultValues = new Set(defaultCategories.map((c) => c.value));
    const existingCategories = await getAllCategories();
    const existingCategoryMap = new Map(existingCategories.map((cat) => [cat.value, cat]));

    const updates = [];
    let created = 0;
    let deactivated = 0;

    for (const defaultCategory of defaultCategories) {
      const existingCategory = existingCategoryMap.get(defaultCategory.value);

      if (existingCategory) {
        const isNotCustom = !existingCategory.custom;
        const needsLocalization = !existingCategory.label.startsWith('com_');
        const needsActivation = !existingCategory.isActive;

        if (isNotCustom) {
          if (needsLocalization) {
            updates.push({
              value: defaultCategory.value,
              label: defaultCategory.label,
              description: defaultCategory.description,
            });
          }
          if (needsActivation) {
            updates.push({
              value: defaultCategory.value,
              isActive: true,
            });
          }
        }
      } else {
        await createCategory({
          ...defaultCategory,
          isActive: true,
          custom: false,
        });
        created++;
      }
    }

    // Deactivate old categories that are not in the default list
    const oldCategories = existingCategories.filter((cat) => !defaultValues.has(cat.value) && !cat.custom);
    if (oldCategories.length > 0) {
      const deactivateOps = oldCategories.map((cat) => ({
        updateOne: {
          filter: { value: cat.value },
          update: { $set: { isActive: false } },
        },
      }));
      await AgentCategory.bulkWrite(deactivateOps, { ordered: false });
      deactivated = oldCategories.length;
    }

    if (updates.length > 0) {
      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { value: update.value, custom: { $ne: true } },
          update: {
            $set: {
              label: update.label,
              description: update.description,
              isActive: update.isActive ?? true,
            },
          },
        },
      }));

      await AgentCategory.bulkWrite(bulkOps, { ordered: false });
    }

    return updates.length > 0 || created > 0 || deactivated > 0;
  }

  return {
    getActiveCategories,
    getCategoriesWithCounts,
    getValidCategoryValues,
    seedCategories,
    findCategoryByValue,
    createCategory,
    updateCategory,
    deleteCategory,
    findCategoryById,
    getAllCategories,
    ensureDefaultCategories,
  };
}

export type AgentCategoryMethods = ReturnType<typeof createAgentCategoryMethods>;
