import pytest
import os
import tempfile
import sys
import sqlite3
from unittest.mock import patch
from pathlib import Path

# Fix import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

@pytest.fixture(scope="session", autouse=True)
def ensure_database_exists():
    """Ensure the actual database file exists with tables before running tests."""
    from src.conf import BASE_DIR
    
    # Get database path
    db_file = Path(BASE_DIR.parent / "data" / "database.db")
    data_dir = db_file.parent
    
    # Ensure data directory exists
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # If database doesn't exist or is empty, initialize it
    if not db_file.exists() or db_file.stat().st_size == 0:
        # Initialize database with tables
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Create account_groups table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS account_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create user_info table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type INTEGER NOT NULL,
            filePath TEXT NOT NULL,
            userName TEXT NOT NULL,
            status INTEGER DEFAULT 0,
            group_id INTEGER,
            UNIQUE(type, userName),
            FOREIGN KEY (group_id) REFERENCES account_groups(id)
        )
        ''')
        
        # Create file_records table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS file_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            filesize REAL,
            upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            file_path TEXT
        )
        ''')
        
        # Create tasks table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT,
            status TEXT,
            progress INTEGER,
            priority INTEGER,
            platforms TEXT,
            file_list TEXT,
            account_list TEXT,
            schedule_data TEXT,
            error_msg TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.commit()
        conn.close()
    
    yield

@pytest.fixture
def temp_db_path():
    """Create a temporary database file."""
    fd, path = tempfile.mkstemp(suffix='.db')
    os.close(fd)

    # Initialize Schema
    conn = sqlite3.connect(path)
    cursor = conn.cursor()

    # Create tables needed for tests
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS account_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type INTEGER NOT NULL,
        filePath TEXT NOT NULL,
        userName TEXT NOT NULL,
        status INTEGER DEFAULT 0,
        group_id INTEGER,
        UNIQUE(type, userName),
        FOREIGN KEY (group_id) REFERENCES account_groups(id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT,
        status TEXT,
        progress INTEGER,
        priority INTEGER,
        platforms TEXT,
        file_list TEXT,
        account_list TEXT,
        schedule_data TEXT,
        error_msg TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    conn.commit()
    conn.close()

    yield path

    if os.path.exists(path):
        os.unlink(path)

@pytest.fixture
def mock_db_manager(temp_db_path):
    """Mock db_manager to return temp_db_path."""
    with patch('src.db.db_manager.db_manager.get_db_path', return_value=Path(temp_db_path)):
        yield

@pytest.fixture
def client(mock_db_manager):
    """Flask test client with mocked DB."""
    from src.app import create_app
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client
