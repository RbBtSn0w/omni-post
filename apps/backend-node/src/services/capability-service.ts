import { PlatformType } from '../core/constants.js';
import { extensionService, type OCSAction } from './extension-service.js';

export type CapabilityKind = 'publish.video' | 'publish.article';
export type CapabilitySource = 'builtin' | 'opencli';
export type CapabilityFieldType = 'string' | 'number' | 'boolean' | 'string[]' | 'file[]';

export interface CapabilityInputField {
  key: string;
  label: string;
  type: CapabilityFieldType;
  required: boolean;
  help: string;
  group: 'required' | 'optional' | 'advanced';
  default?: string | number | boolean | string[];
}

export interface CapabilityDescriptor {
  id: string;
  site: string;
  name: string;
  kind: CapabilityKind;
  platform_id: number;
  source: CapabilitySource;
  requires_auth: boolean;
  supports_draft: boolean;
  input_schema: {
    fields: CapabilityInputField[];
  };
}

const STATIC_CAPABILITIES: CapabilityDescriptor[] = [
  {
    id: 'builtin:xiaohongshu:publish_video',
    site: 'xiaohongshu',
    name: '小红书视频发布',
    kind: 'publish.video',
    platform_id: PlatformType.XIAOHONGSHU,
    source: 'builtin',
    requires_auth: true,
    supports_draft: false,
    input_schema: {
      fields: [
        { key: 'title', label: '标题', type: 'string', required: true, help: '发布标题', group: 'required' },
        { key: 'fileList', label: '视频文件列表', type: 'file[]', required: true, help: '服务端视频目录中的文件名', group: 'required' },
        { key: 'tags', label: '话题标签', type: 'string[]', required: false, help: '多个标签使用逗号分隔', group: 'optional' },
      ]
    }
  },
  {
    id: 'builtin:wx_channels:publish_video',
    site: 'wx_channels',
    name: '微信视频号发布',
    kind: 'publish.video',
    platform_id: PlatformType.WX_CHANNELS,
    source: 'builtin',
    requires_auth: true,
    supports_draft: true,
    input_schema: {
      fields: [
        { key: 'title', label: '标题', type: 'string', required: true, help: '发布标题', group: 'required' },
        { key: 'fileList', label: '视频文件列表', type: 'file[]', required: true, help: '服务端视频目录中的文件名', group: 'required' },
        { key: 'isDraft', label: '保存草稿', type: 'boolean', required: false, help: '是否保存为草稿', group: 'optional', default: false },
      ]
    }
  },
  {
    id: 'builtin:douyin:publish_video',
    site: 'douyin',
    name: '抖音视频发布',
    kind: 'publish.video',
    platform_id: PlatformType.DOUYIN,
    source: 'builtin',
    requires_auth: true,
    supports_draft: false,
    input_schema: {
      fields: [
        { key: 'title', label: '标题', type: 'string', required: true, help: '发布标题', group: 'required' },
        { key: 'fileList', label: '视频文件列表', type: 'file[]', required: true, help: '服务端视频目录中的文件名', group: 'required' },
        { key: 'tags', label: '话题标签', type: 'string[]', required: false, help: '多个标签使用逗号分隔', group: 'optional' },
      ]
    }
  },
  {
    id: 'builtin:kuaishou:publish_video',
    site: 'kuaishou',
    name: '快手视频发布',
    kind: 'publish.video',
    platform_id: PlatformType.KUAISHOU,
    source: 'builtin',
    requires_auth: true,
    supports_draft: false,
    input_schema: {
      fields: [
        { key: 'title', label: '标题', type: 'string', required: true, help: '发布标题', group: 'required' },
        { key: 'fileList', label: '视频文件列表', type: 'file[]', required: true, help: '服务端视频目录中的文件名', group: 'required' },
      ]
    }
  },
  {
    id: 'builtin:bilibili:publish_video',
    site: 'bilibili',
    name: 'Bilibili视频发布',
    kind: 'publish.video',
    platform_id: PlatformType.BILIBILI,
    source: 'builtin',
    requires_auth: true,
    supports_draft: false,
    input_schema: {
      fields: [
        { key: 'title', label: '标题', type: 'string', required: true, help: '发布标题', group: 'required' },
        { key: 'fileList', label: '视频文件列表', type: 'file[]', required: true, help: '服务端视频目录中的文件名', group: 'required' },
        { key: 'tags', label: '话题标签', type: 'string[]', required: false, help: '多个标签使用逗号分隔', group: 'optional' },
      ]
    }
  },
  {
    id: 'builtin:zhihu:publish_article',
    site: 'zhihu',
    name: '知乎文章发布',
    kind: 'publish.article',
    platform_id: PlatformType.ZHIHU,
    source: 'builtin',
    requires_auth: true,
    supports_draft: false,
    input_schema: {
      fields: [
        { key: 'title', label: '标题', type: 'string', required: true, help: '文章标题', group: 'required' },
        { key: 'content', label: '内容', type: 'string', required: true, help: '文章正文', group: 'required' },
        { key: 'tags', label: '标签', type: 'string[]', required: false, help: '多个标签使用逗号分隔', group: 'optional' },
      ]
    }
  },
  {
    id: 'builtin:juejin:publish_article',
    site: 'juejin',
    name: '掘金文章发布',
    kind: 'publish.article',
    platform_id: PlatformType.JUEJIN,
    source: 'builtin',
    requires_auth: true,
    supports_draft: false,
    input_schema: {
      fields: [
        { key: 'title', label: '标题', type: 'string', required: true, help: '文章标题', group: 'required' },
        { key: 'content', label: '内容', type: 'string', required: true, help: '文章正文', group: 'required' },
        { key: 'tags', label: '标签', type: 'string[]', required: false, help: '多个标签使用逗号分隔', group: 'optional' },
      ]
    }
  },
];

