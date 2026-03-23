import type { SyncStatus } from '../hooks/useSync';

interface PWAControlCenterProps {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  needRefresh: boolean;
  offlineReady: boolean;
  pendingChanges: number;
  syncStatus: SyncStatus;
  lastSynced: number | null;
  onInstall: () => Promise<boolean>;
  onApplyUpdate: () => Promise<void>;
  onDismissNotice: () => void;
  onForceSync: () => void;
}

function formatLastSynced(lastSynced: number | null): string | null {
  if (!lastSynced) return null;
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(lastSynced);
}

export default function PWAControlCenter({
  isOnline,
  isInstalled,
  isInstallable,
  needRefresh,
  offlineReady,
  pendingChanges,
  syncStatus,
  lastSynced,
  onInstall,
  onApplyUpdate,
  onDismissNotice,
  onForceSync,
}: PWAControlCenterProps) {
  const showPanel =
    !isOnline ||
    isInstallable ||
    needRefresh ||
    offlineReady ||
    pendingChanges > 0 ||
    syncStatus === 'disabled';

  if (!showPanel) return null;

  const lastSyncedLabel = formatLastSynced(lastSynced);

  let title = 'Offline Capsule';
  let description = '앱을 설치하면 홈 화면에서 바로 열고, 연결이 끊겨도 마지막 상태를 계속 유지할 수 있습니다.';

  if (needRefresh) {
    title = '새 빌드가 도착했습니다';
    description = '지금 새 버전으로 전환해 실험 기능과 최신 캐시를 즉시 반영할 수 있습니다.';
  } else if (!isOnline) {
    title = '오프라인 모드로 전환되었습니다';
    description = pendingChanges > 0
      ? `변경사항 ${pendingChanges}건을 기기에 보관 중이며, 연결이 돌아오면 자동으로 재시도합니다.`
      : '지금도 로컬 데이터는 계속 저장되며, 다시 연결되면 원격 동기화를 재개합니다.';
  } else if (syncStatus === 'disabled') {
    title = '로컬 우선 모드가 활성화되었습니다';
    description = '이 배포에는 `/api/sync` 엔드포인트가 없어 원격 대신 기기 저장소를 기본 데이터 소스로 사용합니다.';
  } else if (offlineReady) {
    title = '오프라인 캐시가 준비되었습니다';
    description = '핵심 화면과 자산이 캐시되어 네트워크가 불안정한 상황에서도 실험 앱을 빠르게 다시 열 수 있습니다.';
  } else if (isInstallable) {
    title = '앱처럼 설치해 보세요';
    description = '브라우저 탭 대신 독립 실행형으로 띄워 실험 중인 오프라인 경험을 바로 확인할 수 있습니다.';
  }

  return (
    <section className="pwa-control-center">
      <div className="pwa-control-copy">
        <span className="pwa-control-eyebrow">Nightly Experiment</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="pwa-pill-row">
        {!isOnline && <span className="pwa-pill warning">Offline</span>}
        {syncStatus === 'disabled' && <span className="pwa-pill">Local-only sync</span>}
        {offlineReady && <span className="pwa-pill success">Offline ready</span>}
        {needRefresh && <span className="pwa-pill accent">Update ready</span>}
        {isInstallable && <span className="pwa-pill">Installable</span>}
        {isInstalled && <span className="pwa-pill success">Installed</span>}
        {pendingChanges > 0 && <span className="pwa-pill accent">Pending {pendingChanges}</span>}
        {lastSyncedLabel && <span className="pwa-pill">Last sync {lastSyncedLabel}</span>}
      </div>

      <div className="pwa-control-actions">
        {isInstallable && (
          <button className="btn-primary" onClick={() => { void onInstall(); }}>
            앱 설치
          </button>
        )}
        {needRefresh && (
          <button className="btn-primary" onClick={() => { void onApplyUpdate(); }}>
            새 버전 적용
          </button>
        )}
        {isOnline && syncStatus !== 'disabled' && (
          <button className="btn-secondary" onClick={onForceSync}>
            지금 동기화
          </button>
        )}
        {(offlineReady || needRefresh) && (
          <button className="btn-secondary" onClick={onDismissNotice}>
            나중에
          </button>
        )}
      </div>
    </section>
  );
}
