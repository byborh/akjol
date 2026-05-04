import type { SharedLifePreview } from '../services/lifeSharingService';

type ImportPreviewModalProps = {
  preview: SharedLifePreview | null;
  onCancel: () => void;
  onConfirm: () => void;
  formatDateTime: (timestamp: number) => string;
};

const ImportPreviewModal = ({
  preview,
  onCancel,
  onConfirm,
  formatDateTime
}: ImportPreviewModalProps) => {
  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-xl border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#27272A] p-5 shadow-2xl transition-colors">
        <h2 className="text-lg font-bold text-gray-900 dark:text-[#F3F4F6]">Confirmer l import de la vie</h2>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Verifiez les informations avant d ajouter cette simulation.
        </p>

        <div className="mt-4 space-y-2 rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-[#E2E8F0]/70 dark:bg-[#121212]/70 p-3 text-sm">
          <p className="text-gray-900 dark:text-[#F3F4F6]">
            <span className="text-gray-600 dark:text-gray-400">Nom: </span>
            {preview.name}
          </p>
          <p className="text-gray-900 dark:text-[#F3F4F6]">
            <span className="text-gray-600 dark:text-gray-400">Etapes: </span>
            {preview.stepsCount}
          </p>
          <p className="text-gray-900 dark:text-[#F3F4F6]">
            <span className="text-gray-600 dark:text-gray-400">Partage le: </span>
            {formatDateTime(preview.exportedAt)}
          </p>
          <p className="text-gray-900 dark:text-[#F3F4F6]">
            <span className="text-gray-600 dark:text-gray-400">Expiration: </span>
            {formatDateTime(preview.expiresAt)}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-[#E2E8F0] dark:bg-[#121212] px-3 py-1.5 text-sm text-gray-900 dark:text-[#F3F4F6] hover:bg-[#CBD5E1] dark:hover:bg-[#27272A] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg border border-[#8B5CF6] bg-[#8B5CF6]/20 px-3 py-1.5 text-sm text-[#8B5CF6] hover:bg-[#8B5CF6]/30 transition-colors"
          >
            Confirmer l import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPreviewModal;
