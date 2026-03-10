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
    // 基础路径解析
    const resolvedBase = path.resolve(baseDir);
    
    // 如果输入是绝对路径，且不以基础路径开头，则拒绝
    if (path.isAbsolute(relativePath)) {
        const resolvedInput = path.resolve(relativePath);
        if (!resolvedInput.startsWith(resolvedBase + path.sep) && resolvedInput !== resolvedBase) {
            throw new Error('非法的文件路径');
        }
        return resolvedInput;
    }

    const fullPath = path.resolve(resolvedBase, relativePath);

    // 确保结果路径在基础目录内
    if (!fullPath.startsWith(resolvedBase + path.sep) && fullPath !== resolvedBase) {
        throw new Error('非法的文件路径');
    }

    return fullPath;
}