class CapabilityService {
  getAllCapabilities(): CapabilityDescriptor[] {
    return [...STATIC_CAPABILITIES, ...this.getDynamicCapabilities()];
  }

  getCapabilityById(id: string): CapabilityDescriptor | null {
    const found = this.getAllCapabilities().find((cap) => cap.id === id);
    return found || null;
  }

  private getDynamicCapabilities(): CapabilityDescriptor[] {
    const extensions = extensionService.getAllExtensions();
    const capabilities: CapabilityDescriptor[] = [];

    for (const ext of extensions) {
      const actions = ext.manifest.actions;
      for (const [actionKey, rawAction] of Object.entries(actions)) {
        if (!rawAction || typeof rawAction !== 'object') continue;
        const kind = this.toCapabilityKind(actionKey);
        if (!kind) continue;

        const action = rawAction as OCSAction;
        const fields = this.actionToFields(action);
        capabilities.push({
          id: `opencli:${ext.platform_id}:${actionKey}`,
          site: this.normalizeSite(ext.name),
          name: `${ext.name} / ${actionKey}`,
          kind,
          platform_id: ext.platform_id,
          source: 'opencli',
          requires_auth: true,
          supports_draft: Boolean(action.args.draft || action.args.isDraft),
          input_schema: { fields }
        });
      }
    }

    return capabilities;
  }

  private toCapabilityKind(actionKey: string): CapabilityKind | null {
    if (actionKey === 'publish_video') return 'publish.video';
    if (actionKey === 'publish_article') return 'publish.article';
    return null;
  }

  private actionToFields(action: OCSAction): CapabilityInputField[] {
    const fields: CapabilityInputField[] = [];
    for (const key of Object.keys(action.args || {})) {
      fields.push({
        key,
        label: key,
        type: this.guessFieldType(key),
        required: this.isLikelyRequired(key),
        help: `映射参数: ${action.args[key]}`,
        group: this.inferFieldGroup(key)
      });
    }
    return fields;
  }

  private guessFieldType(key: string): CapabilityFieldType {
    const lower = key.toLowerCase();
    if (lower.includes('draft') || lower.startsWith('is')) return 'boolean';
    if (lower.includes('tags') || lower.includes('topics')) return 'string[]';
    if (lower.includes('files') || lower.includes('images') || lower.includes('filelist')) return 'file[]';
    if (lower.includes('count') || lower.includes('limit') || lower.includes('number')) return 'number';
    return 'string';
  }

  private isLikelyRequired(key: string): boolean {
    const lower = key.toLowerCase();
    return lower === 'title' || lower === 'content' || lower === 'text' || lower === 'filelist';
  }

  private inferFieldGroup(key: string): 'required' | 'optional' | 'advanced' {
    if (this.isLikelyRequired(key)) return 'required';
    const lower = key.toLowerCase();
    if (lower.includes('proxy') || lower.includes('timeout') || lower.includes('cookie')) return 'advanced';
    return 'optional';
  }

  private normalizeSite(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '_');
  }
}

export const capabilityService = new CapabilityService();
