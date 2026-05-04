import type { LifeSession } from '../types';
import type { ShareDurationOption } from '../constants/sharing';
import { useTheme } from '../contexts/ThemeContext';

type AppHeaderProps = {
  sessions: LifeSession[];
  activeSessionId: string | null;
  editingSessionId: string | null;
  editingName: string;
  showImportPanel: boolean;
  importValue: string;
  latestShareUrl: string;
  latestShareExpiresAt: number | null;
  shareFeedback: string;
  importFeedback: string;
  selectedShareTtlMs: number;
  shareDurationOptions: ShareDurationOption[];
  onSelectSession: (id: string) => void;
  onStartRenameSession: (session: LifeSession) => void;
  onEditingNameChange: (value: string) => void;
  onCommitRenameSession: (id: string) => void;
  onCancelRenameSession: () => void;
  onDeleteSession: (id: string) => void;
  onCreateNewLife: () => void;
  onChangeShareTtl: (ttlMs: number) => void;
  onShareCurrentLife: () => void;
  onToggleImportPanel: () => void;
  onImportValueChange: (value: string) => void;
  onImportSharedLife: () => void;
  onCopyLatestShareUrl: () => void;
  onLogout: () => void;
  onOpenFormations: () => void;
  formatDateTime: (timestamp: number) => string;
};

const AppHeader = ({
  sessions,
  activeSessionId,
  editingSessionId,
  editingName,
  showImportPanel,
  importValue,
  latestShareUrl,
  latestShareExpiresAt,
  shareFeedback,
  importFeedback,
  selectedShareTtlMs,
  shareDurationOptions,
  onSelectSession,
  onStartRenameSession,
  onEditingNameChange,
  onCommitRenameSession,
  onCancelRenameSession,
  onDeleteSession,
  onCreateNewLife,
  onChangeShareTtl,
  onShareCurrentLife,
  onToggleImportPanel,
  onImportValueChange,
  onImportSharedLife,
  onCopyLatestShareUrl,
  onLogout,
  onOpenFormations,
  formatDateTime
}: AppHeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="sticky top-0 z-[60] border-b border-[#E2E8F0] dark:border-[#27272A] bg-white/95 dark:bg-[#27272A]/95 backdrop-blur px-3 py-2 transition-colors duration-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = session.id === editingSessionId;

            return (
              <div
                key={session.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors ${
                  isActive
                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-gray-900 dark:text-white'
                    : 'border-[#E2E8F0] dark:border-[#27272A] bg-[#E2E8F0] dark:bg-[#27272A] text-gray-700 dark:text-gray-300'
                }`}
              >
                {isEditing ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(event) => onEditingNameChange(event.target.value)}
                    onBlur={() => onCommitRenameSession(session.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') onCommitRenameSession(session.id);
                      if (event.key === 'Escape') onCancelRenameSession();
                    }}
                    className="w-28 rounded bg-white dark:bg-[#27272A] border border-[#E2E8F0] dark:border-[#27272A] px-2 py-1 text-xs text-gray-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                ) : (
                  <button
                    onClick={() => onSelectSession(session.id)}
                    onDoubleClick={() => onStartRenameSession(session)}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {session.name}
                  </button>
                )}

                <button
                  onClick={() => onDeleteSession(session.id)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Supprimer ${session.name}`}
                >
                  x
                </button>
              </div>
            );
          })}

          <button
            onClick={onCreateNewLife}
            className="rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-[#E2E8F0] dark:bg-[#27272A] px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-[#CBD5E1] dark:hover:bg-[#3F3F46] whitespace-nowrap transition-colors"
          >
            + Nouvelle Vie
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-[#E2E8F0] dark:bg-[#27272A] px-3 py-1.5 text-sm hover:bg-[#CBD5E1] dark:hover:bg-[#3F3F46] transition-colors"
            aria-label="Basculer entre mode clair et sombre"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <select
            aria-label="Duree d expiration du lien de partage"
            value={selectedShareTtlMs}
            onChange={(event) => onChangeShareTtl(Number(event.target.value))}
            className="rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#27272A] px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
          >
            {shareDurationOptions.map((option) => (
              <option key={option.ttlMs} value={option.ttlMs}>
                Expire dans {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={onShareCurrentLife}
            className="rounded-lg border border-[#8B5CF6] bg-[#8B5CF6]/20 px-3 py-1.5 text-sm text-[#8B5CF6] hover:bg-[#8B5CF6]/30 whitespace-nowrap transition-colors font-medium"
          >
            Partager cette vie
          </button>

          <button
            onClick={onToggleImportPanel}
            className="rounded-lg border border-[#8B5CF6] bg-[#8B5CF6]/20 px-3 py-1.5 text-sm text-[#8B5CF6] hover:bg-[#8B5CF6]/30 whitespace-nowrap transition-colors font-medium"
          >
            Recuperer une vie
          </button>

          <button
            onClick={onOpenFormations}
            className="rounded-lg border border-[#8B5CF6] bg-[#8B5CF6]/20 px-3 py-1.5 text-sm text-[#8B5CF6] hover:bg-[#8B5CF6]/30 whitespace-nowrap transition-colors font-medium"
          >
            📚 Formations
          </button>

          <button
            onClick={onLogout}
            className="rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-[#E2E8F0] dark:bg-[#27272A] px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-500/20 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap transition-colors font-medium"
          >
            Deconnexion
          </button>
        </div>
      </div>

      {(latestShareUrl || showImportPanel || shareFeedback || importFeedback) && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-[#E2E8F0]/70 dark:bg-[#27272A]/70 p-2 transition-colors">
          {latestShareUrl && (
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <input
                readOnly
                value={latestShareUrl}
                className="w-full rounded border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#27272A] px-2 py-1 text-xs text-gray-700 dark:text-gray-200"
              />
              <button
                onClick={onCopyLatestShareUrl}
                className="rounded border border-[#8B5CF6] bg-[#8B5CF6]/20 px-2 py-1 text-xs text-[#8B5CF6] hover:bg-[#8B5CF6]/30 whitespace-nowrap transition-colors"
              >
                Copier le lien
              </button>
            </div>
          )}

          {latestShareExpiresAt && (
            <p className="text-xs text-[#8B5CF6]">
              Ce lien expire le {formatDateTime(latestShareExpiresAt)}.
            </p>
          )}

          {showImportPanel && (
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <input
                value={importValue}
                onChange={(event) => onImportValueChange(event.target.value)}
                placeholder="Collez le lien ou le token de partage"
                className="w-full rounded border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#27272A] px-2 py-1 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              />
              <button
                onClick={onImportSharedLife}
                className="rounded border border-[#8B5CF6] bg-[#8B5CF6]/20 px-2 py-1 text-xs text-[#8B5CF6] hover:bg-[#8B5CF6]/30 whitespace-nowrap transition-colors"
              >
                Importer
              </button>
            </div>
          )}

          {shareFeedback && <p className="text-xs text-[#8B5CF6]">{shareFeedback}</p>}
          {importFeedback && <p className="text-xs text-[#8B5CF6]">{importFeedback}</p>}
        </div>
      )}
    </div>
  );
};

export default AppHeader;
