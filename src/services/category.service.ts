import Category from '../models/category.model';

export class CategoryService {
  static async getAllCategories() {
    return await Category.findAll();
  }

  static async createCategory(categoryData: { name: string }) {
    return await Category.create(categoryData);
  }

  static async updateCategory(categoryId: string, updateData: { name?: string }) {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new Error('Category not found');

    return await category.update(updateData);
  }

  static async deleteCategory(categoryId: string) {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new Error('Category not found');

    await category.destroy();
  }
}
