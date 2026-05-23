import {
  BookOpen,
  Camera,
  CheckCircle2,
  Gamepad2,
  Heart,
  Home,
  ImageIcon,
  Mic,
  Pause,
  Play,
  Send,
  Sparkles,
  Trash2,
  Video,
  Volume2
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AiBadge, LoadingDots, SectionTitle, Toast } from "./components/Common";
import { PixelMascot } from "./components/PixelMascot";
import { readings } from "./data/readings";
import { safetySamples } from "./data/safetySamples";
import { chat, createVideo, generateImage, getVideoJob, health, vision } from "./lib/api";
import { fileToCompressedDataUrl } from "./lib/image";
import { speak, stopSpeaking } from "./lib/speech";
import { clearState, createRecord, createSavedPicture, defaultState, loadState, saveState } from "./lib/storage";
import { useVoiceInput } from "./lib/useVoiceInput";
import type { AppState, ChatImageResult, ChatResponse, ImageResponse, QuizQuestion, SavedPicture, VideoJob, VisionResponse } from "./types";

type Tab = "home" | "ask" | "read" | "photo" | "image" | "video" | "quiz" | "parent" | "picturebook";

const navItems: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "home", label: "首页", icon: Home },
  { id: "ask", label: "提问", icon: Sparkles },
  { id: "read", label: "共读", icon: BookOpen },
  { id: "photo", label: "拍照", icon: Camera },
  { id: "parent", label: "家长卡", icon: CheckCircle2 },
  { id: "picturebook", label: "绘本库", icon: Heart }
];

function childProfile(state: AppState) {
  return {
    nickname: state.consent.nickname || "小朋友",
    ageBand: state.consent.ageBand
  };
}

export function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<Tab>("home");
  const [toast, setToast] = useState("");
  const [healthState, setHealthState] = useState<Awaited<ReturnType<typeof health>> | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    health().then(setHealthState).catch(() => setHealthState(null));
  }, []);

  function updateState(next: AppState | ((prev: AppState) => AppState)) {
    setState(next);
  }

  function addRecord(record: Parameters<typeof createRecord>[0]) {
    updateState((prev) => ({
      ...prev,
      records: [createRecord(record), ...prev.records].slice(0, 30)
    }));
  }

  function resetAll() {
    clearState();
    setState(defaultState);
    setTab("home");
    setToast("本地学习记录已清空。");
  }

  if (!state.consent.accepted) {
    return <ConsentGate state={state} updateState={updateState} />;
  }

  return (
    <div className="app-shell">
      <div className="paper-grid" />
      <header className="app-header">
        <div>
          <p className="eyebrow">乡村亲子共学 AI 学伴</p>
          <h1>跳跳学长</h1>
        </div>
        <button className="ghost-button" onClick={resetAll} title="清除本地数据">
          <Trash2 size={17} />
          清空
        </button>
      </header>

      <main className="app-main">
        <ProviderBanner healthState={healthState} />
        {tab === "home" && <HomePanel state={state} setTab={setTab} />}
        {tab === "ask" && <AskPanel state={state} updateState={updateState} addRecord={addRecord} />}
        {tab === "read" && <ReadingPanel state={state} updateState={updateState} addRecord={addRecord} />}
        {tab === "photo" && <PhotoPanel addRecord={addRecord} />}
        {tab === "image" && <ImagePanel addRecord={addRecord} />}
        {tab === "video" && <VideoPanel addRecord={addRecord} />}
        {tab === "quiz" && <QuizPanel state={state} addRecord={addRecord} />}
        {tab === "parent" && <ParentPanel state={state} addRecord={addRecord} />}
        {tab === "picturebook" && <PictureBookPanel state={state} updateState={updateState} />}
      </main>

      <nav className="bottom-nav" aria-label="主要功能">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}

