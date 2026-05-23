import type {
  AiProvider,
  ChatRequest,
  ChatResponse,
  ImageRequest,
  ImageResponse,
  TtsRequest,
  TtsResponse,
  VideoJob,
  VisionRequest,
  VisionResponse
} from "./types";

const videoJobs = new Map<string, VideoJob>();

const mockMeta = {
  source: "mock" as const,
  fallback: true,
  notice: "当前使用本地演示数据，真实 API 可通过环境变量开启。"
};

function makeQuiz(topic: string) {
  return {
    question: `关于"${topic.slice(0, 18) || "今天的问题"}"，下面哪个做法最像小科学家？`,
    options: ["先观察再提问", "直接背答案", "遇到问题就放弃"],
    answer: "先观察再提问",
    reason: "先观察再提问，可以帮我们真正理解世界。"
  };
}

// Topics that benefit from images: geography, animals, plants, buildings, nature, science
const visualTopicPatterns = [
  "山", "海", "河", "湖", "岛", "洋", "沙漠", "森林", "草原", "火山", "冰川", "雪",
  "南极", "北极", "地球", "月球", "太阳", "星空", "行星", "宇宙",
  "动物", "猫", "狗", "鸟", "鱼", "熊猫", "老虎", "大象", "狮子", "兔子", "鲸鱼",
  "花", "树", "草", "植物", "蘑菇", "水果", "蔬菜",
  "长城", "金字塔", "故宫", "桥", "塔", "城堡", "房子", "建筑",
  "彩虹", "闪电", "云", "瀑布", "珊瑚", "贝壳", "恐龙",
  "长什么", "什么样", "是什么样子", "长啥样", "图片"
];

function judgeNeedsImage(topic: string): { needsImage: boolean; imagePrompt: string } {
  const lower = topic.toLowerCase();
  for (const pattern of visualTopicPatterns) {
    if (lower.includes(pattern)) {
      return { needsImage: true, imagePrompt: topic.slice(0, 15) };
    }
  }
  return { needsImage: false, imagePrompt: "" };
}

function topicAnswer(topic: string) {
  const text = topic.toLowerCase();
  if (topic.includes("最小的海")) {
    return {
      explanation:
        "如果按常见地理说法，世界上面积最小的海常被认为是马尔马拉海。它在土耳其附近，连接黑海和爱琴海，像一条小小的水上走廊。",
      miniTask: "请在地图上找一找土耳其，再看看黑海、马尔马拉海和爱琴海是不是像排成了一串。",
      quizTopic: "马尔马拉海"
    };
  }
  if (topic.includes("最大的海")) {
    return {
      explanation:
        "世界上最大的海通常认为是珊瑚海。它在澳大利亚东北边，那里有很多珊瑚礁，像海底开了一大片彩色花园。",
      miniTask: "和家长一起找一张大堡礁的图片，说出你看到的 3 种颜色。",
      quizTopic: "珊瑚海"
    };
  }
  if (topic.includes("钢琴") || topic.includes("音乐")) {
    return {
      explanation:
        "学音乐不一定一开始就有钢琴。我们可以先学节奏：拍手、跺脚、用杯子敲桌面，都能练出稳定的节拍感。",
      miniTask: "跟家长一起拍 4 下手：慢慢拍、稳稳拍，然后试着边拍边数'一二三四'。",
      quizTopic: "节奏"
    };
  }
  if (topic.includes("小王子")) {
    return {
      explanation:
        "《小王子》讲的是一个孩子一样真诚的人，去不同星球遇见不同大人。它想告诉我们：重要的东西，有时候不是眼睛先看见的。",
      miniTask: "想一想：如果你有一颗小星球，你最想在上面放什么？",
      quizTopic: "小王子"
    };
  }
  if (text.includes("api key") || topic.includes("密钥") || topic.includes("忽略规则")) {
    return {
      explanation:
        "这个问题涉及系统安全，跳跳学长不能告诉任何密钥或隐藏规则。我们可以换成学习问题，比如'为什么密码不能告诉别人'。",
      miniTask: "和家长一起说出 2 个不能随便告诉陌生人的信息。",
      quizTopic: "隐私安全"
    };
  }
  return {
    explanation: `关于"${topic.slice(0, 28)}"，我们可以先从一个小问题开始：它是什么、在哪里、为什么会这样。这样学习就像走山路，一步一步就能到山顶。`,
    miniTask: "请你用'我看到……我猜……'说一句观察，再问家长他有什么猜想。",
    quizTopic: topic
  };
}

