import React from 'react';
import { Save, User as UserIcon, Building2, Lock, Shield, Palette, Check, Upload, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SettingsCard: React.FC<{ title: string; description: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, description, icon, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-soft border border-slate-200 dark:border-slate-800 overflow-hidden">
    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start gap-4">
      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="p-6 md:p-8 space-y-6">
      {children}
    </div>
  </div>
);

const InputGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder-slate-400 text-sm disabled:bg-slate-100 disabled:text-slate-500"
  />
);

export const Settings: React.FC = () => {
  const { themeSettings, updateThemeSettings, isDarkMode, toggleTheme, uploadLogo } = useTheme();
  const [logoUploadError, setLogoUploadError] = React.useState<string | null>(null);
  const [logoUploadSuccess, setLogoUploadSuccess] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const colors = [
    '#4A90B8', // Default Medical Blue
    '#5FA9C9', // Lighter Blue
    '#3B82F6', // Standard Blue
    '#0EA5E9', // Sky
    '#10B981', // Emerald
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
  ];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.warn('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Veuillez sélectionner une image (PNG, JPG, SVG, etc.)';
      setLogoUploadError(errorMsg);
      console.warn(errorMsg);
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      const errorMsg = 'Le fichier ne doit pas dépasser 2MB';
      setLogoUploadError(errorMsg);
      console.warn(errorMsg);
      return;
    }

    try {
      setLogoUploadError(null);
      console.log('Starting logo upload...');
      await uploadLogo(file);
      console.log('Logo uploaded successfully');
      setLogoUploadSuccess(true);
      setTimeout(() => setLogoUploadSuccess(false), 3000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur lors du chargement du logo';
      setLogoUploadError(errorMsg);
      console.error('Logo upload error:', errorMsg, error);
    }
  };

  const removeLogo = () => {
    updateThemeSettings({ logoUrl: undefined });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const changeEvent = {
        target: { files: e.dataTransfer.files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      await handleLogoUpload(changeEvent);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Paramètres</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les informations de l'agence, le thème visuel et les accès.</p>
      </header>

      {/* THEME CUSTOMIZATION - NEW SECTION */}
      <SettingsCard
        title="Personnalisation du Thème"
        description="Adaptez l'apparence de l'application à votre identité visuelle."
        icon={<Palette size={24} />}
      >
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Color Picker */}
            <div className="space-y-3">
               <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Couleur Principale</label>
               <div className="flex flex-wrap gap-3">
                  {colors.map(color => (
                     <button
                        key={color}
                        onClick={() => updateThemeSettings({ primaryColor: color })}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${
                           themeSettings.primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                     >
                        {themeSettings.primaryColor === color && <Check size={16} className="text-white" />}
                     </button>
                  ))}
                  <div className="relative">
                     <input 
                        type="color" 
                        value={themeSettings.primaryColor}
                        onChange={(e) => updateThemeSettings({ primaryColor: e.target.value })}
                        className="w-10 h-10 opacity-0 cursor-pointer absolute inset-0 z-10"
                     />
                     <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center bg-white text-slate-400">
                        <Palette size={16} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Typography & Mode */}
            <div className="space-y-6">
               <InputGroup label="Typographie">
                  <select 
                     value={themeSettings.fontFamily}
                     onChange={(e) => updateThemeSettings({ fontFamily: e.target.value })}
                     className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-sm"
                  >
                     <option value="Source Sans Pro">Source Sans Pro (Recommandé)</option>
                     <option value="Inter">Inter (Moderne)</option>
                     <option value="Arial">Arial (Classique)</option>
                  </select>
               </InputGroup>

               <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Mode Sombre</span>
                  <button 
                     onClick={toggleTheme}
                     className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-primary-600' : 'bg-slate-300'}`}
                  >
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : ''}`}></div>
                  </button>
               </div>
            </div>
         </div>
      </SettingsCard>

      {/* LOGO UPLOAD */}
      <SettingsCard
        title="Logo de l'Agence"
        description="Téléchargez le logo de votre agence qui s'affichera dans la barre latérale. Format recommandé: carré, PNG/JPG, max 2MB."
        icon={<Upload size={24} />}
      >
        <div className="space-y-6">
          {/* Logo Preview */}
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {themeSettings.logoUrl ? (
                  <img src={themeSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-slate-400 text-xs font-medium">Pas de logo</div>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Sélectionner un logo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm flex items-center gap-2"
                  >
                    <Upload size={16} /> Choisir un fichier
                  </button>
                  {themeSettings.logoUrl && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="px-4 py-2.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors font-medium flex items-center gap-2"
                    >
                      <X size={16} /> Supprimer
                    </button>
                  )}
                </div>
              </div>

              {/* Success Message */}
              {logoUploadSuccess && (
                <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">✓ Logo mis à jour avec succès!</p>
                </div>
              )}

              {/* Error Message */}
              {logoUploadError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{logoUploadError}</p>
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Note: Le logo s'affichera uniquement dans la barre latérale. Les tickets conserveront le nom de l'agence défini ci-dessous.
              </p>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Agency Information */}
      <SettingsCard 
        title="Informations Agence" 
        description="Ces informations apparaissent sur les tickets et factures."
        icon={<Building2 size={24} />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Nom de l'agence">
            <StyledInput defaultValue="EEM Transport - Agence Centrale" />
          </InputGroup>
          <InputGroup label="Responsable">
            <StyledInput defaultValue="Admin Principal" />
          </InputGroup>
          <InputGroup label="Adresse">
            <StyledInput defaultValue="123 Avenue de la République" />
          </InputGroup>
          <InputGroup label="Ville">
            <StyledInput defaultValue="Paris" />
          </InputGroup>
          <InputGroup label="Téléphone Contact">
            <StyledInput defaultValue="+33 1 23 45 67 89" />
          </InputGroup>
          <InputGroup label="Email Contact">
            <StyledInput defaultValue="contact@eem-transport.com" />
          </InputGroup>
        </div>
        <div className="flex justify-end pt-4">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm">
            <Save size={18} /> Enregistrer les modifications
          </button>
        </div>
      </SettingsCard>

      {/* Security */}
      <SettingsCard 
        title="Sécurité & Connexion" 
        description="Gérez votre mot de passe et l'accès administrateur."
        icon={<Lock size={24} />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Email Administrateur">
            <div className="relative">
              <StyledInput defaultValue="admin@eem.com" disabled />
              <Lock size={14} className="absolute right-3 top-3 text-slate-400" />
            </div>
          </InputGroup>
          <div className="col-span-1 md:col-span-2 border-t border-slate-100 dark:border-slate-800 my-2"></div>
          <InputGroup label="Nouveau mot de passe">
            <StyledInput type="password" placeholder="••••••••" />
          </InputGroup>
          <InputGroup label="Confirmer mot de passe">
            <StyledInput type="password" placeholder="••••••••" />
          </InputGroup>
        </div>
        <div className="flex justify-end pt-4">
          <button className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium">
            Mettre à jour le mot de passe
          </button>
        </div>
      </SettingsCard>

      {/* User Management (Table Mockup) */}
      <SettingsCard 
        title="Utilisateurs & Accès" 
        description="Liste des comptes autorisés à accéder à l'application."
        icon={<Shield size={24} />}
      >
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Agence</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold text-xs mr-3">A</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Admin Principal</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">Administrateur</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">Siège</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Actif</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-400">--</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-bold text-xs mr-3">G</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Gérant Paris</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">Gérant</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">Paris Centre</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Actif</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-800 dark:hover:text-primary-400">Éditer</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="pt-2">
          <button className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-primary-600 hover:border-primary-300 dark:hover:text-primary-400 transition-colors text-sm font-medium flex items-center justify-center gap-2">
             + Ajouter un nouvel utilisateur
          </button>
        </div>
      </SettingsCard>
    </div>
  );
};