function ProviderBanner({ healthState }: { healthState: Awaited<ReturnType<typeof health>> | null }) {
  if (!healthState) return null;
  const hasChat = healthState.hasMiniMax || healthState.hasArk;
  const hasPremiumTts = healthState.hasAliyunTts || healthState.hasVolcTts || healthState.hasMiniMax;
  if (hasChat && hasPremiumTts) {
    return (
      <div className="provider-banner live">
        已接入真实模型：问答 {healthState.hasArk ? "豆包/火山方舟" : "MiniMax"}，朗读{" "}
        {healthState.hasAliyunTts ? "阿里百炼 Qwen-TTS" : healthState.hasVolcTts ? "豆包语音" : "MiniMax Speech"}。
      </div>
    );
  }
  return (
    <div className="provider-banner">
      当前没有检测到完整真实模型密钥：问答/朗读会使用演示降级，所以开放问题可能不够灵活。请在服务端 `.env.local`
      配置 MiniMax/豆包和 TTS Key 后重启。
    </div>
  );
}

function ConsentGate({ state, updateState }: { state: AppState; updateState: (state: AppState) => void }) {
  const [nickname, setNickname] = useState(state.consent.nickname);
  const [ageBand, setAgeBand] = useState(state.consent.ageBand);

  return (
    <div className="consent-page">
      <motion.div className="consent-card" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <PixelMascot size="lg" mood="cheer" />
        <p className="eyebrow">开始前，先请家长看一眼</p>
        <h1>跳跳学长陪孩子学，但不替孩子做决定</h1>
        <p>
          这是一个黑客松 Demo。我们只保存本机学习进度，不采集真实姓名、学校、手机号或定位。拍照内容仅用于本次点评，AI
          生成内容会显式标注。
        </p>
        <label>
          孩子昵称，可留空
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="例如：小禾" />
        </label>
        <label>
          年龄段
          <select value={ageBand} onChange={(event) => setAgeBand(event.target.value as AppState["consent"]["ageBand"])}>
            <option>6-8岁</option>
            <option>9-10岁</option>
            <option>11-12岁</option>
          </select>
        </label>
        <div className="consent-list">
          <span>不做公开社区</span>
          <span>不做真实儿童长期档案</span>
          <span>不诱导提供隐私</span>
          <span>可随时清除本地数据</span>
        </div>
        <button
          className="primary-button"
          onClick={() =>
            updateState({
              ...state,
              consent: {
                accepted: true,
                nickname,
                ageBand,
                acceptedAt: new Date().toISOString()
              }
            })
          }
        >
          我是监护人，同意进入 Demo
        </button>
      </motion.div>
    </div>
  );
}

function HomePanel({ state, setTab }: { state: AppState; setTab: (tab: Tab) => void }) {
  const cards: Array<{ tab: Tab; icon: typeof Sparkles; title: string; text: string; tone: string }> = [
    { tab: "ask", icon: Sparkles, title: "我想问问题", text: "像朋友一样问跳跳学长，先鼓励，再一起想。", tone: "sky" },
    { tab: "read", icon: BookOpen, title: "一起读一会", text: "短文逐段朗读、解释、提问，家长也能参与。", tone: "leaf" },
    { tab: "photo", icon: Camera, title: "拍照让跳跳看看", text: "练字和作业温和点评，不排名、不羞辱。", tone: "red" },
    { tab: "image", icon: ImageIcon, title: "生成知识图", text: "把海洋、星星、种子变成手账风知识卡。", tone: "gold" },
    { tab: "video", icon: Video, title: "生成小视频", text: "异步生成科普小片，失败也有演示兜底。", tone: "ink" },
    { tab: "quiz", icon: Gamepad2, title: "亲子小游戏", text: "三题小闯关，正确答案一定在选项里。", tone: "orange" }
  ];

  return (
    <section className="home-panel">
      <motion.div className="hero-card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="hero-mascot-wrap">
          <PixelMascot size="lg" mood="happy" />
          <div className="orbit-ring" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div>
          <p className="eyebrow">晚饭后 10 分钟</p>
          <h2>{state.consent.nickname || "小朋友"}，今天想把哪个问号点亮？</h2>
          <p>跳跳学长会陪你和家人一起问、一起读、一起试。AI 生成内容仅供学习参考。</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setTab("ask")}>
              <Sparkles size={16} />
              开始提问
            </button>
            <button className="secondary-button" onClick={() => setTab("read")}>
              <BookOpen size={16} />
              共读一段
            </button>
          </div>
        </div>
      </motion.div>

      <div className="learning-track" aria-label="学习路径">
        <span>问</span>
        <i />
        <span>读</span>
        <i />
        <span>拍</span>
        <i />
        <span>玩</span>
      </div>

      <div className="feature-grid">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.button
              className={`feature-card tone-${card.tone}`}
              key={card.tab}
              onClick={() => setTab(card.tab)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <span className="feature-icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <strong>{card.title}</strong>
              <span>{card.text}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="record-strip">
        <strong>今日学习小脚印</strong>
        <span>{state.records.length ? `已经留下 ${state.records.length} 条记录` : "还没有记录，先问一个问题吧。"}</span>
      </div>
    </section>
  );
}

