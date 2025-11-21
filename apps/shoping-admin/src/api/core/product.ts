import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ProductApi {
  /**
   * 商品信息响应
   */
  export interface Product {
    /**
     * 商品id
     */
    id: number;
    /**
     * 商品名称
     */
    productName: string;
    /**
     * 商品价格
     */
    price: number;
    /**
     * 商品预览图片
     */
    previewImage: string;
    /**
     * 商品描述
     */
    description: string;
    /**
     * 商品所属分类
     */
    categoryId: number;
    /**
     * 创建时间
     */
    createAt: string;
  }

  /** 创建商品接口参数 */
  export interface CreateProductParams {
    /**
     * 商品名称
     */
    productName: string;
    /**
     * 商品价格
     */
    price: number;
    /**
     * 商品预览图片
     */
    previewImage: string;
    /**
     * 商品描述
     */
    description: string;
    /**
     * 商品所属分类
     */
    categoryId: number;
  }

  /** 更新商品接口参数 */
  export interface UpdateProductParams {
    /**
     * 商品id
     */
    id: number;
    /**
     * 商品名称
     */
    productName: string;
    /**
     * 商品价格
     */
    price: number;
    /**
     * 商品预览图片
     */
    previewImage: string;
    /**
     * 商品描述
     */
    description: string;
    /**
     * 商品所属分类
     */
    categoryId: number;
  }

  /** 分页查询商品接口参数 */
  export interface PageProductParams {
    /**
     * 第几页
     */
    current?: number;
    /**
     * 每页个数
     */
    size?: number;
    /**
     * 商品名称
     */
    productName?: string;
    /**
     * 所属分类
     */
    categoryId?: number;
  }
}

/**
 * 分页查询商品列表
 */
export async function getProductListApi(params: ProductApi.PageProductParams) {
  return requestClient.get<PageResult<ProductApi.Product>>('/product', {
    params,
  });
}

/**
 * 获取商品信息
 */
export async function getProductApi(productId: number) {
  return requestClient.get<ProductApi.Product>(`/product/${productId}`);
}

/**
 * 创建商品
 */
export async function createProductApi(
  product: ProductApi.CreateProductParams,
) {
  return requestClient.post('/product', product);
}

/**
 * 更新商品
 */
export async function updateProductApi(
  product: ProductApi.UpdateProductParams,
) {
  return requestClient.put('/product', product);
}

/**
 * 删除商品
 */
export async function deleteProductApi(productId: number) {
  return requestClient.delete(`/product/${productId}`);
}
