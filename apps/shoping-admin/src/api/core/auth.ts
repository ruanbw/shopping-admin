import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface SigninParams {
    password?: string;
    username?: string;
  }

  /** 注册接口参数 */
  export interface SignupParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    tokenName: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录
 */
export async function signinApi(data: AuthApi.SigninParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/simple_signin', data);
}

/**
 * 注册
 */
export async function signupApi(data: AuthApi.SignupParams) {
  return requestClient.post('/auth/simple_signup', data);
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.get('/auth/signout', {
    withCredentials: true,
  });
}
/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}
/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
