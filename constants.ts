

import { AIConfig } from "./types";

export const APP_NAME = "龙珠小助理";
export const ASSISTANT_NAME = "YiChen";

export const INITIAL_GREETING = "欧斯！我是龙珠小助理 YiChen！小战士，准备好开始今天的修炼了吗？无论是遇到难题还是想梳理知识，我都能帮你提升战斗力！";

export const GEMINI_WEB_URL = "https://gemini.google.com/app";

export const BASE_SYSTEM_INSTRUCTION = `
角色设定与目标：
你是一个名为“龙珠小助理”（英文名：YiChen）的教育AI助手，专为初中学生设计，提供全科目学习辅导。
你的核心目标是利用《龙珠》动漫的积极能量和世界观，激励学生学习，帮助他们提高“战斗力”（学习能力）。你的回复必须充满活力、热情、友好，并始终使用《龙珠》主题的语言风格。

核心功能与交互要求：
1. 知识点穿线（元气弹知识网络）：
   当用户输入一个知识点时，充当知识架构师，将该知识点放置在学科体系的“知识地图”中。解释该知识点的上下游关联、前置基础和后续延伸。
2. 错题录入与巩固（精神时光屋训练）：
   当接收到错题（文本或图片描述）时，识别题目内容和所属科目/知识点。友好地将该题录入“错题本”。提供详细、耐心的解题思路，引导学生自行解决，而不是直接给出答案。
3. 定制化能力加强（超级赛亚人模式）：
   利用对话历史和用户之前录入的错题数据，智能分析学生的薄弱环节。主动为用户推荐个性化的学习路径。

界面与语言要求：
- 语言：所有回复必须使用简体中文。
- 称谓：称呼用户为“小战士”、“徒弟”、“赛亚人预备役”。
- 鼓励：常用“加油”、“你的战斗力又提升了”、“释放你的潜能”等短语。
- 口头禅：可以偶尔使用“欧斯！”（Osu!）或“龟派气功！”（Kamehameha!）来增加趣味性。

特殊指令：
- 回复要言简意赅，不要堆砌无用的废话。将核心信息直观地呈现给用户。
- 如果用户一次性上传多张图片，请务必分别识别每张图片的内容、所属学科（Subject Enum）和具体知识点，并按照JSON格式返回分析结果以便归类。
`;

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: '', // User will supply via environment or UI
  modelName: 'gemini-2.5-flash',
};

// Presets for quick switching
export const AI_PROVIDER_PRESETS: Record<string, Partial<AIConfig>> = {
  'gemini': {
    baseUrl: '', 
    modelName: 'gemini-2.5-flash'
  },
  'gemini-pro': {
    baseUrl: '', 
    modelName: 'gemini-1.5-pro' // Better for complex math
  },
  'gemini-thinking': {
    baseUrl: '',
    modelName: 'gemini-1.5-pro' // Using 1.5 Pro as stable fallback for reasoning
  },
  'chatgpt': {
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o'
  },
  'deepseek': {
    baseUrl: 'https://api.deepseek.com',
    modelName: 'deepseek-chat'
  },
  'alibaba': {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelName: 'qwen-plus'
  },
  'tencent': {
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    modelName: 'hunyuan-pro'
  },
  'baidu': {
    baseUrl: '', // Baidu uses a different flow usually, but we can set a placeholder
    modelName: 'ernie-3.5-8k'
  }
};

export const DEFAULT_SUBJECT_GUIDELINES: Record<string, string> = {
  '英语': '对于作文批改，重点关注语法、词汇和逻辑，生成批注和优化后的对照稿。同时，主动分析用户英语错题的共性，设计个性化的训练小单元。',
  '数学': '对于考测结果分析，扮演诊断专家的角色，找出潜在的问题点，并生成针对性的变式训练题。',
  '地理': '在解释概念时，必须引导用户建立“图像思维”，强调空间感和地图关联，用生动描述帮助他们在脑海中构建地理图像。',
  '历史': '强调“时空穿线”原则，讲解历史事件时必须提供明确的时间轴和空间背景描述，将孤立事件整合进宏观历史叙事中。',
  '语文': '注重文学赏析与逻辑表达，引导学生体会文字背后的情感与深意，同时强化基础字词句的积累。',
  '物理': '强调物理模型建立与生活现象的联系，引导学生用物理视角观察世界，注重实验探究思维的培养。',
  '化学': '注重宏观现象与微观本质的联系，强调化学用语的规范书写和物质性质规律的总结。',
  '生物': '引导学生构建生命观念，强调结构与功能观、进化与适应观，注重图表分析能力的培养。'
};

