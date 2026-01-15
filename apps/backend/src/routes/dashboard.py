from flask import Blueprint, jsonify
from src.services.cookie_service import get_cookie_service
from src.db.db_manager import db_manager
import sqlite3
import datetime
import json

# 创建蓝图
bp = Blueprint('dashboard', __name__)

# 获取仪表盘统计数据
@bp.route('/getDashboardStats', methods=['GET'])
async def get_dashboard_stats():
    try:
        # 连接到数据库
        conn = sqlite3.connect(db_manager.get_db_path())
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 账号统计 - 与getValidAccounts保持一致的逻辑
        # 获取所有账号
        cursor.execute('SELECT * FROM user_info')
        rows = cursor.fetchall()
        rows_list = [list(row) for row in rows]

        # 实时验证每个账号状态
        total_accounts = len(rows_list)
        normal_accounts = 0
        abnormal_accounts = 0

        for row in rows_list:
            flag = await get_cookie_service().check_cookie(row[1], row[2])
            if flag:
                normal_accounts += 1
                # 更新数据库状态为正常
                if row[4] != 1:
                    cursor.execute('UPDATE user_info SET status = ? WHERE id = ?', (1, row[0]))
            else:
                abnormal_accounts += 1
                # 更新数据库状态为异常
                if row[4] != 0:
                    cursor.execute('UPDATE user_info SET status = ? WHERE id = ?', (0, row[0]))

        # 提交数据库更新
        conn.commit()

        # 平台统计 - 根据实际账号数据计算
        cursor.execute('SELECT type, COUNT(*) as count FROM user_info GROUP BY type')
        platform_counts = cursor.fetchall()

        # 初始化平台统计数据
        platform_stats = {
            'kuaishou': 0,
            'douyin': 0,
            'channels': 0,
            'xiaohongshu': 0
        }

        # 根据type字段映射到平台名称
        type_to_platform = {
            1: 'xiaohongshu',  # 小红书
            2: 'channels',     # 视频号
            3: 'douyin',       # 抖音
            4: 'kuaishou'      # 快手
        }

        # 统计各平台账号数量
        for row in platform_counts:
            platform = type_to_platform.get(row['type'], None)
            if platform:
                platform_stats[platform] = row['count']

        # 基于实际业务逻辑生成统计数据

        # 1. 任务统计 - 从数据库查询
        cursor.execute('SELECT status, COUNT(*) FROM tasks GROUP BY status')
        task_counts = cursor.fetchall()

        task_stats = {
            'total': 0,
            'completed': 0,
            'inProgress': 0,
            'failed': 0,
            'waiting': 0
        }

        for row in task_counts:
            status = row[0]
            count = row[1]
            task_stats['total'] += count
            if status == 'completed':
                task_stats['completed'] += count
            elif status in ['uploading', 'processing']:
                task_stats['inProgress'] += count
            elif status == 'failed':
                task_stats['failed'] += count
            elif status == 'waiting':
                task_stats['waiting'] += count

        # 2. 内容统计 - 暂时置为0，后续可关联 file_records 或 published tasks
        # 或者简单查询 file_records 表
        cursor.execute('SELECT COUNT(*) FROM file_records')
        file_count_row = cursor.fetchone()
        file_count = file_count_row[0] if file_count_row else 0

        content_stats = {
            'total': file_count,
            'published': task_stats['completed'], # 假设已完成的任务即为已发布
            'draft': max(0, file_count - task_stats['completed']) # 剩余的视为草稿/素材
        }

        # 3. 任务趋势 - 查询最近7天数据
        today = datetime.datetime.now()
        seven_days_ago = today - datetime.timedelta(days=6)
        seven_days_ago_str = seven_days_ago.strftime('%Y-%m-%d 00:00:00')

        cursor.execute('''
            SELECT date(created_at) as day, status, COUNT(*)
            FROM tasks
            WHERE created_at >= ?
            GROUP BY day, status
        ''', (seven_days_ago_str,))
        trend_rows = cursor.fetchall()

        # 初始化趋势数据结构
        task_trend = {
            'xAxis': [],
            'series': [
                {'name': '完成任务', 'data': []},
                {'name': '失败任务', 'data': []}
            ]
        }

        # 构建日期映射
        trend_map = {}
        for i in range(6, -1, -1):
            date = today - datetime.timedelta(days=i)
            date_key = date.strftime('%Y-%m-%d')
            display_date = f"{date.month}-{date.day}"
            task_trend['xAxis'].append(display_date)
            trend_map[date_key] = {'completed': 0, 'failed': 0}

        # 填充查询数据
        for row in trend_rows:
            day = row[0]
            status = row[1]
            count = row[2]
            if day in trend_map:
                if status == 'completed':
                    trend_map[day]['completed'] += count
                elif status == 'failed':
                    trend_map[day]['failed'] += count

        # 转换为列表
        for i in range(6, -1, -1):
            date = today - datetime.timedelta(days=i)
            date_key = date.strftime('%Y-%m-%d')
            task_trend['series'][0]['data'].append(trend_map[date_key]['completed'])
            task_trend['series'][1]['data'].append(trend_map[date_key]['failed'])

        # 4. 内容发布统计 - 暂时置为0
        content_publish_stats = {
            'xAxis': ['快手', '抖音', '视频号', '小红书'],
            'series': [
                {'name': '已发布', 'data': [0, 0, 0, 0]},
                {'name': '草稿', 'data': [0, 0, 0, 0]}
            ]
        }

        # 5. 最近任务列表 - 查询真实任务
        cursor.execute('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5')
        recent_tasks_rows = cursor.fetchall()
        recent_tasks = []

        for row in recent_tasks_rows:
            task_dict = dict(row)
            try:
                task_dict['platforms'] = json.loads(row['platforms']) if row['platforms'] else []
            except:
                task_dict['platforms'] = []

            try:
                task_dict['account_list'] = json.loads(row['account_list']) if row['account_list'] else []
            except:
                task_dict['account_list'] = []

            recent_tasks.append(task_dict)

        return jsonify({
            "code": 200,
            "msg": "获取数据成功",
            "data": {
                "accountStats": {
                    "total": total_accounts,
                    "normal": normal_accounts,
                    "abnormal": abnormal_accounts
                },
                "platformStats": platform_stats,
                "taskStats": task_stats,
                "contentStats": content_stats,
                "taskTrend": task_trend,
                "contentStatsData": content_publish_stats,
                "recentTasks": recent_tasks
            }
        }), 200
    except Exception as e:
        print(f"获取仪表盘数据失败: {e}")
        return jsonify({
            "code": 500,
            "msg": f"获取数据失败: {str(e)}",
            "data": None
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()
