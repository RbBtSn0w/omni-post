import sqlite3

from flask import Blueprint, jsonify, request
from src.db.db_manager import db_manager
from src.services.cookie_service import get_cookie_service

# 创建蓝图
bp = Blueprint("account", __name__)


@bp.route("/getAccounts", methods=["GET"])
def getAccounts():
    """快速获取所有账号信息，不进行cookie验证"""
    try:
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
            SELECT * FROM user_info""")
            rows = cursor.fetchall()
            rows_list = [list(row) for row in rows]

            print("\n📋 当前数据表内容（快速获取）：")
            for row in rows:
                print(row)

            return jsonify({"code": 200, "msg": None, "data": rows_list}), 200
    except Exception as e:
        print(f"获取账号列表时出错: {str(e)}")
        return jsonify({"code": 500, "msg": f"获取账号列表失败: {str(e)}", "data": None}), 500


@bp.route("/getValidAccounts", methods=["GET"])
async def getValidAccounts():
    # 获取账号ID参数，如果提供则只验证单个账号
    account_id = request.args.get("id")
    # 强制刷新参数，跳过冷却期检查
    force_refresh = request.args.get("force", "false").lower() == "true"

    # 验证冷却期（秒）- 刚登录成功的账号在此时间内跳过二次验证
    VALIDATION_COOLDOWN_SECONDS = 300  # 5分钟冷却期，减少不必要的浏览器验证

    with sqlite3.connect(db_manager.get_db_path()) as conn:
        cursor = conn.cursor()

        # 根据是否提供id参数决定查询范围
        if account_id:
            cursor.execute(
                """
            SELECT id, type, filePath, userName, status, group_id, created_at, last_validated_at
            FROM user_info WHERE id = ?""",
                (account_id,),
            )
        else:
            cursor.execute("""
            SELECT id, type, filePath, userName, status, group_id, created_at, last_validated_at
            FROM user_info""")

        rows = cursor.fetchall()
        rows_list = [list(row) for row in rows]

        print("\n📋 当前数据表内容：")
        for row in rows:
            print(row)

        for row in rows_list:
            account_id_val = row[0]
            account_type = row[1]
            file_path = row[2]
            current_status = row[4]
            last_validated_at = row[7]  # 最后验证时间

            # 检查是否在验证冷却期内（除非强制刷新）
            should_skip_validation = False
            if not force_refresh and last_validated_at:
                from datetime import datetime, timedelta

                try:
                    # SQLite 时间格式
                    validated_time = datetime.strptime(last_validated_at, "%Y-%m-%d %H:%M:%S")
                    cooldown_end = validated_time + timedelta(seconds=VALIDATION_COOLDOWN_SECONDS)
                    if datetime.now() < cooldown_end:
                        should_skip_validation = True
                        print(
                            f"⏭️ 账号 {row[3]} 在冷却期内，跳过验证 (上次验证: {last_validated_at})"
                        )
                except Exception as e:
                    print(f"⚠️ 解析验证时间失败: {e}")

            if should_skip_validation:
                # 保持当前状态，不重新验证
                continue

            flag = await get_cookie_service().check_cookie(account_type, file_path)
            if not flag:
                row[4] = 0
                cursor.execute(
                    """
                UPDATE user_info
                SET status = ?, last_validated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                    (0, account_id_val),
                )
                conn.commit()
                print("✅ 用户状态已更新")
            else:
                # 如果状态正常，确保数据库中也是正常状态
                row[4] = 1
                cursor.execute(
                    """
                UPDATE user_info
                SET status = ?, last_validated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                    (1, account_id_val),
                )
                conn.commit()
                if current_status != 1:
                    print("✅ 用户状态已更新为正常")

        for row in rows:
            print(row)

        return jsonify({"code": 200, "msg": None, "data": rows_list}), 200


@bp.route("/getAccountStatus", methods=["GET"])
async def getAccountStatus():
    """获取单个账号的实时状态"""
    account_id = request.args.get("id")

    if not account_id:
        return jsonify({"code": 400, "msg": "缺少账号ID参数", "data": None}), 400

    try:
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            # 查询账号信息
            cursor.execute("SELECT * FROM user_info WHERE id = ?", (account_id,))
            row = cursor.fetchone()

            if not row:
                return jsonify({"code": 404, "msg": "账号不存在", "data": None}), 404

            row_list = list(row)
            # 验证cookie状态
            flag = await get_cookie_service().check_cookie(row_list[1], row_list[2])
            current_status = 1 if flag else 0

            # 更新数据库状态
            if row_list[4] != current_status:
                cursor.execute(
                    """
                UPDATE user_info
                SET status = ?
                WHERE id = ?
                """,
                    (current_status, account_id),
                )
                conn.commit()
                row_list[4] = current_status

            # 返回标准化的状态信息
            return (
                jsonify(
                    {
                        "code": 200,
                        "msg": None,
                        "data": {
                            "id": row_list[0],
                            "type": row_list[1],
                            "filePath": row_list[2],
                            "userName": row_list[3],
                            "status": current_status,
                            "statusText": "正常" if current_status == 1 else "异常",
                            "isValid": flag,
                        },
                    }
                ),
                200,
            )

    except Exception as e:
        print(f"获取账号状态时出错: {str(e)}")
        return jsonify({"code": 500, "msg": f"获取账号状态失败: {str(e)}", "data": None}), 500


@bp.route("/deleteAccount", methods=["GET"])
def delete_account():
    account_id = int(request.args.get("id"))

    try:
        # 获取数据库连接
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # 查询要删除的记录
            cursor.execute("SELECT * FROM user_info WHERE id = ?", (account_id,))
            record = cursor.fetchone()

            if not record:
                return jsonify({"code": 404, "msg": "account not found", "data": None}), 404

            record = dict(record)

            # 删除关联的 Cookie 文件
            file_path = record.get("filePath")
            if file_path:
                from pathlib import Path

                from src.core.config import COOKIES_DIR

                cookie_file = COOKIES_DIR / file_path
                if cookie_file.exists():
                    try:
                        cookie_file.unlink()
                        print(f"✅ Cookie 文件已删除: {cookie_file}")
                    except Exception as file_error:
                        print(f"⚠️ 删除 Cookie 文件失败: {file_error}")
                        # 文件删除失败不影响账号删除
                else:
                    print(f"ℹ️ Cookie 文件不存在: {cookie_file}")

            # 删除数据库记录
            cursor.execute("DELETE FROM user_info WHERE id = ?", (account_id,))
            conn.commit()

        return jsonify({"code": 200, "msg": "account deleted successfully", "data": None}), 200

    except Exception as e:
        return jsonify({"code": 500, "msg": str("delete failed!"), "data": None}), 500


@bp.route("/updateUserinfo", methods=["POST"])
def updateUserinfo():
    # 获取JSON数据
    data = request.get_json()

    # 从JSON数据中提取 type 和 userName
    user_id = data.get("id")
    type = data.get("type")
    userName = data.get("userName")
    try:
        # 获取数据库连接
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # 更新数据库记录
            cursor.execute(
                """
                           UPDATE user_info
                           SET type     = ?,
                               userName = ?
                           WHERE id = ?;
                           """,
                (type, userName, user_id),
            )
            conn.commit()

        return jsonify({"code": 200, "msg": "account update successfully", "data": None}), 200

    except Exception as e:
        return jsonify({"code": 500, "msg": str("update failed!"), "data": None}), 500