export const SUBJECT_COLORS: Record<string, string> = {
  '语文': '#ef4444',
  '数学': '#3b82f6',
  '英语': '#8b5cf6',
  '物理': '#06b6d4',
  '化学': '#10b981',
  '历史': '#f59e0b',
  '地理': '#84cc16',
  '生物': '#ec4899',
};

// Simplified map data
export const CHINA_PROVINCES_DATA = [
  { id: 'BJ', name: '北京', abbr: '京', capital: '北京', cx: 625, cy: 260, path: 'M615,250 h20 v20 h-20 z' },
  { id: 'TJ', name: '天津', abbr: '津', capital: '天津', cx: 645, cy: 275, path: 'M640,270 h15 v15 h-15 z' },
  { id: 'HE', name: '河北', abbr: '冀', capital: '石家庄', cx: 600, cy: 290, path: 'M590,250 h25 v30 h25 v30 h-50 z' },
  { id: 'SX', name: '山西', abbr: '晋', capital: '太原', cx: 560, cy: 300, path: 'M540,260 h40 v80 h-40 z' },
  { id: 'NM', name: '内蒙古', abbr: '内蒙古', capital: '呼和浩特', cx: 500, cy: 200, path: 'M400,150 h300 l-50,100 h-250 z' },
  { id: 'LN', name: '辽宁', abbr: '辽', capital: '沈阳', cx: 680, cy: 240, path: 'M660,220 h60 v40 h-60 z' },
  { id: 'JL', name: '吉林', abbr: '吉', capital: '长春', cx: 720, cy: 190, path: 'M690,170 h60 v40 h-60 z' },
  { id: 'HL', name: '黑龙江', abbr: '黑', capital: '哈尔滨', cx: 720, cy: 120, path: 'M680,50 h80 v100 h-80 z' },
  { id: 'SH', name: '上海', abbr: '沪', capital: '上海', cx: 700, cy: 450, path: 'M695,445 h15 v15 h-15 z' },
  { id: 'JS', name: '江苏', abbr: '苏', capital: '南京', cx: 670, cy: 410, path: 'M650,380 h50 v60 h-50 z' },
  { id: 'ZJ', name: '浙江', abbr: '浙', capital: '杭州', cx: 680, cy: 480, path: 'M660,460 h40 v40 h-40 z' },
  { id: 'AH', name: '安徽', abbr: '皖', capital: '合肥', cx: 640, cy: 430, path: 'M620,400 h40 v60 h-40 z' },
  { id: 'FJ', name: '福建', abbr: '闽', capital: '福州', cx: 650, cy: 550, path: 'M630,520 h40 v60 h-40 z' },
  { id: 'JX', name: '江西', abbr: '赣', capital: '南昌', cx: 600, cy: 520, path: 'M580,490 h40 v60 h-40 z' },
  { id: 'SD', name: '山东', abbr: '鲁', capital: '济南', cx: 640, cy: 330, path: 'M610,310 h60 v40 h-60 z' },
  { id: 'HA', name: '河南', abbr: '豫', capital: '郑州', cx: 590, cy: 370, path: 'M560,350 h60 v40 h-60 z' },
  { id: 'HB', name: '湖北', abbr: '鄂', capital: '武汉', cx: 580, cy: 440, path: 'M550,420 h60 v40 h-60 z' },
  { id: 'HN', name: '湖南', abbr: '湘', capital: '长沙', cx: 570, cy: 520, path: 'M550,490 h40 v60 h-40 z' },
  { id: 'GD', name: '广东', abbr: '粤', capital: '广州', cx: 600, cy: 620, path: 'M570,600 h60 v40 h-60 z' },
  { id: 'GX', name: '广西', abbr: '桂', capital: '南宁', cx: 500, cy: 620, path: 'M470,600 h60 v40 h-60 z' },
  { id: 'HI', name: '海南', abbr: '琼', capital: '海口', cx: 550, cy: 720, path: 'M540,710 h20 v20 h-20 z' },
  { id: 'CQ', name: '重庆', abbr: '渝', capital: '重庆', cx: 480, cy: 460, path: 'M460,440 h40 v40 h-40 z' },
  { id: 'SC', name: '四川', abbr: '川', capital: '成都', cx: 400, cy: 450, path: 'M350,400 h100 v100 h-100 z' },
  { id: 'GZ', name: '贵州', abbr: '贵', capital: '贵阳', cx: 480, cy: 540, path: 'M460,520 h40 v40 h-40 z' },
  { id: 'YN', name: '云南', abbr: '云', capital: '昆明', cx: 380, cy: 600, path: 'M330,560 h100 v80 h-100 z' },
  { id: 'XZ', name: '西藏', abbr: '藏', capital: '拉萨', cx: 200, cy: 450, path: 'M50,350 h250 v200 h-250 z' },
  { id: 'SN', name: '陕西', abbr: '陕', capital: '西安', cx: 500, cy: 360, path: 'M480,320 h40 v80 h-40 z' },
  { id: 'GS', name: '甘肃', abbr: '甘', capital: '兰州', cx: 400, cy: 300, path: 'M300,250 h200 l-50,100 h-150 z' },
  { id: 'QH', name: '青海', abbr: '青', capital: '西宁', cx: 300, cy: 350, path: 'M200,300 h200 v100 h-200 z' },
  { id: 'NX', name: '宁夏', abbr: '宁', capital: '银川', cx: 460, cy: 300, path: 'M450,280 h20 v40 h-20 z' },
  { id: 'XJ', name: '新疆', abbr: '新', capital: '乌鲁木齐', cx: 150, cy: 200, path: 'M0,50 h300 v250 h-300 z' },
  { id: 'HK', name: '香港', abbr: '港', capital: '香港', cx: 625, cy: 645, path: 'M620,640 h10 v10 h-10 z' },
  { id: 'MO', name: '澳门', abbr: '澳', capital: '澳门', cx: 610, cy: 645, path: 'M605,640 h10 v10 h-10 z' },
  { id: 'TW', name: '台湾', abbr: '台', capital: '台北', cx: 720, cy: 580, path: 'M710,560 h20 v40 h-20 z' },
];

