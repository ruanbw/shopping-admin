import { requestClient } from '#/api/request';

export namespace CategoryApi {
  /**
   * 商品分类信息（树型结构）
   */
  export interface Category {
    /**
     * id
     */
    id: number;
    /**
     * 上级id
     */
    parentId: null | number;
    /**
     * 分类名称
     */
    categoryName: string;
    /**
     * 分类描述
     */
    description: null | string;
    /**
     * 排序
     */
    order: number;
    /**
     * 创建时间
     */
    createAt: null | string;
    /**
     * 子分类数组（树型结构）
     */
    children: Category[];
  }

  /** 创建分类接口参数 */
  export interface CreateCategoryParams {
    /**
     * 上级id
     */
    parentId?: number;
    /**
     * 分类名称
     */
    categoryName: string;
    /**
     * 分类描述
     */
    description?: string;
    /**
     * 排序
     */
    order?: number;
  }

  /** 更新分类接口参数 */
  export interface UpdateCategoryParams {
    /**
     * id
     */
    id: number;
    /**
     * 上级id
     */
    parentId?: number;
    /**
     * 分类名称
     */
    categoryName: string;
    /**
     * 分类描述
     */
    description?: string;
    /**
     * 排序
     */
    order?: number;
  }
}

/**
 * 获取分类列表（树型结构）
 */
export async function getCategoryListApi() {
  return requestClient.get<CategoryApi.Category[]>('/category');
}

/**
 * 获取分类信息
 */
export async function getCategoryApi(categoryId: number) {
  return requestClient.get<CategoryApi.Category>(`/category/${categoryId}`);
}

/**
 * 创建分类
 */
export async function createCategoryApi(
  category: CategoryApi.CreateCategoryParams,
) {
  return requestClient.post('/category', category);
}

/**
 * 更新分类
 */
export async function updateCategoryApi(
  category: CategoryApi.UpdateCategoryParams,
) {
  return requestClient.put('/category', category);
}

/**
 * 删除分类
 */
export async function deleteCategoryApi(categoryId: number) {
  return requestClient.delete(`/category/${categoryId}`);
}
