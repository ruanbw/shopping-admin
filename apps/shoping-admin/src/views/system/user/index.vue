<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption, UserInfo } from '@vben/types';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { UserApi } from '#/api/core/user';

import { onMounted, ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElMessageBox, ElTag } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createUserApi,
  deleteUserApi,
  getRoleOptionsApi,
  getUserApi,
  getUserListApi,
  updateUserApi,
} from '#/api';

interface RowType extends UserApi.PaginatedUser {
  password: string;
}

/**
 * 用户状态映射
 */
const statusMap = {
  0: {
    color: 'primary',
    label: '正常',
  },
  1: {
    color: 'danger',
    label: '冻结',
  },
  2: {
    color: 'danger',
    label: '删除',
  },
};

const statusOptions = Object.values(statusMap).map((item, index) => ({
  label: item.label,
  value: index.toString(),
}));

const roleOptions = ref<BasicOption[]>([]);

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
 * 加载角色选项
 */
async function loadRoleOptions() {
  const result = await getRoleOptionsApi();
  // select组件需要的选项格式,value需要是字符串
  const options = result.map((item) => ({
    label: item.label,
    value: item.value.toString(),
  }));
  roleOptions.value = options;
}

onMounted(() => loadRoleOptions());

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
        placeholder: 'Please enter username',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'username',
      label: '用户名',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: 'Please enter real name',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'realName',
      label: '昵称',
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
    { field: 'avatar', title: '头像', cellRender: { name: 'CellImage' } },
    { field: 'username', title: '用户名' },
    { field: 'realName', title: '昵称' },
    { field: 'mobile', title: '手机号' },
    {
      field: 'status',
      title: '状态',
      slots: { default: 'status' },
    },
    { field: 'createAt', title: '创建时间' },
    { field: 'action', title: '操作', slots: { default: 'action' } },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'records',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        return await getUserListApi({
          current: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
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
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
    },
    // 字段名
    fieldName: 'realName',
    // 界面显示的label
    label: '昵称',
    rules: 'required',
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
    },
    // 字段名
    fieldName: 'username',
    // 界面显示的label
    label: '用户名',
    dependencies: {
      disabled: (values) => !!values.id,
      triggerFields: ['id'],
    },
    rules: 'required',
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
    },
    // 字段名
    fieldName: 'password',
    // 界面显示的label
    label: '密码',
    dependencies: {
      rules: (values) => {
        if (values.id) {
          return null;
        }
        return 'required';
      },
      triggerFields: ['id'],
    },
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'VbenSelect',
    // 对应组件的参数
    componentProps: {
      options: statusOptions,
      placeholder: '请选择',
    },
    // 字段名
    fieldName: 'status',
    // 界面显示的label
    label: '状态',
    dependencies: {
      rules: (values) => {
        if (values.id) {
          return 'required';
        }
        return null;
      },
      triggerFields: ['id'],
    },
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Select',
    // 对应组件的参数
    componentProps: {
      filterable: true,
      multiple: true,
      options: [],
      placeholder: '请选择',
    },
    // 字段名
    fieldName: 'roleIds',
    // 界面显示的label
    label: '角色',
    rules: 'required',
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
      type: 'textarea',
    },
    // 字段名
    fieldName: 'description',
    // 界面显示的label
    label: '描述',
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
    },
    // 字段名
    fieldName: 'mobile',
    // 界面显示的label
    label: '手机号',
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
    },
    // 字段名
    fieldName: 'avatar',
    // 界面显示的label
    label: '头像',
  },
];

const [CreateForm, CreateFormApi] = useVbenForm({
  // 提交函数
  handleSubmit: onCreate,
  schema,
});

/**
 * 编辑表单选项
 */
const [UpdateForm, UpdateFormApi] = useVbenForm({
  // 提交函数
  handleSubmit: onUpdate,
  schema: [
    {
      // 组件需要在 #/adapter.ts内注册，并加上类型
      component: 'Input',
      // 对应组件的参数
      componentProps: {
        placeholder: '请输入',
        disabled: true,
      },
      // 字段名
      fieldName: 'id',
      // 界面显示的label
      label: '用户ID',
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
    if (!roleOptions.value?.length) {
      await loadRoleOptions();
    }
    CreateFormApi.updateSchema([
      {
        fieldName: 'roleIds',
        componentProps: { options: roleOptions.value },
      },
    ]);
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
    const res = await getUserApi(row.id);
    const payload: UserInfo = {
      ...res,
      // 状态需要是字符串,select组件需要的选项格式,value需要是字符串
      status: res.status?.toString?.() ?? '',
    };
    (payload as any).roleIds = Array.isArray(res.roleIds)
      ? res.roleIds.map((v: number) => v.toString())
      : [];
    UpdateFormApi.setValues(payload);
    if (!roleOptions.value?.length) {
      await loadRoleOptions();
    }
    UpdateFormApi.updateSchema([
      {
        fieldName: 'roleIds',
        componentProps: { options: roleOptions.value },
      },
    ]);
  },
});

/**
 * 创建用户
 */
function onCreateUser() {
  createdrawerApi.open();
}

/**
 * 编辑用户
 */
function onEditUser(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 标准化提交值
 */
function normalizeSubmitValues(values: Record<string, any>) {
  const payload = { ...values };
  // 状态需要是数字,否则会导致后端无法正确处理
  if (payload.status !== undefined && payload.status !== null) {
    payload.status = Number(payload.status);
  }
  // 角色id需要是数组,数组中的元素需要是数字,否则会导致后端无法正确处理
  const roleIds = Array.isArray(payload.roleIds)
    ? payload.roleIds
        .map(Number)
        .filter((value: number) => Number.isFinite(value))
    : [];
  payload.roleIds = roleIds;
  return payload;
}

/**
 * 创建用户
 */
function onCreate(values: Record<string, any>) {
  const payload = normalizeSubmitValues(values);
  createUserApi(payload as UserApi.CreateUserParams).then(() => {
    createdrawerApi.close();
    GridApi.reload();
  });
}

/**
 * 更新用户
 */
function onUpdate(values: Record<string, any>) {
  const payload = normalizeSubmitValues(values);
  updateUserApi(payload as UserApi.UpdateUserParams).then(() => {
    updatedrawerApi.close();
    GridApi.reload();
  });
}

/**
 * 删除用户
 */
function onDeleteUser(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.username}】的用户吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(() => {
    deleteUserApi(row.id!);
    GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <ElButton class="mr-2" type="primary" @click="onCreateUser">
          添加用户
        </ElButton>
      </template>
      <template #status="{ row }">
        <ElTag
          :type="
            row.status === 0
              ? 'success'
              : row.status === 1
                ? 'warning'
                : 'danger'
          "
        >
          {{ row.status === 0 ? '正常' : row.status === 1 ? '冻结' : '删除' }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <ElButton type="primary" @click="onEditUser(row)">编辑</ElButton>
        <ElButton type="danger" @click="onDeleteUser(row)">删除</ElButton>
      </template>
    </Grid>
    <CreateDrawer title="创建用户">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑用户">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>
