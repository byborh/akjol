import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import type { LifeSession, UserPathStep } from '../types';
import type { SharedLifePreview } from '../services/lifeSharingService';
import { StorageService } from '../services/storageService';
import { AuthService } from '../services/authService';
import { LifeSharingService } from '../services/lifeSharingService';
import { useData } from '../contexts/DataContext';
import { TEST_USERS } from '../constants/auth';
import { buildDefaultSession, buildUniqueName, formatDateTime } from '../utils/lifeSessionUtils';

export type AppView = 'home' | 'explore' | 'formations';

export const useAkJolApp = () => {
  const { resetToInitialData } = useData();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<AppView>('home');
  const [sessions, setSessions] = useState<LifeSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [pendingSharedToken, setPendingSharedToken] = useState<string | null>(null);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importValue, setImportValue] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [importFeedback, setImportFeedback] = useState('');
  const [latestShareUrl, setLatestShareUrl] = useState('');
  const [latestShareExpiresAt, setLatestShareExpiresAt] = useState<number | null>(null);
  const [selectedShareTtlMs, setSelectedShareTtlMs] = useState<number>(
    LifeSharingService.getDefaultShareTtlMs()
  );
  const [pendingImportSession, setPendingImportSession] = useState<LifeSession | null>(null);
  const [importPreview, setImportPreview] = useState<SharedLifePreview | null>(null);
  const [selectedFormationNodeId, setSelectedFormationNodeId] = useState<number | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  useEffect(() => {
    const authSession = AuthService.getAuthSession();
    if (authSession) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const storedSessions = StorageService.getAllSessions();

    if (storedSessions.length === 0) {
      const initialSession = buildDefaultSession('Vie #1');
      StorageService.saveSession(initialSession);
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
      setView('home');
      setSessionsLoaded(true);
      return;
    }

    setSessions(storedSessions);

    const lastActiveId = StorageService.getActiveSessionId();
    const isValidId = lastActiveId && storedSessions.some((session) => session.id === lastActiveId);
    setActiveSessionId(isValidId ? lastActiveId : storedSessions[0].id);
    setSessionsLoaded(true);
  }, []);

  useEffect(() => {
    const sharedToken = LifeSharingService.consumeTokenFromCurrentUrl();
    if (sharedToken) {
      setPendingSharedToken(sharedToken);
      setShowImportPanel(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionsLoaded || !isLoggedIn || !pendingSharedToken) return;

    try {
      const preparedImport = LifeSharingService.prepareImportFromInput(pendingSharedToken);
      const uniqueName = buildUniqueName(
        preparedImport.session.name,
        sessions.map((session) => session.name)
      );
      const preparedSession: LifeSession = {
        ...preparedImport.session,
        name: uniqueName
      };
      const preview: SharedLifePreview = {
        ...preparedImport.preview,
        name: uniqueName
      };

      setPendingImportSession(preparedSession);
      setImportPreview(preview);
      setImportFeedback('Lien detecte. Verifiez l apercu puis confirmez l import.');
      setImportValue('');
      setShowImportPanel(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import impossible.';
      setImportFeedback(message);
    } finally {
      setPendingSharedToken(null);
    }
  }, [isLoggedIn, pendingSharedToken, sessions, sessionsLoaded]);

  useEffect(() => {
    if (!activeSession) return;
    // Ne pas changer la vue si l'utilisateur est dans l'explorer de formations
    setView((currentView) => {
      if (currentView === 'formations') return currentView;
      return activeSession.path.length > 0 || activeSession.startingNodeId ? 'explore' : 'home';
    });
  }, [activeSession]);

  useEffect(() => {
    if (activeSessionId) {
      StorageService.setActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  const upsertSession = (updatedSession: LifeSession) => {
    setSessions((prev) => {
      const index = prev.findIndex((session) => session.id === updatedSession.id);
      if (index === -1) return [...prev, updatedSession];

      const clone = [...prev];
      clone[index] = updatedSession;
      return clone;
    });

    StorageService.saveSession(updatedSession);
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const isValidUser = TEST_USERS.some(
      (user) => user.email === normalizedEmail && user.password === password
    );

    if (!isValidUser) {
      alert('Identifiants incorrects.');
      return;
    }

    AuthService.saveAuthSession(normalizedEmail);
    setIsLoggedIn(true);
    setEmail('');
    setPassword('');
  };

  const handleLogout = () => {
    AuthService.clearAuthSession();
    setIsLoggedIn(false);
  };

  const handleCreateNewLife = () => {
    const nextName = `Vie #${sessions.length + 1}`;
    const newSession = buildDefaultSession(nextName);

    upsertSession(newSession);
    setActiveSessionId(newSession.id);
    setView('home');
    
    // Réinitialiser les données aux 50 premières formations
    resetToInitialData();
  };

  const handleDeleteSession = (id: string) => {
    StorageService.deleteSession(id);

    setSessions((prev) => {
      const updated = prev.filter((session) => session.id !== id);

      if (updated.length === 0) {
        const fallback = buildDefaultSession('Vie #1');
        StorageService.saveSession(fallback);
        setActiveSessionId(fallback.id);
        setView('home');
        return [fallback];
      }

      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
      }

      return updated;
    });
  };

  const handleStartRenameSession = (session: LifeSession) => {
    setEditingSessionId(session.id);
    setEditingName(session.name);
  };

  const handleCommitRenameSession = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingSessionId(null);
      setEditingName('');
      return;
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.id === id
          ? {
              ...session,
              name: trimmed
            }
          : session
      )
    );

    StorageService.updateSessionName(id, trimmed);
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleCancelRenameSession = () => {
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleStartExplore = (nodeId: number) => {
    if (!activeSession) return;

    const updatedSession: LifeSession = {
      ...activeSession,
      startingNodeId: nodeId
    };

    upsertSession(updatedSession);
    setView('explore');
  };

  const handleBackToHome = () => {
    if (!activeSession) return;

    setView('home');

    const updatedSession: LifeSession = {
      ...activeSession,
      startingNodeId: null,
      path: []
    };

    upsertSession(updatedSession);
  };

  const handlePathChange = (path: UserPathStep[]) => {
    if (!activeSession) return;

    const updatedSession: LifeSession = {
      ...activeSession,
      path,
      stats: {
        ...activeSession.stats,
        age: 17 + Math.max(0, path.length - 1)
      }
    };

    upsertSession(updatedSession);
  };

  const handleShareCurrentLife = async () => {
    if (!activeSession) return;

    const shareUrl = LifeSharingService.buildShareUrlForSession(activeSession, {
      ttlMs: selectedShareTtlMs
    });
    const expiresAt = Date.now() + selectedShareTtlMs;
    setLatestShareUrl(shareUrl);
    setLatestShareExpiresAt(expiresAt);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Simulation AkJol: ${activeSession.name}`,
          text: 'Voici ma simulation de vie AkJol.',
          url: shareUrl
        });
        setShareFeedback(`Lien partage. Expiration: ${formatDateTime(expiresAt)}.`);
        return;
      } catch {
        // Fallback clipboard below
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback(`Lien copie. Expiration: ${formatDateTime(expiresAt)}.`);
    } catch {
      setShareFeedback('Copie automatique impossible. Copiez le lien affiche.');
    }
  };

  const handleCopyLatestShareUrl = async () => {
    if (!latestShareUrl) return;

    try {
      await navigator.clipboard.writeText(latestShareUrl);
      setShareFeedback('Lien copie dans le presse-papiers.');
    } catch {
      setShareFeedback('Impossible de copier automatiquement ce lien.');
    }
  };

  const handleToggleImportPanel = () => {
    setShowImportPanel((prev) => !prev);
    setImportFeedback('');
  };

  const handleImportSharedLife = () => {
    try {
      const preparedImport = LifeSharingService.prepareImportFromInput(importValue);
      const uniqueName = buildUniqueName(
        preparedImport.session.name,
        sessions.map((session) => session.name)
      );

      const preparedSession: LifeSession = {
        ...preparedImport.session,
        name: uniqueName
      };
      const preview: SharedLifePreview = {
        ...preparedImport.preview,
        name: uniqueName
      };

      setPendingImportSession(preparedSession);
      setImportPreview(preview);
      setImportFeedback('Apercu pret. Confirmez pour importer cette vie.');
      setShowImportPanel(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import impossible.';
      setImportFeedback(message);
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImportSession || !importPreview) return;

    upsertSession(pendingImportSession);
    setActiveSessionId(pendingImportSession.id);
    setImportFeedback(`Vie importee: ${pendingImportSession.name}`);
    setImportValue('');
    setPendingImportSession(null);
    setImportPreview(null);
  };

  const handleCancelImport = () => {
    setPendingImportSession(null);
    setImportPreview(null);
    setImportFeedback('Import annule.');
  };

  const handleOpenFormations = (nodeId?: number) => {
    if (nodeId) {
      setSelectedFormationNodeId(nodeId);
    }
    setView('formations');
  };

  const handleCloseFormations = () => {
    // Retour à la vue précédente (home ou explore selon l'état de la session active)
    setSelectedFormationNodeId(null);
    if (activeSession && (activeSession.path.length > 0 || activeSession.startingNodeId)) {
      setView('explore');
    } else {
      setView('home');
    }
  };

  return {
    isLoggedIn,
    email,
    password,
    view,
    sessions,
    activeSessionId,
    editingSessionId,
    editingName,
    showImportPanel,
    importValue,
    shareFeedback,
    importFeedback,
    latestShareUrl,
    latestShareExpiresAt,
    selectedShareTtlMs,
    importPreview,
    activeSession,
    selectedFormationNodeId,
    setEmail,
    setPassword,
    setActiveSessionId,
    setEditingName,
    setImportValue,
    setSelectedShareTtlMs,
    handleLogin,
    handleLogout,
    handleCreateNewLife,
    handleDeleteSession,
    handleStartRenameSession,
    handleCommitRenameSession,
    handleCancelRenameSession,
    handleStartExplore,
    handleBackToHome,
    handlePathChange,
    handleShareCurrentLife,
    handleCopyLatestShareUrl,
    handleToggleImportPanel,
    handleImportSharedLife,
    handleConfirmImport,
    handleCancelImport,
    handleOpenFormations,
    handleCloseFormations
  };
};
