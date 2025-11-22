<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CategoryApi } from '#/api/core/category';

import { onMounted, ref } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElMessageBox } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoryApi,
  getCategoryListApi,
  updateCategoryApi,
} from '#/api';

interface RowType extends CategoryApi.Category {}

/**
 * 获取父级分类名称
 */
function getParentCategoryName(
  parentId: null | number,
  categories: CategoryApi.Category[],
): string {
  if (!parentId) return '-';
  const findCategory = (
    list: CategoryApi.Category[],
  ): CategoryApi.Category | null => {
    for (const item of list) {
      if (item.id === parentId) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = findCategory(item.children);
        if (found) return found;
      }
    }
    return null;
  };
  const parent = findCategory(categories);
  return parent ? parent.categoryName : '-';
}

/**
 * 过滤树型数据（保持树型结构）
 */
function filterTree(
  tree: CategoryApi.Category[],
  keyword: string,
): CategoryApi.Category[] {
  if (!keyword) return tree;
  const filtered: CategoryApi.Category[] = [];
  tree.forEach((node) => {
    const match =
      node.categoryName.toLowerCase().includes(keyword.toLowerCase()) ||
      (node.description &&
        node.description.toLowerCase().includes(keyword.toLowerCase()));
    const filteredChildren =
      node.children && node.children.length > 0
        ? filterTree(node.children, keyword)
        : [];
    if (match || filteredChildren.length > 0) {
      filtered.push({
        ...node,
        children: filteredChildren,
      });
    }
  });
  return filtered;
}

const categoryTree = ref<CategoryApi.Category[]>([]);

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
 * 加载分类列表
 */
async function loadCategoryList() {
  const result = await getCategoryListApi();
  categoryTree.value = result;
}

onMounted(() => loadCategoryList());

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
        placeholder: '请输入分类名称',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'categoryName',
      label: '分类名称',
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
  columns: [
    {
      field: 'categoryName',
      title: '分类名称',
      minWidth: 200,
      treeNode: true,
    },
    {
      field: 'parentId',
      title: '上级分类',
      width: 150,
      slots: { default: 'parentCategory' },
    },
    { field: 'order', title: '排序', width: 100 },
    { field: 'description', title: '描述', minWidth: 200 },
    { field: 'createAt', title: '创建时间', width: 180 },
    {
      field: 'action',
      title: '操作',
      width: 150,
      slots: { default: 'action' },
    },
  ],
  keepSource: true,
  pagerConfig: {
    enabled: false,
  },
  treeConfig: {
    transform: false,
    rowField: 'id',
    parentField: 'parentId',
    childrenField: 'children',
  },
  proxyConfig: {
    response: {
      result: 'items',
      list: 'items',
    },
    ajax: {
      query: async (_params, formValues) => {
        await loadCategoryList();
        let filteredTree = categoryTree.value;
        if (formValues?.categoryName) {
          filteredTree = filterTree(
            categoryTree.value,
            String(formValues.categoryName),
          );
        }
        return {
          items: filteredTree,
          total: filteredTree.length,
        };
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

/**
 * 创建表单选项
 */
const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入分类名称',
      maxlength: 8,
      showWordLimit: true,
    },
    fieldName: 'categoryName',
    label: '分类名称',
    rules: 'required',
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      api: getCategoryListApi,
      placeholder: '请选择上级分类',
      clearable: true,
      labelField: 'categoryName',
      valueField: 'id',
      childrenField: 'children',
      multiple: false,
      showCheckbox: true,
      checkStrictly: true,
    },
    fieldName: 'parentId',
    label: '上级分类',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入排序',
      min: 0,
    },
    defaultValue: 0,
    fieldName: 'order',
    label: '排序',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入分类描述',
      type: 'textarea',
      maxlength: 255,
      showWordLimit: true,
      rows: 3,
    },
    fieldName: 'description',
    label: '分类描述',
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
      label: '分类ID',
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
    await loadCategoryList();
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
    const res = await getCategoryApi(row.id);
    UpdateFormApi.setValues({
      id: res.id,
      categoryName: res.categoryName,
      parentId: res.parentId,
      order: res.order,
      description: res.description || '',
    });
    await loadCategoryList();
  },
});

/**
 * 创建分类
 */
function onCreateCategory() {
  createdrawerApi.open();
}

/**
 * 编辑分类
 */
function onEditCategory(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 创建分类
 */
function onCreate(values: Record<string, any>) {
  const payload: CategoryApi.CreateCategoryParams = {
    categoryName: values.categoryName,
    parentId: values.parentId || undefined,
    order: values.order || 0,
    description: values.description || undefined,
  };
  createCategoryApi(payload).then(() => {
    createdrawerApi.close();
    GridApi.reload();
    loadCategoryList();
  });
}

/**
 * 更新分类
 */
function onUpdate(values: Record<string, any>) {
  const payload: CategoryApi.UpdateCategoryParams = {
    id: values.id,
    categoryName: values.categoryName,
    parentId: values.parentId || undefined,
    order: values.order || 0,
    description: values.description || undefined,
  };
  updateCategoryApi(payload).then(() => {
    updatedrawerApi.close();
    GridApi.reload();
    loadCategoryList();
  });
}

/**
 * 检查是否有子分类
 */
function hasChildren(categoryId: number): boolean {
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
  const category = findCategory(categoryTree.value);
  return category ? (category.children?.length || 0) > 0 : false;
}

/**
 * 删除分类
 */
function onDeleteCategory(row: RowType) {
  if (hasChildren(row.id)) {
    ElMessageBox.alert(
      `分类【${row.categoryName}】下存在子分类，无法删除！`,
      '提示',
      {
        type: 'warning',
      },
    );
    return;
  }
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.categoryName}】的分类吗？`,
    '警告',
    {
      type: 'warning',
    },
  )
    .then(() => {
      deleteCategoryApi(row.id).then(() => {
        GridApi.reload();
        loadCategoryList();
      });
    })
    .catch(() => {
      // 用户取消删除
    });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['admin']">
          <ElButton class="mr-2" type="primary" @click="onCreateCategory">
            添加分类
          </ElButton>
        </AccessControl>
      </template>
      <template #parentCategory="{ row }">
        {{ getParentCategoryName(row.parentId, categoryTree) }}
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['admin']">
          <ElButton type="primary" @click="onEditCategory(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['admin']">
          <ElButton type="danger" @click="onDeleteCategory(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    <CreateDrawer title="创建分类">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑分类">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>
