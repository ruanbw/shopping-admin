import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface SigninParams {
    username: string;
    password: string;
  }

  /** 注册接口参数 */
  export interface SignupParams {
    username: string;
    password: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    tokenName: string;
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
  return requestClient.post('/auth/simple_register', data);
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.get('/auth/signup');
}