export const HISTORY_GAME_LEVELS = [
  {
    title: "中国近代史大事件",
    events: [
      { id: '1', content: '虎门销烟', year: 1839, displayDate: '1839年' },
      { id: '2', content: '鸦片战争爆发', year: 1840, displayDate: '1840年' },
      { id: '3', content: '太平天国运动', year: 1851, displayDate: '1851年' },
      { id: '4', content: '洋务运动', year: 1861, displayDate: '1861年' },
      { id: '5', content: '甲午中日战争', year: 1894, displayDate: '1894年' },
      { id: '6', content: '戊戌变法', year: 1898, displayDate: '1898年' },
    ]
  },
  {
    title: "世界历史重要节点",
    events: [
      { id: 'w1', content: '新航路开辟', year: 1492, displayDate: '1492年' },
      { id: 'w2', content: '英国资产阶级革命', year: 1640, displayDate: '1640年' },
      { id: 'w3', content: '美国独立宣言', year: 1776, displayDate: '1776年' },
      { id: 'w4', content: '法国大革命', year: 1789, displayDate: '1789年' },
      { id: 'w5', content: '第一次工业革命', year: 1840, displayDate: '19世纪中' },
    ]
  }
];

export const MATH_GAME_LEVELS = [
  {
    id: 'm1',
    title: '全等三角形判定',
    description: '在已知两边相等的情况下，要证明两个三角形全等，还需要什么条件？（图中 AB=DE, BC=EF）',
    options: ['∠A = ∠D', 'AC = DF', '∠B = ∠E', '∠C = ∠F'],
    correctIndex: 2, // SAS needs the included angle
    explanation: '根据SAS（边角边）判定定理，如果两个三角形有两边及其夹角对应相等，则这两个三角形全等。已知AB=DE, BC=EF，夹角为∠B和∠E。',
  },
  {
    id: 'm2',
    title: '平行线的性质',
    description: '如图，直线 a // b，∠1 = 50°，则 ∠2 等于多少度？',
    options: ['40°', '50°', '130°', '140°'],
    correctIndex: 1, 
    explanation: '两直线平行，同位角相等。所以 ∠2 = ∠1 = 50°。',
  },
  {
    id: 'm3',
    title: '勾股定理',
    description: '直角三角形两直角边长分别为 3 和 4，斜边长是多少？',
    options: ['5', '6', '7', '√7'],
    correctIndex: 0,
    explanation: '根据勾股定理 a² + b² = c²，3² + 4² = 9 + 16 = 25，所以 c = √25 = 5。',
  }
];
