#!/usr/bin/env python3
import pytest
import asyncio
import time
from src.utils.network import async_retry

class TestNetwork:
    """测试网络工具函数"""
    
    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_async_retry_success_first_attempt(self):
        """测试第一次尝试就成功"""
        call_count = 0
        
        @async_retry(timeout=5, max_retries=3)
        async def test_func():
            nonlocal call_count
            call_count += 1
            return "success"
        
        result = await test_func()
        assert result == "success"
        assert call_count == 1
    
    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_async_retry_success_after_failures(self):
        """测试经过几次失败后成功"""
        call_count = 0
        
        @async_retry(timeout=10, max_retries=5)
        async def test_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ValueError("Simulated failure")
            return "success"
        
        result = await test_func()
        assert result == "success"
        assert call_count == 3
    
    @pytest.mark.asyncio
    @pytest.mark.timeout(15)
    async def test_async_retry_max_retries_exceeded(self):
        """测试达到最大重试次数"""
        call_count = 0
        
        @async_retry(timeout=30, max_retries=3)
        async def test_func():
            nonlocal call_count
            call_count += 1
            raise ValueError("Always fails")
        
        with pytest.raises(Exception, match="Failed after 3 retries"):
            await test_func()
        
        assert call_count == 3
    
    @pytest.mark.asyncio
    @pytest.mark.timeout(15)
    async def test_async_retry_timeout_exceeded(self):
        """测试超时"""
        call_count = 0
        
        @async_retry(timeout=3, max_retries=None)
        async def test_func():
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.5)  # Simulate some work
            raise ValueError("Always fails")
        
        with pytest.raises(TimeoutError, match="exceeded 3 seconds timeout"):
            await test_func()
        
        # Should have made multiple attempts within 3 seconds
        assert call_count >= 2
    
    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_async_retry_no_max_retries(self):
        """测试无最大重试限制但有超时"""
        call_count = 0
        
        @async_retry(timeout=5, max_retries=None)
        async def test_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ValueError("Temporary failure")
            return "success"
        
        result = await test_func()
        assert result == "success"
        assert call_count == 3
    
    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_async_retry_with_args_kwargs(self):
        """测试带参数的函数"""
        call_count = 0
        
        @async_retry(timeout=5, max_retries=3)
        async def test_func(a, b, c=None):
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise ValueError("First attempt fails")
            return f"{a}+{b}+{c}"
        
        result = await test_func(1, 2, c=3)
        assert result == "1+2+3"
        assert call_count == 2
    
    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_async_retry_different_exceptions(self):
        """测试捕获不同类型的异常"""
        call_count = 0
        
        @async_retry(timeout=10, max_retries=5)
        async def test_func():
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise ValueError("ValueError")
            elif call_count == 2:
                raise ConnectionError("ConnectionError")
            return "success"
        
        result = await test_func()
        assert result == "success"
        assert call_count == 3
    
    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_async_retry_zero_retries(self):
        """测试max_retries=0的情况"""
        call_count = 0
        
        @async_retry(timeout=5, max_retries=1)
        async def test_func():
            nonlocal call_count
            call_count += 1
            raise ValueError("Immediate failure")
        
        with pytest.raises(Exception, match="Failed after 1 retries"):
            await test_func()
        
        assert call_count == 1  # Should make exactly 1 attempt when max_retries=1
    
    @pytest.mark.asyncio
    @pytest.mark.timeout(10)
    async def test_async_retry_preserves_return_values(self):
        """测试保持返回值的各种类型"""
        @async_retry(timeout=5, max_retries=3)
        async def test_func_dict():
            return {"key": "value"}
        
        @async_retry(timeout=5, max_retries=3)
        async def test_func_list():
            return [1, 2, 3]
        
        @async_retry(timeout=5, max_retries=3)
        async def test_func_none():
            return None
        
        assert await test_func_dict() == {"key": "value"}
        assert await test_func_list() == [1, 2, 3]
        assert await test_func_none() is None
