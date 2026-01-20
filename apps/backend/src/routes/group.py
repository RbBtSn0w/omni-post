"""
账号组管理路由
"""

import sqlite3
from datetime import datetime

from flask import Blueprint, jsonify, request

from ..db.db_manager import db_manager

group_bp = Blueprint("group", __name__)


@group_bp.route("/getGroups", methods=["GET"])
def get_groups():
    """获取所有账号组"""
    try:
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT g.*,
                       COUNT(u.id) as account_count
                FROM account_groups g
                LEFT JOIN user_info u ON g.id = u.group_id
                GROUP BY g.id
                ORDER BY g.created_at DESC
            """)
            groups = [dict(row) for row in cursor.fetchall()]
            return jsonify({"code": 200, "message": "获取成功", "data": groups})
    except Exception as e:
        return jsonify({"code": 500, "message": f"获取账号组失败: {str(e)}"})


@group_bp.route("/createGroup", methods=["POST"])
def create_group():
    """创建账号组"""
    try:
        data = request.get_json()
        name = data.get("name", "").strip()
        description = data.get("description", "")

        if not name:
            return jsonify({"code": 400, "message": "组名称不能为空"})

        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO account_groups (name, description)
                VALUES (?, ?)
            """,
                (name, description),
            )
            conn.commit()

            group_id = cursor.lastrowid
            return jsonify(
                {
                    "code": 200,
                    "message": "创建成功",
                    "data": {"id": group_id, "name": name, "description": description},
                }
            )
    except sqlite3.IntegrityError:
        return jsonify({"code": 400, "message": "组名称已存在"})
    except Exception as e:
        return jsonify({"code": 500, "message": f"创建账号组失败: {str(e)}"})


@group_bp.route("/updateGroup/<int:group_id>", methods=["PUT"])
def update_group(group_id):
    """更新账号组"""
    try:
        data = request.get_json()
        name = data.get("name", "").strip()
        description = data.get("description", "")

        if not name:
            return jsonify({"code": 400, "message": "组名称不能为空"})

        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE account_groups
                SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """,
                (name, description, group_id),
            )
            conn.commit()

            if cursor.rowcount == 0:
                return jsonify({"code": 404, "message": "账号组不存在"})

            return jsonify({"code": 200, "message": "更新成功"})
    except sqlite3.IntegrityError:
        return jsonify({"code": 400, "message": "组名称已存在"})
    except Exception as e:
        return jsonify({"code": 500, "message": f"更新账号组失败: {str(e)}"})


@group_bp.route("/deleteGroup/<int:group_id>", methods=["DELETE"])
def delete_group(group_id):
    """删除账号组"""
    try:
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()

            # 检查是否有账号关联到此组
            cursor.execute("SELECT COUNT(*) FROM user_info WHERE group_id = ?", (group_id,))
            account_count = cursor.fetchone()[0]

            if account_count > 0:
                return jsonify(
                    {"code": 400, "message": f"无法删除：该组下有 {account_count} 个账号"}
                )

            cursor.execute("DELETE FROM account_groups WHERE id = ?", (group_id,))
            conn.commit()

            if cursor.rowcount == 0:
                return jsonify({"code": 404, "message": "账号组不存在"})

            return jsonify({"code": 200, "message": "删除成功"})
    except Exception as e:
        return jsonify({"code": 500, "message": f"删除账号组失败: {str(e)}"})


@group_bp.route("/getGroupAccounts/<int:group_id>", methods=["GET"])
def get_group_accounts(group_id):
    """获取组内所有账号"""
    try:
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT * FROM user_info WHERE group_id = ?
            """,
                (group_id,),
            )
            accounts = [dict(row) for row in cursor.fetchall()]
            return jsonify({"code": 200, "message": "获取成功", "data": accounts})
    except Exception as e:
        return jsonify({"code": 500, "message": f"获取组内账号失败: {str(e)}"})