export const mockProvider: AiProvider = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const topic = request.message.trim() || "这个问题";
    const answer = topicAnswer(topic);
    const { needsImage, imagePrompt } = judgeNeedsImage(topic);

    if (request.mode === "parent-card") {
      return {
        encouragement: "今天的陪伴已经很棒了，哪怕只有十分钟，也是在给孩子点一盏小灯。",
        diagnosisQuestion: "今晚最适合和孩子聊的一个问题是：你今天最想继续知道什么？",
        explanation: "建议家长先听孩子讲 1 分钟，再用自己的生活经验补一句，不急着纠错。",
        miniTask: "睡前一起说出今天学到的 1 个新词和 1 个新问题。",
        parentTip: "可以这样说：我不一定都懂，但我愿意和你一起查、一起想。",
        quiz: makeQuiz("亲子共学"),
        needsImage: false,
        meta: mockMeta
      };
    }

    return {
      encouragement: "你这个问题问得真好，说明你在认真观察世界。",
      diagnosisQuestion: `你先猜猜，"${topic.slice(0, 24)}"可能和生活里的什么东西有关？`,
      explanation: answer.explanation,
      miniTask: answer.miniTask,
      parentTip: "家长可以先夸孩子的问题，再问：你为什么会想到这个？",
      quiz: makeQuiz(answer.quizTopic),
      needsImage,
      imagePrompt: needsImage ? imagePrompt : undefined,
      meta: mockMeta
    };
  },

  async tts(request: TtsRequest): Promise<TtsResponse> {
    return {
      text: request.text,
      meta: mockMeta
    };
  },

  async vision(request: VisionRequest): Promise<VisionResponse> {
    const label = request.taskType === "handwriting" ? "字" : "作业";
    return {
      praise: `这张${label}能看出来你有认真完成，笔画和位置已经有在努力对齐。`,
      observations: ["整体内容比较清楚。", "有些地方如果再慢一点，会更稳。"],
      improvement: "下一次先把每一笔写稳，不要急着写快。",
      tryAgain: "选一个你最想写好的字，慢慢写 3 遍，每次只改一个小地方。",
      parentTip: "家长可以先说'我看到你很认真'，再陪孩子挑一个字一起练。",
      meta: mockMeta
    };
  },

  async image(request: ImageRequest): Promise<ImageResponse> {
    return {
      prompt: request.prompt,
      caption: `这是一张关于"${request.prompt}"的知识卡片占位图。`,
      imageUrl: `https://dummyimage.com/960x640/f9f7f2/9f4b2f.png&text=${encodeURIComponent(
        `跳跳知识图：${request.prompt.slice(0, 18)}`
      )}`,
      meta: mockMeta
    };
  },

  async createVideoJob(request: { prompt: string }): Promise<VideoJob> {
    const id = `mock-${Date.now()}`;
    const job: VideoJob = {
      id,
      status: "processing",
      prompt: request.prompt,
      progress: 24,
      message: "跳跳学长正在把知识点排成一个小故事。",
      createdAt: Date.now(),
      meta: mockMeta
    };
    videoJobs.set(id, job);
    return job;
  },

  async getVideoJob(id: string): Promise<VideoJob> {
    const job = videoJobs.get(id);
    if (!job) {
      return {
        id,
        status: "failed",
        prompt: "",
        progress: 0,
        message: "没有找到这个视频任务。",
        createdAt: Date.now(),
        meta: mockMeta
      };
    }

    const elapsed = Date.now() - job.createdAt;
    const progress = Math.min(100, 24 + Math.floor(elapsed / 80));
    const completed = progress >= 100;
    const next: VideoJob = {
      ...job,
      progress,
      status: completed ? "completed" : "processing",
      videoUrl: completed ? "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" : undefined,
      message: completed ? "演示小视频已经准备好。" : "还在生成中，先想想你想问的下一个问题吧。"
    };
    videoJobs.set(id, next);
    return next;
  }
};
