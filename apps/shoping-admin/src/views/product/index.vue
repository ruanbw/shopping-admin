<script lang="ts" setup>
import type { UploadFile } from 'element-plus';

import type { VbenFormSchema } from '@vben/common-ui';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CategoryApi } from '#/api/core/category';
import type { ProductApi } from '#/api/core/product';

import { onMounted, ref, toRaw } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElMessageBox } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createProductApi,
  deleteProductApi,
  getCategoryListApi,
  getProductApi,
  getProductListApi,
  updateProductApi,
} from '#/api';
import { uploadFile } from '#/api/core/upload';
import { getFileUrl } from '#/composables/file';

interface RowType extends ProductApi.Product {}

const categoryTree = ref<CategoryApi.Category[]>([]);

/**
 * 根据分类ID查找分类名称
 */
function getCategoryName(
  categoryId: number,
  categories: CategoryApi.Category[],
): string {
  if (!categoryId) return '-';
  const findCategory = (
    list: CategoryApi.Category[],
  ): CategoryApi.Category | null => {
    for (const item of list) {
      if (item.id === categoryId) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = findCategory(item.children);
        if (found) return found;
      }
    }
    return null;
  };
  const category = findCategory(categories);
  return category ? category.categoryName : '-';
}

/**
 * 加载分类列表
 */
async function loadCategoryList() {
  const result = await getCategoryListApi();
  categoryTree.value = result;
}

onMounted(() => {
  loadCategoryList();
});

/**
 * 重置表单
 */
async function resetForm(api: any) {
  if (typeof api?.resetFields === 'function') {
    await api.resetFields();
  }
  if (typeof api?.resetValidation === 'function') {
    await api.resetValidation();
  }
}

/**
 * 查询表单选项
 */
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入商品名称',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'productName',
      label: '商品名称',
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        api: getCategoryListApi,
        placeholder: '请选择分类',
        clearable: true,
        labelField: 'categoryName',
        valueField: 'id',
        childrenField: 'children',
      },
      defaultValue: undefined,
      fieldName: 'categoryId',
      label: '商品分类',
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: false,
};

/**
 * 表格选项
 */
const gridOptions: VxeGridProps<RowType> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'id',
  },
  columns: [
    {
      field: 'previewImage',
      title: '商品图片',
      width: 120,
      slots: { default: 'image' },
    },
    { field: 'productName', title: '商品名称', minWidth: 150 },
    {
      field: 'price',
      title: '商品价格',
      width: 120,
      slots: { default: 'price' },
    },
    {
      field: 'categoryId',
      title: '商品分类',
      width: 150,
      slots: { default: 'category' },
    },
    { field: 'description', title: '商品描述', minWidth: 200 },
    { field: 'createAt', title: '创建时间', width: 180 },
    {
      field: 'action',
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'records',
      total: 'total',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getProductListApi({
          current: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
        // 如果接口返回的是数组，使用数组长度作为total
        // 如果接口返回的是分页对象，应该使用result.total
        const records = Array.isArray(result)
          ? result
          : (result as any)?.records || [];
        const total = Array.isArray(result)
          ? result.length
          : (result as any)?.total || Math.max(records.length, 0);
        return {
          records,
          total,
        };
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

/**
 * 自定义上传函数
 */
function handleUpload(options: {
  file: File;
  onError?: (error: Error) => void;
  onProgress?: (event: { percent: number }) => void;
  onSuccess?: (response: any) => void;
}) {
  uploadFile({
    file: options.file,
    type: 'PRODUCT',
    onProgress: (progress) => {
      options.onProgress?.({
        percent: progress.percent,
      });
    },
    onSuccess: (data) => {
      // Element Plus Upload组件期望response包含url或name字段
      options.onSuccess?.({
        ...data,
        url: getFileUrl(data.key),
      });
    },
    onError: options.onError,
  });
}

/**
 * 创建表单选项
 */
const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入商品名称',
    },
    fieldName: 'productName',
    label: '商品名称',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入商品价格',
      min: 0,
      precision: 2,
    },
    fieldName: 'price',
    label: '商品价格',
    rules: 'required',
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      api: getCategoryListApi,
      placeholder: '请选择商品分类',
      clearable: false,
      labelField: 'categoryName',
      valueField: 'id',
      childrenField: 'children',
    },
    fieldName: 'categoryId',
    label: '商品分类',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入商品描述',
      type: 'textarea',
      rows: 3,
    },
    fieldName: 'description',
    label: '商品描述',
    rules: 'required',
  },
  {
    component: 'Upload',
    componentProps: {
      accept: '.png,.jpg,.jpeg,.gif,.webp',
      httpRequest: handleUpload,
      listType: 'picture-card',
      maxCount: 1,
      multiple: false,
      showFileList: true,
    },
    fieldName: 'previewImage',
    label: '商品图片',
    rules: 'required',
  },
];