function ResponseCard({
  result,
  onSpeak,
  onSave,
  savedIds
}: {
  result: ChatResponse;
  onSpeak: (text: string) => void;
  onSave?: (image: ChatImageResult, topic: string) => void;
  savedIds?: Set<string>;
}) {
  const topic = result.imagePrompt || "知识图";

  return (
    <motion.article className="response-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <div className="response-head">
        <AiBadge meta={result.meta} />
        <button className="icon-button" onClick={() => onSpeak(`${result.encouragement} ${result.explanation}`)}>
          <Volume2 size={16} />
        </button>
      </div>
      <h3>{result.encouragement}</h3>
      <p className="question">跳跳先问：{result.diagnosisQuestion}</p>
      <p>{result.explanation}</p>
      <div className="mini-task">{result.miniTask}</div>
      <p className="parent-tip">给家长：{result.parentTip}</p>
      {result.quiz ? <QuizInline quiz={result.quiz} /> : null}
      {result.images && result.images.length > 0 ? (
        <div className="images-row">
          {result.images.map((img, i) => {
            const isStory = img.style === "storybook";
            const isSaved = savedIds?.has(img.url);
            return (
              <div className={`image-card ${isStory ? "storybook" : "realistic"}`} key={i}>
                <div className="image-card-label">
                  {isStory ? "🎨 绘本插图" : "📷 真实照片"}
                </div>
                <img src={img.url} alt={img.caption} loading="lazy" />
                <span className="image-caption">{img.caption}</span>
                {onSave ? (
                  <button
                    className={`save-button ${isSaved ? "saved" : ""}`}
                    onClick={() => onSave(img, topic)}
                    disabled={isSaved}
                  >
                    {isSaved ? "已收藏 ✓" : "收藏到绘本库"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </motion.article>
  );
}

function AskPanel({ state, updateState, addRecord }: { state: AppState; updateState: (next: AppState | ((prev: AppState) => AppState)) => void; addRecord: (record: Parameters<typeof createRecord>[0]) => void }) {
  const [message, setMessage] = useState("世界上最大的海是什么？");
  const [result, setResult] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const voice = useVoiceInput((text) => setMessage(text));

  const savedImageIds = new Set(state.pictureBook.map((p) => p.url));

  function onSaveImage(img: ChatImageResult, topic: string) {
    updateState((prev) => ({
      ...prev,
      pictureBook: [createSavedPicture({
        url: img.url,
        caption: img.caption,
        style: img.style,
        topic
      }), ...prev.pictureBook].slice(0, 50)
    }));
  }

  async function submit(sample?: string) {
    const text = sample || message;
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await chat({ mode: "explore", message: text, childProfile: childProfile(state) });
      setResult(data);
      addRecord({
        type: "chat",
        title: text.slice(0, 22),
        summary: data.explanation,
        source: data.meta.source
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "跳跳学长暂时没听清。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <SectionTitle kicker="探索问答" title="把孩子的一个问题，变成一家人的一小段旅程">
        先鼓励，再追问，再解释，最后给一个小任务。
      </SectionTitle>
      <div className="input-card">
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} />
        <div className="button-row">
          <button className="secondary-button" onClick={voice.listening ? voice.stop : voice.start} disabled={!voice.supported}>
            <Mic size={16} />
            {voice.listening ? "正在听" : voice.supported ? "语音输入" : "浏览器不支持语音"}
          </button>
          <button className="primary-button" onClick={() => submit()} disabled={loading}>
            <Send size={16} />
            问跳跳
          </button>
        </div>
      </div>
      <div className="sample-row">
        {safetySamples.slice(1, 3).map((sample) => (
          <button key={sample} onClick={() => submit(sample)}>
            安全样例：{sample}
          </button>
        ))}
      </div>
      {loading ? <LoadingDots /> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {result ? <ResponseCard result={result} onSpeak={speak} onSave={onSaveImage} savedIds={savedImageIds} /> : null}
    </section>
  );
}

function ReadingPanel({
  state,
  updateState,
  addRecord
}: {
  state: AppState;
  updateState: (next: AppState | ((prev: AppState) => AppState)) => void;
  addRecord: (record: Parameters<typeof createRecord>[0]) => void;
}) {
  const [readingId, setReadingId] = useState(readings[0].id);
  const [result, setResult] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const reading = readings.find((item) => item.id === readingId) || readings[0];
  const index = state.readingProgress[reading.id] || 0;
  const paragraph = reading.paragraphs[index];

  async function explain(action: "explain" | "question") {
    setLoading(true);
    try {
      const data = await chat({
        mode: "reading",
        message: `${action === "explain" ? "解释这段文字" : "围绕这段文字问孩子一个问题"}：${paragraph}`,
        childProfile: childProfile(state),
        context: { reading: reading.title, paragraph }
      });
      setResult(data);
      addRecord({
        type: "reading",
        title: `共读：${reading.title}`,
        summary: data.explanation,
        source: data.meta.source
      });
    } finally {
      setLoading(false);
    }
  }

  function nextParagraph() {
    updateState((prev) => ({
      ...prev,
      readingProgress: {
        ...prev.readingProgress,
        [reading.id]: (index + 1) % reading.paragraphs.length
      }
    }));
    setResult(null);
  }

  return (
    <section>
      <SectionTitle kicker="共读模式" title="一段文字，一次陪伴">
        只使用自建、公版、授权或用户上传材料，避免版权风险。
      </SectionTitle>
      <div className="input-card">
        <label>
          选择今天的短文
          <select value={readingId} onChange={(event) => setReadingId(event.target.value)}>
            {readings.map((item) => (
              <option value={item.id} key={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <p className="source-line">{reading.source} · {reading.ageHint}</p>
        <article className="reading-card">
          <span>第 {index + 1} 段 / {reading.paragraphs.length} 段</span>
          <p>{paragraph}</p>
        </article>
        <div className="button-row">
          <button className="secondary-button" onClick={() => speak(paragraph)}>
            <Play size={16} />
            听一遍
          </button>
          <button className="secondary-button" onClick={() => explain("explain")}>
            <Sparkles size={16} />
            解释
          </button>
          <button className="secondary-button" onClick={() => explain("question")}>
            <Gamepad2 size={16} />
            问我
          </button>
          <button className="primary-button" onClick={nextParagraph}>
            下一段
          </button>
        </div>
      </div>
      {loading ? <LoadingDots label="跳跳学长正在读这段话" /> : null}
      {result ? <ResponseCard result={result} onSpeak={speak} /> : null}
    </section>
  );
}

function PhotoPanel({ addRecord }: { addRecord: (record: Parameters<typeof createRecord>[0]) => void }) {
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<VisionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFile(file?: File) {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const compressed = await fileToCompressedDataUrl(file);
    setPreview(compressed);
    try {
      const data = await vision(compressed, "handwriting");
      setResult(data);
      addRecord({
        type: "vision",
        title: "拍照点评",
        summary: `${data.praise} ${data.improvement}`,
        source: data.meta.source
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <SectionTitle kicker="拍照点评" title="先看见努力，再给一个小建议">
        图片会先在浏览器压缩；Demo 不保存原图，不做人脸识别。
      </SectionTitle>
      <div className="input-card">
        <label className="upload-zone">
          <Camera size={28} />
          <strong>拍一张练字或作业</strong>
          <span>只给温和建议，不显示百分比评分</span>
          <input accept="image/*" capture="environment" type="file" onChange={(event) => onFile(event.target.files?.[0])} />
        </label>
      </div>
      {preview ? <img className="photo-preview" src={preview} alt="上传的作业预览" /> : null}
      {loading ? <LoadingDots label="跳跳学长正在认真看" /> : null}
      {result ? (
        <motion.article className="response-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="response-head">
            <AiBadge meta={result.meta} />
            <button className="icon-button" onClick={() => speak(`${result.praise} ${result.improvement}`)}>
              <Volume2 size={16} />
            </button>
          </div>
          <h3>{result.praise}</h3>
          <ul>
            {result.observations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mini-task">{result.improvement}</div>
          <p>{result.tryAgain}</p>
          <p className="parent-tip">给家长：{result.parentTip}</p>
        </motion.article>
      ) : null}
    </section>
  );
}

function ImagePanel({ addRecord }: { addRecord: (record: Parameters<typeof createRecord>[0]) => void }) {
  const [prompt, setPrompt] = useState("世界上最大的海是什么样子");
  const [style, setStyle] = useState<"knowledge-card" | "sticker" | "storybook">("knowledge-card");
  const [result, setResult] = useState<ImageResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const data = await generateImage(prompt, style);
      setResult(data);
      addRecord({
        type: "image",
        title: `知识图：${prompt.slice(0, 18)}`,
        summary: data.caption,
        source: data.meta.source
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <SectionTitle kicker="生成知识图" title="把抽象问题变成孩子能看的画">
        默认手账风知识卡，所有生成内容都会标注。
      </SectionTitle>
      <div className="input-card">
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} />
        <label>
          图像风格
          <select value={style} onChange={(event) => setStyle(event.target.value as typeof style)}>
            <option value="knowledge-card">知识卡</option>
            <option value="sticker">贴纸</option>
            <option value="storybook">绘本场景</option>
          </select>
        </label>
        <button className="primary-button" onClick={submit} disabled={loading}>
          <ImageIcon size={16} />
          生成知识图
        </button>
      </div>
      {loading ? <LoadingDots label="跳跳正在画一张知识图" /> : null}
      {result ? (
        <article className="image-result">
          <AiBadge meta={result.meta} />
          {result.imageUrl ? <img src={result.imageUrl} alt={result.caption} /> : null}
          <p>{result.caption}</p>
        </article>
      ) : null}
    </section>
  );
}

function VideoPanel({ addRecord }: { addRecord: (record: Parameters<typeof createRecord>[0]) => void }) {
  const [prompt, setPrompt] = useState("用 20 秒讲清楚一粒种子怎么发芽");
  const [job, setJob] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;
    const timer = window.setInterval(async () => {
      const next = await getVideoJob(job.id);
      setJob(next);
      if (next.status === "completed") {
        addRecord({
          type: "video",
          title: `小视频：${next.prompt.slice(0, 16)}`,
          summary: next.message,
          source: next.meta.source
        });
      }
    }, 1200);
    return () => window.clearInterval(timer);
  }, [job, addRecord]);

  async function submit() {
    setLoading(true);
    try {
      const data = await createVideo(prompt);
      setJob(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <SectionTitle kicker="异步视频" title="视频很贵也很慢，所以让它排队生成">
        现场答辩可展示真实任务或诚实 fallback。
      </SectionTitle>
      <div className="input-card">
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} />
        <button className="primary-button" onClick={submit} disabled={loading}>
          <Video size={16} />
          提交视频任务
        </button>
      </div>
      {loading ? <LoadingDots label="正在提交任务" /> : null}
      {job ? (
        <article className="response-card">
          <div className="response-head">
            <AiBadge meta={job.meta} />
            <span>{job.status}</span>
          </div>
          <h3>{job.message}</h3>
          <div className="progress-bar">
            <span style={{ width: `${job.progress}%` }} />
          </div>
          <p>{job.progress}% · {job.prompt}</p>
          {job.videoUrl ? <video controls src={job.videoUrl} /> : null}
        </article>
      ) : null}
    </section>
  );
}

function QuizInline({ quiz }: { quiz: QuizQuestion }) {
  const [selected, setSelected] = useState("");
  const correct = selected && selected === quiz.answer;
  return (
    <div className="quiz-card">
      <strong>{quiz.question}</strong>
      <div className="quiz-options">
        {quiz.options.map((option) => (
          <button
            className={selected === option ? (correct ? "correct" : "wrong") : ""}
            key={option}
            onClick={() => setSelected(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {selected ? <p>{correct ? "答对啦！" : "没关系，再想想。"} {quiz.reason}</p> : null}
    </div>
  );
}

function QuizPanel({ state, addRecord }: { state: AppState; addRecord: (record: Parameters<typeof createRecord>[0]) => void }) {
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [stars, setStars] = useState(0);
  const latest = state.records[0]?.summary || "星星、河流、种子和今天的问题";

  async function makeQuiz() {
    setLoading(true);
    try {
      const data = await chat({
        mode: "quiz",
        message: `围绕这些学习记录出一道亲子小游戏题：${latest}`,
        childProfile: childProfile(state)
      });
      setQuiz(data.quiz || null);
      addRecord({
        type: "quiz",
        title: "亲子小游戏",
        summary: data.quiz?.question || data.miniTask,
        source: data.meta.source
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <SectionTitle kicker="亲子小游戏" title="不刷榜，只给一点点星光">
        题目来自今天学过的内容，正确答案必须在选项里。
      </SectionTitle>
      <div className="input-card">
        <div className="star-meter" aria-label={`当前星光 ${stars} / 3`}>
          <span>当前星光</span>
          {Array.from({ length: 3 }).map((_, index) => (
            <i key={index} className={index < stars ? "filled" : ""} />
          ))}
        </div>
        <button className="primary-button" onClick={makeQuiz} disabled={loading}>
          <Gamepad2 size={16} />
          生成一题
        </button>
      </div>
      {loading ? <LoadingDots label="跳跳正在出题" /> : null}
      {quiz ? <QuizInline quiz={quiz} /> : null}
      {quiz ? (
        <button className="secondary-button" onClick={() => setStars((value) => Math.min(3, value + 1))}>
          我们讨论完了，收一颗星
        </button>
      ) : null}
    </section>
  );
}

function ParentPanel({ state, addRecord }: { state: AppState; addRecord: (record: Parameters<typeof createRecord>[0]) => void }) {
  const [card, setCard] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const recordText = useMemo(
    () => state.records.slice(0, 6).map((record) => `${record.title}：${record.summary}`).join("\n") || "今天还没有学习记录。",
    [state.records]
  );

  async function generate() {
    setLoading(true);
    try {
      const data = await chat({
        mode: "parent-card",
        message: `请基于今天的学习记录，给家长一张低门槛陪伴卡：\n${recordText}`,
        childProfile: childProfile(state)
      });
      setCard(data);
      addRecord({
        type: "chat",
        title: "家长陪伴卡",
        summary: `${data.encouragement} ${data.parentTip}`,
        source: data.meta.source
      });
    } finally {
      setLoading(false);
    }
  }

  const copyText = card
    ? `跳跳学长家长陪伴卡\n${card.encouragement}\n今晚聊：${card.diagnosisQuestion}\n小任务：${card.miniTask}\n给家长：${card.parentTip}`
    : "";

  return (
    <section>
      <SectionTitle kicker="家长陪伴卡" title="让家长知道今晚可以怎么陪">
        不要求家长会所有知识，只要求愿意一起问。
      </SectionTitle>
      <div className="record-list">
        {state.records.slice(0, 5).map((record) => (
          <div key={record.id}>
            <strong>{record.title}</strong>
            <span>{record.summary.slice(0, 56)}</span>
          </div>
        ))}
      </div>
      <div className="button-row">
        <button className="primary-button" onClick={generate} disabled={loading}>
          <Sparkles size={16} />
          生成陪伴卡
        </button>
        <button className="secondary-button" onClick={() => navigator.clipboard?.writeText(copyText)} disabled={!card}>
          复制
        </button>
      </div>
      {loading ? <LoadingDots label="跳跳正在写给家长的话" /> : null}
      {card ? <ResponseCard result={card} onSpeak={speak} /> : null}
      <button className="ghost-button stop-button" onClick={stopSpeaking}>
        <Pause size={16} />
        停止朗读
      </button>
    </section>
  );
}

function PictureBookPanel({ state, updateState }: { state: AppState; updateState: (next: AppState | ((prev: AppState) => AppState)) => void }) {
  const [viewing, setViewing] = useState<SavedPicture | null>(null);

  function remove(id: string) {
    updateState((prev) => ({
      ...prev,
      pictureBook: prev.pictureBook.filter((p) => p.id !== id)
    }));
    if (viewing?.id === id) setViewing(null);
  }

  const storyBooks = state.pictureBook.filter((p) => p.style === "storybook" || p.style === "knowledge-card");
  const realPhotos = state.pictureBook.filter((p) => p.style === "realistic");

  if (viewing) {
    return (
      <section>
        <div className="viewer-overlay" onClick={() => setViewing(null)}>
          <div className="viewer-card" onClick={(e) => e.stopPropagation()}>
            <button className="viewer-close" onClick={() => setViewing(null)}>✕</button>
            <img src={viewing.url} alt={viewing.caption} />
            <div className="viewer-info">
              <p className="viewer-caption">{viewing.caption}</p>
              <p className="viewer-topic">来源：{viewing.topic}</p>
              <p className="viewer-date">{new Date(viewing.savedAt).toLocaleDateString("zh-CN")}</p>
            </div>
            <button className="ghost-button" onClick={() => remove(viewing.id)}>
              <Trash2 size={15} /> 从绘本库移除
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionTitle kicker="绘本库" title="把学过的世界装进小书架">
        问过的问题、看过的图，都可以收藏到这里，随时翻阅。
      </SectionTitle>

      {state.pictureBook.length === 0 ? (
        <div className="empty-picture-book">
          <Heart size={36} />
          <p>绘本库还是空的</p>
          <span>去「提问」里问一个问题，生成图片后点「收藏到绘本库」就可以啦。</span>
        </div>
      ) : null}

      {storyBooks.length > 0 ? (
        <>
          <h3 className="shelf-title">🎨 绘本插图</h3>
          <div className="picture-grid">
            {storyBooks.map((pic) => (
              <div className="picture-thumb" key={pic.id} onClick={() => setViewing(pic)}>
                <img src={pic.url} alt={pic.caption} loading="lazy" />
                <span>{pic.topic.slice(0, 12)}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {realPhotos.length > 0 ? (
        <>
          <h3 className="shelf-title">📷 真实照片</h3>
          <div className="picture-grid">
            {realPhotos.map((pic) => (
              <div className="picture-thumb" key={pic.id} onClick={() => setViewing(pic)}>
                <img src={pic.url} alt={pic.caption} loading="lazy" />
                <span>{pic.topic.slice(0, 12)}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {state.pictureBook.length > 0 ? (
        <button className="secondary-button" onClick={() => {
          if (confirm("确定要清空整个绘本库吗？")) {
            updateState((prev) => ({ ...prev, pictureBook: [] }));
          }
        }}>
          <Trash2 size={15} /> 清空绘本库
        </button>
      ) : null}
    </section>
  );
}
