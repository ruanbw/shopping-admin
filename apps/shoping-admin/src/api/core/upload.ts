import { requestClient } from '#/api/request';

/**
 * 文件分类类型
 */
export type FileType = 'AVATAR' | 'PRODUCT' | 'GENERAL';

/**
 * 文件上传响应
 */
export interface UploadResponse {
  /**
   * 文件key，用于拼接完整URL
   */
  key: string;
}

interface UploadFileParams {
  file: File;
  type: FileType;
  onError?: (error: Error) => void;
  onProgress?: (progress: { percent: number }) => void;
  onSuccess?: (data: UploadResponse, file: File) => void;
}

/**
 * 上传文件
 * @param params 上传参数
 */
export async function uploadFile({
  file,
  type,
  onError,
  onProgress,
  onSuccess,
}: UploadFileParams) {
  try {
    onProgress?.({ percent: 0 });

    const data = await requestClient.upload<UploadResponse>('/file/upload', {
      file,
      type,
    });

    onProgress?.({ percent: 100 });
    onSuccess?.(data, file);
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

