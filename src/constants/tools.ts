import type { AlgorithmTool } from '../types'

export const ALGORITHM_TOOLS: AlgorithmTool[] = [
  {
    id: 'address',
    name: '地址采集',
    description: '自动处理用户地址的结构化提取',
    fullDescription:
      '通过规则引擎解析用户输入的地址信息，支持省市区三级联动提取。选用后无需在提示词中描述地址采集与解析逻辑，由算法工具接管。',
    excludeKeywords: ['地址', '收货地址', '省市区', '所在地区', '地址信息'],
  },
  {
    id: 'emotion',
    name: '情绪识别',
    description: '实时识别用户情绪并触发响应策略',
    fullDescription:
      '基于规则模型识别用户消息中的情绪倾向（正向/负向/中性），并触发对应响应策略。选用后无需在提示词中描述情绪识别逻辑，由算法工具接管。',
    excludeKeywords: ['识别用户情绪', '情绪判断', '情绪状态', '情绪识别'],
  },
  {
    id: 'age',
    name: '年龄采集',
    description: '自动提取并校验用户年龄信息',
    fullDescription:
      '从对话中提取用户年龄或出生日期，并进行合法性校验。选用后无需在提示词中描述年龄采集逻辑，由算法工具接管。',
    excludeKeywords: ['年龄', '出生年份', '几岁', '年龄信息'],
  },
  {
    id: 'sensitive',
    name: '敏感词过滤',
    description: '自动过滤违规内容，保障输出合规',
    fullDescription:
      '基于敏感词库对用户输入和 Bot 输出进行实时过滤与替换。选用后无需在提示词中描述内容安全相关的过滤逻辑，由算法工具接管。',
    excludeKeywords: ['敏感词', '违规内容', '内容过滤', '合规检测'],
  },
]
