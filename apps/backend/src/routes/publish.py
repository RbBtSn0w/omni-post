from queue import Queue

from flask import Blueprint, jsonify, request

from src.services.publish_executor import start_publish_thread

# 导入必要服务
from src.services.task_service import task_service

# 创建蓝图
bp = Blueprint("publish", __name__)


# SSE 登录接口
@bp.route("/login")
def login():  # pragma: no cover
    # 1 小红书 2 视频号 3 抖音 4 快手 5 Bilibili
    type = request.args.get("type")
    # 账号名
    id = request.args.get("id")
    # 组名
    group_name = request.args.get("group")

    # 延迟导入，避免循环依赖
    from src.services.login_service import active_queues, run_async_function, sse_stream

    # 模拟一个用于异步通信的队列
    status_queue = Queue()
    active_queues[id] = status_queue

    def on_close():
        print(f"清理队列: {id}")
        del active_queues[id]

    # 启动异步任务线程
    import threading

    thread = threading.Thread(
        target=run_async_function, args=(type, id, status_queue, group_name), daemon=True
    )
    thread.start()
    from flask import Response

    response = Response(
        sse_stream(
            status_queue,
        ),
        mimetype="text/event-stream",
    )
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"  # 关键：禁用 Nginx 缓冲
    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Connection"] = "keep-alive"
    return response


@bp.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = task_service.get_all_tasks()
    return jsonify({"code": 200, "data": tasks})


@bp.route("/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    success = task_service.delete_task(task_id)
    return jsonify({"code": 200, "msg": "Deleted" if success else "Failed"})


@bp.route("/tasks/<task_id>", methods=["PATCH"])
def update_task(task_id):
    data = request.get_json()
    status = data.get("status")
    progress = data.get("progress")

    if status:
        task_service.update_task_status(task_id, status, progress)
        return jsonify({"code": 200, "msg": "Updated"})
    else:
        return jsonify({"code": 400, "msg": "Status required"}), 400


@bp.route("/tasks/<task_id>/start", methods=["POST"])
def start_task(task_id):
    # Fetch task to get original data
    tasks = task_service.get_all_tasks()
    task = next((t for t in tasks if t["id"] == task_id), None)

    if not task:
        return jsonify({"code": 404, "msg": "Task not found"}), 404

    publish_data = task.get("publish_data")
    if not publish_data:
        # Fallback to reconstructing from other fields if possible
        publish_data = {
            "type": task["platforms"][0] if task["platforms"] else 1,
            "title": task["title"],
            "fileList": task["file_list"],
            "accountList": task["account_list"],
            "enableTimer": task["schedule_data"].get("enableTimer"),
            "videosPerDay": task["schedule_data"].get("videosPerDay"),
            "dailyTimes": task["schedule_data"].get("dailyTimes"),
            "startDays": task["schedule_data"].get("startDays"),
        }

    # Filter accounts by platform type
    import sqlite3

    from src.db.db_manager import db_manager

    # Determine platform type (tasks store strictly one platform in the list)
    platform_type = task["platforms"][0]
    account_list = publish_data.get("accountList", [])

    valid_accounts = []

    with sqlite3.connect(db_manager.get_db_path()) as conn:
        cursor = conn.cursor()
        for account_file in account_list:
            cursor.execute("SELECT type FROM user_info WHERE filePath = ?", (account_file,))
            result = cursor.fetchone()
            if result and result[0] == platform_type:
                valid_accounts.append(account_file)

    if not valid_accounts:
        return (
            jsonify(
                {"code": 400, "msg": f"Task has no valid accounts for platform {platform_type}"}
            ),
            400,
        )

    # Update publish_data with only valid accounts
    publish_data["accountList"] = valid_accounts

    # Start Async Execution
    start_publish_thread(task_id, publish_data)
    return jsonify({"code": 200, "msg": "Task started"}), 200


@bp.route("/postVideo", methods=["POST"])
def postVideo():
    # 获取JSON数据
    data = request.get_json()
    platform_type = data.get("type")
    account_list = data.get("accountList", [])

    # 防御性校验：过滤不匹配平台的账号
    import sqlite3

    from src.db.db_manager import db_manager

    valid_accounts = []
    invalid_accounts = []

    with sqlite3.connect(db_manager.get_db_path()) as conn:
        cursor = conn.cursor()
        for account_file in account_list:
            cursor.execute("SELECT type FROM user_info WHERE filePath = ?", (account_file,))
            result = cursor.fetchone()
            if result and result[0] == platform_type:
                valid_accounts.append(account_file)
            else:
                invalid_accounts.append(account_file)

    # 如果有不匹配的账号，记录警告但继续处理有效账号
    if invalid_accounts:
        import logging

        logging.warning(
            f"[PUBLISH] Filtered {len(invalid_accounts)} mismatched accounts for platform {platform_type}: {invalid_accounts}"
        )

    # 如果没有有效账号，返回错误
    if not valid_accounts:
        return (
            jsonify(
                {
                    "code": 400,
                    "msg": f"没有匹配平台 {platform_type} 的有效账号",
                    "data": None,
                }
            ),
            400,
        )

    # 使用过滤后的账号列表
    data["accountList"] = valid_accounts

    # Create Task Record
    task_id = task_service.create_task(
        title=data.get("title", "Untitled"),
        platforms=[platform_type],
        file_list=data.get("fileList", []),
        account_list=valid_accounts,
        schedule_data={
            "enableTimer": data.get("enableTimer"),
            "videosPerDay": data.get("videosPerDay"),
            "dailyTimes": data.get("dailyTimes"),
            "startDays": data.get("startDays"),
        },
        publish_data=data,
        priority=1,
    )

    if task_id:
        # Start Async Execution
        start_publish_thread(task_id, data)
        return jsonify({"code": 200, "msg": "Task started", "data": {"taskId": task_id}}), 200
    else:
        return jsonify({"code": 500, "msg": "Failed to create task", "data": None}), 500


@bp.route("/postVideoBatch", methods=["POST"])
def postVideoBatch():
    data_list = request.get_json()

    if not isinstance(data_list, list):
        return jsonify({"error": "Expected a JSON array"}), 400

    created_tasks = []

    for data in data_list:
        task_id = task_service.create_task(
            title=data.get("title", "Untitled"),
            platforms=[data.get("type")],
            file_list=data.get("fileList", []),
            account_list=data.get("accountList", []),
            schedule_data={
                "enableTimer": data.get("enableTimer"),
                "videosPerDay": data.get("videosPerDay"),
                "dailyTimes": data.get("dailyTimes"),
                "startDays": data.get("startDays"),
            },
            publish_data=data,
            priority=1,
        )
        if task_id:
            start_publish_thread(task_id, data)
            created_tasks.append(task_id)

    # 返回响应给客户端
    return (
        jsonify({"code": 200, "msg": f"Created {len(created_tasks)} tasks", "data": created_tasks}),
        200,
    )
