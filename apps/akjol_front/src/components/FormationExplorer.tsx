import { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Node, School } from '../types';

type ViewMode = 'formations' | 'schools';
type FilterType = 'all' | 'BAC' | 'ETUDE_SUP' | 'METIER';

const normalizeSearchValue = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export interface FormationExplorerProps {
  onClose: () => void;
  selectedNodeId?: number | null;
}

export const FormationExplorer: React.FC<FormationExplorerProps> = ({ onClose, selectedNodeId }) => {
  const { nodes, schools, getSchoolsByNodeId, getNodeById, loadAllDataForSearch } = useData();
  
  const [viewMode, setViewMode] = useState<ViewMode>('formations');
  const [selectedFormation, setSelectedFormation] = useState<Node | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState(''); // Recherche active (après clic bouton)
  const [advancedSearch, setAdvancedSearch] = useState(false); // Toggle recherche approfondie
  const [displayLimit, setDisplayLimit] = useState(50); // Limite d'affichage pour performances
  
  // States pour les écoles
  const [searchTermSchool, setSearchTermSchool] = useState('');
  const [activeSearchTermSchool, setActiveSearchTermSchool] = useState(''); // Recherche active écoles
  const [filterCity, setFilterCity] = useState<string>('all');

  // Fonctions de recherche
  const handleSearchFormations = () => {
    if (searchTerm.trim()) {
      console.log(`🔍 Recherche formations: "${searchTerm}"`);
      loadAllDataForSearch();
      setActiveSearchTerm(searchTerm);
    }
  };

  const handleSearchSchools = () => {
    if (searchTermSchool.trim()) {
      console.log(`🔍 Recherche établissements: "${searchTermSchool}"`);
      loadAllDataForSearch();
      setActiveSearchTermSchool(searchTermSchool);
    }
  };

  const handleClearSearchFormations = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
  };

  const handleClearSearchSchools = () => {
    setSearchTermSchool('');
    setActiveSearchTermSchool('');
  };

  // Pré-sélectionner la formation si elle provient de la simulation
  useEffect(() => {
    if (selectedNodeId) {
      const node = getNodeById(selectedNodeId);
      if (node) {
        setSelectedFormation(node);
        setViewMode('formations');
      }
    }
  }, [selectedNodeId, getNodeById]);

  // Liste des villes uniques pour le filtre
  const uniqueCities = useMemo(() => {
    const cities = schools.map(school => school.city);
    return ['all', ...Array.from(new Set(cities)).sort()];
  }, [schools]);

  // Filtered & Searched Formations (OPTIMISÉ: recherche par titre par défaut)
  const filteredFormations = useMemo(() => {
    const normalizedSearchTerm = normalizeSearchValue(activeSearchTerm.trim());

    return nodes.filter((node) => {
      const typeMatch = filterType === 'all' || node.type === filterType;
      if (!normalizedSearchTerm) {
        return typeMatch;
      }

      // RECHERCHE SIMPLE (par défaut): uniquement le titre
      if (!advancedSearch) {
        const titleMatch = normalizeSearchValue(node.title).includes(normalizedSearchTerm);
        return typeMatch && titleMatch;
      }

      // RECHERCHE APPROFONDIE: tous les champs
      const searchableText = [
        node.title,
        node.description,
        node.slug,
        String(node.metadata?.type_official || ''),
        String(node.metadata?.level || ''),
        Array.isArray(node.metadata?.domains) ? node.metadata.domains.join(' ') : ''
      ]
        .join(' ')
        .trim();

      const searchMatch = normalizeSearchValue(searchableText).includes(normalizedSearchTerm);
      return typeMatch && searchMatch;
    });
  }, [filterType, activeSearchTerm, nodes, advancedSearch]);

  // Filtered & Searched Schools (recherche simple: nom + ville)
  const filteredSchools = useMemo(() => {
    const normalizedSchoolSearchTerm = normalizeSearchValue(activeSearchTermSchool.trim());

    return schools.filter((school) => {
      const cityMatch = filterCity === 'all' || school.city === filterCity;

      if (!normalizedSchoolSearchTerm) {
        return cityMatch;
      }

      // Recherche simple: nom de l'école uniquement
      const nameMatch = normalizeSearchValue(school.name).includes(normalizedSchoolSearchTerm);
      return cityMatch && nameMatch;
    });
  }, [filterCity, activeSearchTermSchool, schools]);

  // Schools for selected formation
  const schoolsForFormation = useMemo(() => {
    if (!selectedFormation) return [];
    return getSchoolsByNodeId(selectedFormation.id);
  }, [selectedFormation, getSchoolsByNodeId]);

  // Formations for selected school
  const formationsForSchool = useMemo(() => {
    if (!selectedSchool) return [];
    return nodes.filter((node) => node.id === selectedSchool.node_id);
  }, [selectedSchool, nodes]);

  // OPTIMISATION: Limiter l'affichage pour performances
  const displayedFormations = useMemo(() => {
    return filteredFormations.slice(0, displayLimit);
  }, [filteredFormations, displayLimit]);

  const displayedSchools = useMemo(() => {
    return filteredSchools.slice(0, displayLimit);
  }, [filteredSchools, displayLimit]);

  // Réinitialiser la limite d'affichage quand la recherche change
  useEffect(() => {
    setDisplayLimit(50);
  }, [activeSearchTerm, filterType]);

  useEffect(() => {
    setDisplayLimit(50);
  }, [activeSearchTermSchool, filterCity]);

  // Count formations per school
  const formationsCountBySchool = useMemo(() => {
    const counts: Record<number, number> = {};
    schools.forEach((school) => {
      const formationCount = nodes.filter((node) => node.id === school.node_id).length;
      counts[school.id] = formationCount;
    });
    return counts;
  }, [schools, nodes]);

  // Handler pour naviguer vers une école depuis une formation
  const handleGoToSchool = (school: School) => {
    setViewMode('schools');
    setSelectedSchool(school);
    setSelectedFormation(null);
  };

  // Handler pour naviguer vers une formation depuis une école
  const handleGoToFormation = (formation: Node) => {
    setViewMode('formations');
    setSelectedFormation(formation);
    setSelectedSchool(null);
  };

  const getFormationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BAC: '🎓 Baccalauréat',
      ETUDE_SUP: '📚 Études Supérieures',
      METIER: '💼 Métier'
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#F8F9FA] dark:bg-[#121212] rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[#E2E8F0] dark:border-[#27272A] shadow-xl transition-colors duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F3F4F6]">Formations & Établissements</h2>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Explorez les formations et leurs établissements</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-[#E2E8F0] dark:bg-[#27272A] px-8 py-4 flex gap-4 border-b border-[#E2E8F0] dark:border-[#27272A] transition-colors">
          <button
            onClick={() => {
              setViewMode('formations');
              setSelectedSchool(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'formations'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-white dark:bg-[#27272A] text-gray-700 dark:text-gray-200 hover:bg-[#E2E8F0] dark:hover:bg-[#3F3F46]'
            }`}
          >
            📚 Formations & Écoles
          </button>
          <button
            onClick={() => {
              setViewMode('schools');
              setSelectedFormation(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'schools'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-white dark:bg-[#27272A] text-gray-700 dark:text-gray-200 hover:bg-[#E2E8F0] dark:hover:bg-[#3F3F46]'
            }`}
          >
            🏢 Établissements & Formations
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-96 bg-[#E2E8F0] dark:bg-[#27272A] border-r border-[#E2E8F0] dark:border-[#27272A] overflow-y-auto flex flex-col transition-colors">
            {viewMode === 'formations' ? (
              <>
                {/* Filter Section */}
                <div className="p-4 border-b border-[#E2E8F0] dark:border-[#27272A]">
                  <div className="mb-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                      Type de formation
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as FilterType)}
                      className="w-full bg-white dark:bg-[#27272A] text-gray-900 dark:text-[#F3F4F6] rounded-lg px-3 py-2 border border-[#E2E8F0] dark:border-[#27272A] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                    >
                      <option value="all">Tous les types</option>
                      <option value="BAC">🎓 Baccalauréat</option>
                      <option value="ETUDE_SUP">📚 Études Supérieures</option>
                      <option value="METIER">💼 Métier</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                      Rechercher
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchTerm.trim()) {
                            handleSearchFormations();
                          }
                        }}
                        placeholder={advancedSearch ? "Recherche approfondie..." : "Nom de formation..."}
                        className="flex-1 bg-white dark:bg-[#27272A] text-gray-900 dark:text-[#F3F4F6] rounded-lg px-3 py-2 border border-[#E2E8F0] dark:border-[#27272A] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                      <button
                        onClick={handleSearchFormations}
                        disabled={!searchTerm.trim()}
                        className="px-3 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#8B5CF6] text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        🔍
                      </button>
                      {activeSearchTerm && (
                        <button
                          onClick={handleClearSearchFormations}
                          className="px-3 py-2 bg-[#E2E8F0] dark:bg-[#3F3F46] hover:bg-[#CBD5E1] dark:hover:bg-[#52525B] text-gray-900 dark:text-[#F3F4F6] font-semibold rounded-lg transition-all duration-200 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    {/* Toggle recherche approfondie */}
                    <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={advancedSearch}
                        onChange={(e) => setAdvancedSearch(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#8B5CF6] focus:ring-[#8B5CF6]"
                      />
                      <span>Recherche approfondie (description, domaines...)</span>
                    </label>
                    
                    {/* Compteur de résultats */}
                    {activeSearchTerm && (
                      <div className="mt-2 text-xs text-[#8B5CF6] font-medium">
                        {filteredFormations.length} résultat{filteredFormations.length > 1 ? 's' : ''} pour "{activeSearchTerm}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Formations List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {displayedFormations.map((formation) => (
                    <button
                      key={formation.id}
                      onClick={() => setSelectedFormation(formation)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedFormation?.id === formation.id
                          ? `${formation.color} bg-gradient-to-r text-white font-semibold`
                          : 'bg-white dark:bg-[#27272A] text-gray-700 dark:text-gray-200 hover:bg-[#E2E8F0] dark:hover:bg-[#3F3F46]'
                      }`}
                    >
                      <div className="font-medium text-sm">{formation.icon} {formation.title}</div>
                      <div className="text-xs mt-1 opacity-75">
                        {getFormationTypeLabel(formation.type)}
                      </div>
                    </button>
                  ))}
                  
                  {/* Bouton "Voir plus" */}
                  {displayLimit < filteredFormations.length && (
                    <button
                      onClick={() => setDisplayLimit(prev => prev + 50)}
                      className="w-full p-3 rounded-lg bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] font-medium text-sm transition-colors"
                    >
                      Voir plus ({filteredFormations.length - displayLimit} formations restantes)
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Filter Section pour Schools */}
                <div className="p-4 border-b border-[#E2E8F0] dark:border-[#27272A]">
                  <div className="mb-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                      Ville
                    </label>
                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="w-full bg-white dark:bg-[#27272A] text-gray-900 dark:text-[#F3F4F6] rounded-lg px-3 py-2 border border-[#E2E8F0] dark:border-[#27272A] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                    >
                      <option value="all">Toutes les villes</option>
                      {uniqueCities.filter(city => city !== 'all').map((city) => (
                        <option key={city} value={city}>
                          📍 {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                      Rechercher
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchTermSchool}
                        onChange={(e) => setSearchTermSchool(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchTermSchool.trim()) {
                            handleSearchSchools();
                          }
                        }}
                        placeholder="Nom de l'établissement..."
                        className="flex-1 bg-white dark:bg-[#27272A] text-gray-900 dark:text-[#F3F4F6] rounded-lg px-3 py-2 border border-[#E2E8F0] dark:border-[#27272A] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                      <button
                        onClick={handleSearchSchools}
                        disabled={!searchTermSchool.trim()}
                        className="px-3 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#8B5CF6] text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        🔍
                      </button>
                      {activeSearchTermSchool && (
                        <button
                          onClick={handleClearSearchSchools}
                          className="px-3 py-2 bg-[#E2E8F0] dark:bg-[#3F3F46] hover:bg-[#CBD5E1] dark:hover:bg-[#52525B] text-gray-900 dark:text-[#F3F4F6] font-semibold rounded-lg transition-all duration-200 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {activeSearchTermSchool && (
                      <div className="mt-2 text-xs text-[#8B5CF6] font-medium">
                        {filteredSchools.length} résultat{filteredSchools.length > 1 ? 's' : ''} pour "{activeSearchTermSchool}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Schools List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredSchools.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">Aucun établissement trouvé</p>
                      <p className="text-xs mt-1">Essayez une autre recherche</p>
                    </div>
                  ) : (
                    <>
                      {displayedSchools.map((school) => (
                        <button
                          key={school.id}
                          onClick={() => setSelectedSchool(school)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedSchool?.id === school.id
                              ? 'bg-[#8B5CF6] text-white font-semibold'
                              : 'bg-white dark:bg-[#27272A] text-gray-700 dark:text-gray-200 hover:bg-[#E2E8F0] dark:hover:bg-[#3F3F46]'
                          }`}
                        >
                          <div className="font-medium text-sm">🏢 {school.name}</div>
                          <div className="text-xs mt-1 opacity-75">{school.city}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs text-yellow-400">★ {school.rating}/5</div>
                            <div className="text-xs opacity-60">
                              • {formationsCountBySchool[school.id] || 0} formation(s)
                            </div>
                          </div>
                        </button>
                      ))}
                      
                      {/* Bouton "Voir plus" */}
                      {displayLimit < filteredSchools.length && (
                        <button
                          onClick={() => setDisplayLimit(prev => prev + 50)}
                          className="w-full p-3 rounded-lg bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] font-medium text-sm transition-colors"
                        >
                          Voir plus ({filteredSchools.length - displayLimit} établissements restants)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Detail Panel */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA] dark:bg-[#121212] transition-colors">
            {viewMode === 'formations' ? (
              selectedFormation ? (
                <div className="space-y-6">
                  {/* Formation Header avec gradient violet (accent 10%) */}
                  <div
                    className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-lg p-6 text-white"
                  >
                    <div className="text-5xl mb-3">{selectedFormation.icon}</div>
                    <h3 className="text-3xl font-bold mb-2">{selectedFormation.title}</h3>
                    <p className="text-white/95">{selectedFormation.description}</p>
                  </div>

                  {/* Metadata */}
                  {Object.keys(selectedFormation.metadata || {}).length > 0 && (
                    <div className="bg-[#E2E8F0] dark:bg-[#27272A] rounded-lg p-4 transition-colors">
                      <h4 className="font-bold text-gray-900 dark:text-[#F3F4F6] mb-3">Informations</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedFormation.metadata || {}).map(([key, value]) => (
                          <div key={key} className="bg-white dark:bg-[#27272A] rounded p-3 border border-[#E2E8F0] dark:border-[#27272A]">
                            <div className="text-xs text-gray-700 dark:text-gray-300 uppercase font-semibold">{key}</div>
                            <div className="text-gray-900 dark:text-[#F3F4F6] mt-1">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {selectedFormation.requirements && 
                    Object.keys(selectedFormation.requirements).length > 0 && (
                    <div className="bg-[#E2E8F0] dark:bg-[#27272A] rounded-lg p-4 transition-colors">
                      <h4 className="font-bold text-gray-900 dark:text-[#F3F4F6] mb-3">Prérequis</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedFormation.requirements || {}).map(([key, value]) => (
                          <div key={key} className="bg-white dark:bg-[#27272A] rounded p-3 border border-[#E2E8F0] dark:border-[#27272A]">
                            <div className="text-xs text-gray-700 dark:text-gray-300 uppercase font-semibold">{key}</div>
                            <div className="text-gray-900 dark:text-[#F3F4F6] mt-1">{String(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schools for this Formation */}
                  <div className="bg-[#E2E8F0] dark:bg-[#27272A] rounded-lg p-4 transition-colors">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      🏢 Établissements offrant cette formation ({schoolsForFormation.length})
                    </h4>
                    {schoolsForFormation.length > 0 ? (
                      <div className="space-y-2">
                        {schoolsForFormation.map((school) => (
                          <button
                            key={school.id}
                            onClick={() => handleGoToSchool(school)}
                            className="w-full text-left bg-white dark:bg-[#27272A] hover:bg-[#E2E8F0] dark:hover:bg-[#3F3F46] rounded p-3 flex justify-between items-start transition-colors cursor-pointer group border border-[#E2E8F0] dark:border-[#27272A]"
                          >
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-[#F3F4F6] group-hover:text-[#8B5CF6]">
                                {school.name} →
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-300">{school.city}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-yellow-400">★ {school.rating}</div>
                              <div className="text-xs text-gray-400">/5</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-600 dark:text-gray-400 text-sm italic">
                        Aucun établissement trouvé
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 dark:text-gray-400">
                  <div className="text-center">
                    <p className="text-lg">📚</p>
                    <p>Sélectionnez une formation pour voir les détails</p>
                  </div>
                </div>
              )
            ) : selectedSchool ? (
              <div className="space-y-6">
                {/* School Header */}
                <div className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-lg p-6 text-white">
                  <div className="text-5xl mb-3">🏢</div>
                  <h3 className="text-3xl font-bold mb-2">{selectedSchool.name}</h3>
                  <p className="text-white/95">{selectedSchool.city}</p>
                  <div className="mt-3 inline-flex items-center gap-1">
                    <span className="text-2xl font-bold">⭐ {selectedSchool.rating}</span>
                    <span className="text-sm text-white/80">/5</span>
                  </div>
                </div>

                {/* Formations Offered */}
                <div className="bg-[#E2E8F0] dark:bg-[#27272A] rounded-lg p-4 transition-colors">
                  <h4 className="font-bold text-gray-900 dark:text-[#F3F4F6] mb-4 flex items-center gap-2">
                    📚 Formation proposée
                  </h4>
                  {formationsForSchool.length > 0 ? (
                    <div className="space-y-3">
                      {formationsForSchool.map((formation) => (
                        <button
                          key={formation.id}
                          onClick={() => handleGoToFormation(formation)}
                          className="w-full text-left bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-lg p-4 text-white hover:opacity-90 transition-opacity cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{formation.icon}</div>
                            <div className="flex-1">
                              <div className="font-bold text-lg group-hover:underline">
                                {formation.title} →
                              </div>
                              <div className="text-sm text-white/90 mt-1">
                                {formation.description}
                              </div>
                              <div className="text-xs text-white/70 mt-2">
                                {getFormationTypeLabel(formation.type)}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                      <div className="text-gray-600 dark:text-gray-400 text-sm italic">
                      Aucune formation trouvée
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 dark:text-gray-400">
                <div className="text-center">
                  <p className="text-lg">🏢</p>
                  <p>Sélectionnez un établissement pour voir les formations</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
