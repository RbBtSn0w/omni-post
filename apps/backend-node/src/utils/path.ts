import path from 'path';

/**
 * 安全地拼接路径并防止路径穿越攻击 (SC-001)
 * 
 * @param baseDir 基础目录（绝对路径）
 * @param relativePath 用户输入的相对路径
 * @returns 拼接后的绝对路径
 * @throws Error 如果检测到路径穿越尝试或提供了非法路径
 */
export function safeJoin(baseDir: string, relativePath: string): string {
    const resolvedBase = path.resolve(baseDir);
    const fullPath = path.resolve(resolvedBase, relativePath);

    // Ensure the resolved path is actually underneath the base directory
    // Using startsWith on normalized paths is the standard way to prevent traversal
    if (!fullPath.startsWith(resolvedBase)) {
        throw new Error('非法的文件路径');
    }

    // Additional check: ensure it's not the base directory itself if that's required,
    // but usually, we want to allow files WITHIN the base directory.
    // The previous implementation was slightly more restrictive.
    // Let's stick to the standard 'startsWith' pattern.
    return fullPath;
}
