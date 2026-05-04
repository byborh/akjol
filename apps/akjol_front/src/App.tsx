"use client";

import StartingPoint from './components/StartingPoint';
import ExploreTimeline from './components/ExploreTimeline';
import AppHeader from './components/AppHeader';
import ImportPreviewModal from './components/ImportPreviewModal';
import LoginPanel from './components/LoginPanel';
import { FormationExplorer } from './components/FormationExplorer';
import { SHARE_DURATION_OPTIONS } from './constants/sharing';
import { getTestUsersHint } from './constants/auth';
import { useAkJolApp } from './hooks/useAkJolApp';
import { formatDateTime } from './utils/lifeSessionUtils';
import { useData } from './contexts/DataContext';

const App = () => {
  const app = useAkJolApp();
  const { isLoading: dataLoading, error: dataError } = useData();

  if (!app.isLoggedIn) {
    return (
      <LoginPanel
        email={app.email}
        password={app.password}
        onEmailChange={app.setEmail}
        onPasswordChange={app.setPassword}
        onSubmit={app.handleLogin}
        testUsersHint={getTestUsersHint()}
      />
    );
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-6xl animate-spin mb-4">🔄</div>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            Chargement des formations...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Récupération depuis les APIs ONISEP
          </p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Erreur de chargement
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {dataError.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121212] transition-colors duration-200">
      <AppHeader
        sessions={app.sessions}
        activeSessionId={app.activeSessionId}
        editingSessionId={app.editingSessionId}
        editingName={app.editingName}
        showImportPanel={app.showImportPanel}
        importValue={app.importValue}
        latestShareUrl={app.latestShareUrl}
        latestShareExpiresAt={app.latestShareExpiresAt}
        shareFeedback={app.shareFeedback}
        importFeedback={app.importFeedback}
        selectedShareTtlMs={app.selectedShareTtlMs}
        shareDurationOptions={SHARE_DURATION_OPTIONS}
        onSelectSession={app.setActiveSessionId}
        onStartRenameSession={app.handleStartRenameSession}
        onEditingNameChange={app.setEditingName}
        onCommitRenameSession={app.handleCommitRenameSession}
        onCancelRenameSession={app.handleCancelRenameSession}
        onDeleteSession={app.handleDeleteSession}
        onCreateNewLife={app.handleCreateNewLife}
        onChangeShareTtl={app.setSelectedShareTtlMs}
        onShareCurrentLife={app.handleShareCurrentLife}
        onToggleImportPanel={app.handleToggleImportPanel}
        onImportValueChange={app.setImportValue}
        onImportSharedLife={app.handleImportSharedLife}
        onCopyLatestShareUrl={app.handleCopyLatestShareUrl}
        onLogout={app.handleLogout}
        onOpenFormations={app.handleOpenFormations}
        formatDateTime={formatDateTime}
      />

      {app.view === 'home' && <StartingPoint onSelect={app.handleStartExplore} />}

      {app.view === 'explore' && app.activeSession?.startingNodeId && (
        <div className="relative">
          <ExploreTimeline
            key={app.activeSession.id}
            startingNodeId={app.activeSession.startingNodeId}
            initialPath={app.activeSession.path}
            onPathChange={app.handlePathChange}
            onShowFormationDetails={app.handleOpenFormations}
          />
          <button
            onClick={app.handleBackToHome}
            className="fixed top-6 left-6 z-50 px-4 py-2 bg-gray-700/80 hover:bg-gray-600 rounded-lg text-white text-sm font-semibold transition"
          >
            Retour a l accueil
          </button>
        </div>
      )}

      {app.view === 'formations' && (
        <FormationExplorer
          onClose={app.handleCloseFormations}
          selectedNodeId={app.selectedFormationNodeId}
        />
      )}

      <ImportPreviewModal
        preview={app.importPreview}
        onCancel={app.handleCancelImport}
        onConfirm={app.handleConfirmImport}
        formatDateTime={formatDateTime}
      />
    </div>
  );
};

export default App;