const [CreateForm, CreateFormApi] = useVbenForm({
  handleSubmit: onCreate,
  schema,
});

/**
 * 编辑表单选项
 */
const [UpdateForm, UpdateFormApi] = useVbenForm({
  handleSubmit: onUpdate,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入',
        disabled: true,
      },
      fieldName: 'id',
      label: '商品ID',
      rules: 'required',
    },
    ...schema,
  ],
});

/**
 * 创建抽屉选项
 */
const [CreateDrawer, createdrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    await resetForm(CreateFormApi);
  },
});

/**
 * 编辑抽屉选项
 */
const [UpdateDrawer, updatedrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    const row = updatedrawerApi.getData();
    await resetForm(UpdateFormApi);
    if (!row?.id) {
      return;
    }
    const res = await getProductApi(row.id);
    // 处理图片回显
    const imageFile: UploadFile = {
      name: 'preview-image',
      status: 'success',
      uid: Date.now(),
      url: getFileUrl(res.previewImage),
      response: { key: res.previewImage },
    };
    UpdateFormApi.setValues({
      id: res.id,
      productName: res.productName,
      price: res.price,
      categoryId: res.categoryId,
      description: res.description,
      previewImage: [imageFile],
    });
  },
});

/**
 * 创建商品
 */
function onCreateProduct() {
  createdrawerApi.open();
}

/**
 * 编辑商品
 */
function onEditProduct(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 标准化提交值
 */
function normalizeSubmitValues(values: Record<string, any>) {
  const payload = { ...values };
  // 处理图片上传结果
  if (payload.previewImage && Array.isArray(payload.previewImage)) {
    const files = toRaw(payload.previewImage) as UploadFile[];
    const doneFile = files.find((file) => file.status === 'success');
    if (doneFile) {
      // 优先使用response中的key
      const response = doneFile.response as
        | undefined
        | { key?: string; url?: string };
      if (response?.key) {
        payload.previewImage = response.key;
      } else if (response?.url) {
        // 从response.url中提取key
        payload.previewImage = getFileUrl(response.url);
      } else if (doneFile.url) {
        // 从url中提取key
        payload.previewImage = getFileUrl(doneFile.url);
      } else {
        // 如果没有找到有效的图片，保持原值
        payload.previewImage = values.previewImage;
      }
    } else if (files.length > 0) {
      // 如果有文件但状态不是success，可能是编辑时的已有图片
      const existingFile = files[0];
      if (existingFile) {
        const response = existingFile.response as undefined | { key?: string };
        if (response?.key) {
          payload.previewImage = response.key;
        } else if (existingFile.url) {
          payload.previewImage = getFileUrl(existingFile.url);
        }
      }
    }
  }
  // 价格需要是数字
  if (payload.price !== undefined && payload.price !== null) {
    payload.price = Number(payload.price);
  }
  // 分类ID需要是数字
  if (payload.categoryId !== undefined && payload.categoryId !== null) {
    payload.categoryId = Number(payload.categoryId);
  }
  return payload;
}

/**
 * 创建商品
 */
function onCreate(values: Record<string, any>) {
  const payload = normalizeSubmitValues(values);
  createProductApi(payload as ProductApi.CreateProductParams).then(() => {
    createdrawerApi.close();
    GridApi.reload();
  });
}

/**
 * 更新商品
 */
function onUpdate(values: Record<string, any>) {
  const payload = normalizeSubmitValues(values);
  updateProductApi(payload as ProductApi.UpdateProductParams).then(() => {
    updatedrawerApi.close();
    GridApi.reload();
  });
}

/**
 * 删除商品
 */
function onDeleteProduct(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.productName}】的商品吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(() => {
    deleteProductApi(row.id).then(() => {
      GridApi.reload();
    });
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['admin']">
          <ElButton class="mr-2" type="primary" @click="onCreateProduct">
            添加商品
          </ElButton>
        </AccessControl>
      </template>
      <template #image="{ row }">
        <img
          v-if="row.previewImage"
          :src="getFileUrl(row.previewImage)"
          alt="商品图片"
          style="
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
          "
        />
        <span v-else>-</span>
      </template>
      <template #price="{ row }"> ¥{{ row.price?.toFixed(2) }} </template>
      <template #category="{ row }">
        {{ getCategoryName(row.categoryId, categoryTree) }}
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['admin']">
          <ElButton type="primary" @click="onEditProduct(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['admin']">
          <ElButton type="danger" @click="onDeleteProduct(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    <CreateDrawer title="创建商品">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑商品">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>
