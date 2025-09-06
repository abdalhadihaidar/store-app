import Category from '../models/category.model';

export class CategoryService {
  static async getAllCategories(page = 1, size = 25) {
    const limit = size;
    const offset = (page - 1) * size;

    return await Category.findAndCountAll({
      limit,
      offset,
      attributes: ['id', 'name', 'image', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
  }
  static async getCategoryById(id: number) {
    const category = await Category.findByPk(id);
    if (!category) throw new Error('Category not found');
    return category;
  }
 
  static async createCategory(categoryData: { 
    name: string;
    image?: string;
  }) {
    return await Category.create(categoryData);
  }

  static async updateCategory(
    categoryId: string, 
    updateData: { 
      name?: string;
      image?: string;
    }
  ) {
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
