import os
import sqlite3
import uuid
from pathlib import Path

from flask import Blueprint, jsonify, request, send_from_directory
from src.core.config import MAX_UPLOAD_SIZE, VIDEOS_DIR
from src.db.db_manager import db_manager

# 创建蓝图
bp = Blueprint("file", __name__)


@bp.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"code": 200, "data": None, "msg": "No file part in the request"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"code": 200, "data": None, "msg": "No selected file"}), 400
    try:
        # 保存文件到指定位置
        uuid_v1 = uuid.uuid1()
        print(f"UUID v1: {uuid_v1}")
        filepath = VIDEOS_DIR / f"{uuid_v1}_{file.filename}"
        file.save(filepath)
        return (
            jsonify(
                {
                    "code": 200,
                    "msg": "File uploaded successfully",
                    "data": f"{uuid_v1}_{file.filename}",
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"code": 200, "msg": str(e), "data": None}), 500


@bp.route("/getFile", methods=["GET"])
def get_file():
    # 获取 filename 参数
    filename = request.args.get("filename")

    if not filename:
        return {"error": "filename is required"}, 400

    # 防止路径穿越攻击
    if ".." in filename or filename.startswith("/"):
        return {"error": "Invalid filename"}, 400

    # 拼接完整路径
    file_path = str(VIDEOS_DIR)

    # 返回文件
    return send_from_directory(file_path, filename)


@bp.route("/uploadSave", methods=["POST"])
def upload_save():
    if "file" not in request.files:
        return jsonify({"code": 400, "data": None, "msg": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"code": 400, "data": None, "msg": "No selected file"}), 400

    # 添加文件大小检查
    if file.content_length and file.content_length > MAX_UPLOAD_SIZE:
        return (
            jsonify(
                {
                    "code": 400,
                    "msg": f"File too large. Maximum size allowed is {MAX_UPLOAD_SIZE / (1024*1024)}MB",
                    "data": None,
                }
            ),
            400,
        )

    # 获取表单中的自定义文件名（可选）
    custom_filename = request.form.get("filename", None)
    if custom_filename:
        filename = custom_filename + "." + file.filename.split(".")[-1]
    else:
        filename = file.filename

    try:
        # 生成 UUID v1
        uuid_v1 = uuid.uuid1()
        print(f"UUID v1: {uuid_v1}")

        # 构造文件名和路径
        final_filename = f"{uuid_v1}_{filename}"
        filepath = VIDEOS_DIR / f"{uuid_v1}_{filename}"

        # 保存文件
        file.save(filepath)

        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                                INSERT INTO file_records (filename, filesize, file_path)
            VALUES (?, ?, ?)
                                """,
                (
                    filename,
                    round(float(os.path.getsize(filepath)) / (1024 * 1024), 2),
                    final_filename,
                ),
            )
            conn.commit()
            print("✅ 上传文件已记录")

        return (
            jsonify(
                {
                    "code": 200,
                    "msg": "File uploaded and saved successfully",
                    "data": {"filename": filename, "filepath": final_filename},
                }
            ),
            200,
        )

    except Exception as e:
        print(f"Upload failed: {e}")
        return jsonify({"code": 500, "msg": f"upload failed: {e}", "data": None}), 500


@bp.route("/getFiles", methods=["GET"])
def get_all_files():
    try:
        # 使用 with 自动管理数据库连接
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            conn.row_factory = sqlite3.Row  # 允许通过列名访问结果
            cursor = conn.cursor()

            # 查询所有记录
            cursor.execute("SELECT * FROM file_records")
            rows = cursor.fetchall()

            # 将结果转为字典列表，并提取UUID
            data = []
            for row in rows:
                row_dict = dict(row)
                # 从 file_path 中提取 UUID (文件名的第一部分，下划线前)
                if row_dict.get("file_path"):
                    file_path_parts = row_dict["file_path"].split("_", 1)  # 只分割第一个下划线
                    if len(file_path_parts) > 0:
                        row_dict["uuid"] = file_path_parts[0]  # UUID 部分
                    else:
                        row_dict["uuid"] = ""
                else:
                    row_dict["uuid"] = ""
                data.append(row_dict)

            return jsonify({"code": 200, "msg": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"code": 500, "msg": str("get file failed!"), "data": None}), 500


@bp.route("/deleteFile", methods=["GET"])
def delete_file():
    file_id = request.args.get("id")

    if not file_id or not file_id.isdigit():
        return jsonify({"code": 400, "msg": "Invalid or missing file ID", "data": None}), 400

    try:
        # 获取数据库连接
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # 查询要删除的记录
            cursor.execute("SELECT * FROM file_records WHERE id = ?", (file_id,))
            record = cursor.fetchone()

            if not record:
                return jsonify({"code": 404, "msg": "File not found", "data": None}), 404

            record = dict(record)

            # 获取文件路径并删除实际文件
            file_path = VIDEOS_DIR / record["file_path"]
            if file_path.exists():
                try:
                    file_path.unlink()  # 删除文件
                    print(f"✅ 实际文件已删除: {file_path}")
                except Exception as e:
                    print(f"⚠️ 删除实际文件失败: {e}")
                    # 即使删除文件失败，也要继续删除数据库记录，避免数据不一致
            else:
                print(f"⚠️ 实际文件不存在: {file_path}")

            # 删除数据库记录
            cursor.execute("DELETE FROM file_records WHERE id = ?", (file_id,))
            conn.commit()

        return (
            jsonify(
                {
                    "code": 200,
                    "msg": "File deleted successfully",
                    "data": {"id": record["id"], "filename": record["filename"]},
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"code": 500, "msg": str("delete failed!"), "data": None}), 500
