interface TimeCapsuleRevealProps {
  message: string;
  onClose: () => void;
}

export default function TimeCapsuleReveal({ message, onClose }: TimeCapsuleRevealProps) {
  return (
    <div className="modal-overlay capsule-reveal-overlay" onClick={onClose}>
      <div className="capsule-reveal" onClick={(e) => e.stopPropagation()}>
        <div className="capsule-envelope-open">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="6" width="20" height="14" rx="2" />
            <path d="M2 8l10 6 10-6" />
            <path className="capsule-flap" d="M2 6l10-4 10 4" />
          </svg>
        </div>
        <h3 className="capsule-reveal-title">타임캡슐이 도착했습니다!</h3>
        <div className="capsule-reveal-message">
          <p>{message}</p>
        </div>
        <button className="btn-primary capsule-reveal-close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
