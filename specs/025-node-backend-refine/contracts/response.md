# API Contracts: Refined Response Envelopes

Node 后端必须遵循以下标准响应结构，以确保与 Python 后端对等。

## 1. 标准成功响应 (Standard Success)

**Status Code**: `200 OK`

```json
{
    "code": 200,
    "msg": "success" | null,
    "data": { ... } | null
}
```

## 2. 账号锁定冲突 (Account Locked)

**Status Code**: `423 Locked`

当尝试启动一个正在被其他任务占用的账号时返回。

```json
{
    "code": 423,
    "msg": "账号正在使用中，请稍后再试",
    "data": null
}
```

## 3. 非法路径拦截 (Path Traversal Rejection)

**Status Code**: `400 Bad Request`

当请求的路径尝试逃逸预定义的根目录时返回。

```json
{
    "code": 400,
    "msg": "非法的文件路径",
    "data": null
}
```

## 4. 账号详细状态 (Detailed Account Status)

**GET** `/getAccountStatus`

```json
{
    "code": 200,
    "msg": null,
    "data": {
        "id": 1,
        "type": 3,
        "userName": "test_user",
        "status": 1,
        "statusText": "正常",
        "isValid": true,
        "last_validated_at": "2026-03-10 10:00:00"
    }
}
```
