/**
 * 教材相关类型定义
 *
 * 覆盖教材上传、解析、章节结构、知识单元、知识原子等核心业务实体。
 */

// ─── 文件类型 ────────────────────────────────────────────

/** 教材支持的文件格式 */
export type TextbookFileType = "pdf" | "md" | "docx";

/** 教材整体状态 */
export type TextbookStatus = "uploading" | "parsing" | "processing" | "ready" | "error";

// ─── 索引状态 ────────────────────────────────────────────

/** 向量索引构建状态 */
export interface IndexStatus {
  /** 是否已完成索引 */
  readonly indexed: boolean;
  /** 已索引的 chunk 数量 */
  readonly chunkCount: number;
  /** 索引构建时间（ISO 8601） */
  readonly builtAt: string | null;
}

// ─── 教材 ────────────────────────────────────────────────

/** 教材元数据 */
export interface Textbook {
  /** 教材唯一标识 */
  readonly id: string;
  /** 教材名称（文件名或自定义标题） */
  readonly filename: string;
  /** 教材标题 */
  readonly title: string;
  /** 总字符数 */
  readonly total_chars: number;
  /** 总页数 */
  readonly total_pages: number;
  /** 处理状态 */
  readonly status: TextbookStatus;
}

// ─── 章节 ────────────────────────────────────────────────

/** 教材章节 */
export interface Chapter {
  /** 章节唯一标识 */
  readonly id: string;
  /** 所属教材 ID */
  readonly textbookId: string;
  /** 章节标题 */
  readonly title: string;
  /** 章节层级（1=章, 2=节, 3=小节） */
  readonly level: number;
  /** 章节序号（在教材中的顺序） */
  readonly order: number;
  /** 章节原始文本内容 */
  readonly content: string;
  /** 字符数 */
  readonly charCount: number;
  /** 父章节 ID（顶级章节为 null） */
  readonly parentId: string | null;
}

// ─── 知识原子 ────────────────────────────────────────────

/** 知识原子类型 */
export type KnowledgeAtomType =
  | "定义"
  | "定理"
  | "公式"
  | "实验"
  | "分类";

/** 知识原子 —— 知识单元的最小语义子结构 */
export interface KnowledgeAtom {
  /** 原子类型 */
  readonly type: KnowledgeAtomType;
  /** 具体内容 */
  readonly content: string;
}

// ─── 知识单元 ────────────────────────────────────────────

/** 知识单元分类 */
export type KnowledgeUnitCategory =
  | "概念"
  | "原理"
  | "方法"
  | "现象"
  | "结构"
  | "过程";

/** 知识单元 —— 图谱节点的主粒度 */
export interface KnowledgeUnit {
  /** 知识单元唯一标识 */
  readonly id: string;
  /** 所属教材 ID */
  readonly textbookId: string;
  /** 所属章节 ID */
  readonly chapterId: string;
  /** 知识单元名称（5-15 字） */
  readonly name: string;
  /** 一句话定义（30-80 字） */
  readonly definition: string;
  /** 分类 */
  readonly category: KnowledgeUnitCategory;
  /** 完整内容（200-800 字） */
  readonly content: string;
  /** 知识原子列表 */
  readonly atoms: readonly KnowledgeAtom[];
  /** 关键词 */
  readonly keywords: readonly string[];
  /** 重要度评分 1-5 */
  readonly importance: number;
  /** 教材来源（书名） */
  readonly bookName: string;
  /** 章节来源（章节标题） */
  readonly chapterName: string;
  /** 创建时间（ISO 8601） */
  readonly createdAt: string;
}

// ─── RAG 分块 ────────────────────────────────────────────

/** RAG 文本切块的元数据 */
export interface ChunkMetadata {
  /** 来源教材 */
  readonly book: string;
  /** 来源章节 */
  readonly chapter: string;
  /** 关联知识单元 ID */
  readonly unitId: string | null;
  /** 关联知识单元名称 */
  readonly unitName: string | null;
  /** 是否为拆分后的部分块 */
  readonly isPartial: boolean;
}

/** RAG 文本切块 */
export interface Chunk {
  /** 切块唯一标识 */
  readonly id: string;
  /** 切块文本内容 */
  readonly content: string;
  /** 元数据 */
  readonly metadata: ChunkMetadata;
  /** 向量 Embedding（维度由 VECTOR_DIM 决定，默认 1536） */
  readonly embedding: readonly number[] | null;
}

// ─── 处理任务 ────────────────────────────────────────────

/** 教材处理任务（异步后台任务） */
export interface ProcessingTask {
  /** 任务 ID */
  readonly taskId: string;
  /** 关联教材 ID */
  readonly textbookId: string;
  /** 当前阶段 */
  readonly stage: string;
  /** 进度百分比 0-100 */
  readonly progress: number;
  /** 错误信息 */
  readonly error: string | null;
  /** 任务创建时间（ISO 8601） */
  readonly createdAt: string;
  /** 最后更新时间（ISO 8601） */
  readonly updatedAt: string;
}

// ─── 兼容别名 ────────────────────────────────────────────

/** @deprecated 使用 Textbook 代替 */
export type Document = Textbook;

export interface DocumentListParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly status?: TextbookStatus;
  readonly fileType?: TextbookFileType;
  readonly search?: string;
}
