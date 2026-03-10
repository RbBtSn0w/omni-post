import { type Response } from 'express';

/**
 * 标准 API 响应结构 (FR-007)
 */
export interface ApiResponse<T = any> {
    code: number;
    msg: string | null;
    data: T | null;
}

/**
 * 发送成功响应
 */
export function sendSuccess<T>(res: Response, data: T | null = null, msg: string = 'success'): void {
    const response: ApiResponse<T> = {
        code: 200,
        msg,
        data,
    };
    res.json(response);
}

/**
 * 发送错误响应
 */
export function sendError(res: Response, code: number, msg: string): void {
    const response: ApiResponse = {
        code,
        msg,
        data: null,
    };
    // 如果是标准 HTTP 错误状态码，则设置 status，否则默认 200 (业务错误)
    const status = (code >= 400 && code < 600) ? code : 200;
    res.status(status).json(response);
}
