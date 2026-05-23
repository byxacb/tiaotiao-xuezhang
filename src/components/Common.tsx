import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import type { ApiMeta } from "../types";

export function SectionTitle({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="section-title">
      <span>{kicker}</span>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function AiBadge({ meta }: { meta?: ApiMeta }) {
  if (!meta) return <span className="ai-badge">AI 生成</span>;
  return (
    <span className={`ai-badge ${meta.fallback ? "fallback" : ""}`}>
      {meta.fallback ? "演示降级" : `真实 ${meta.source}`} · AI 生成
    </span>
  );
}

export function LoadingDots({ label = "跳跳学长思考中" }: { label?: string }) {
  return (
    <div className="loading-dots" aria-live="polite">
      <span>{label}</span>
      <i />
      <i />
      <i />
    </div>
  );
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="toast"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={onClose}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
