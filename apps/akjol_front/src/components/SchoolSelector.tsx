import { AnimatePresence, motion } from 'framer-motion';
import { Search, Star, X } from 'lucide-react';
import type { Node, School } from '../types';
import { useSchoolSearch } from '../hooks/useSchoolSearch';

interface SchoolSelectorProps {
  isOpen: boolean;
  node: Node | null;
  schools: School[];
  onSelectSchool: (school: School) => void;
  onClose: () => void;
}

export default function SchoolSelector({
  isOpen,
  node,
  schools,
  onSelectSchool,
  onClose
}: SchoolSelectorProps) {
  const { searchTerm, setSearchTerm, filteredSchools } = useSchoolSearch(schools);

  return (
    <AnimatePresence>
      {isOpen && node && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-2xl rounded-2xl border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#27272A] shadow-2xl transition-colors"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#27272A] p-5">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-[#F3F4F6]">Choisissez un établissement</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    Étape sélectionnée : <span className="text-gray-900 dark:text-[#F3F4F6] font-medium">{node.title}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-[#E2E8F0] dark:border-[#27272A] p-2 text-gray-900 dark:text-[#F3F4F6] hover:bg-[#E2E8F0] dark:hover:bg-[#121212] transition-colors"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400" size={16} />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Rechercher par nom ou ville..."
                    className="w-full rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-[#F8F9FA] dark:bg-[#121212] pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-[#F3F4F6] placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-colors"
                  />
                </div>

                <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
                  {filteredSchools.length === 0 && (
                    <div className="rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-[#E2E8F0]/60 dark:bg-[#121212]/60 p-4 text-sm text-gray-700 dark:text-gray-300">
                      Aucun établissement trouvé pour cette recherche.
                    </div>
                  )}

                  {filteredSchools.map((school) => (
                    <motion.button
                      key={school.id}
                      onClick={() => onSelectSchool(school)}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#27272A] bg-[#E2E8F0] dark:bg-[#121212] px-4 py-3 text-left hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-[#F3F4F6]">{school.name}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{school.city}</p>
                        </div>
                        {typeof school.rating === 'number' && (
                          <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                            <Star size={14} fill="currentColor" />
                            {school.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
