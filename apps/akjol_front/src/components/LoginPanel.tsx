import type React from 'react';

type LoginPanelProps = {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  testUsersHint: string;
};

const LoginPanel = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  testUsersHint
}: LoginPanelProps) => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121212] flex items-center justify-center px-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#27272A] rounded-2xl shadow-xl dark:shadow-gray-900/50 p-8 border border-[#E2E8F0] dark:border-[#27272A]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F3F4F6]">Connexion</h1>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Accedez a votre simulation AkJol</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">Comptes de test: {testUsersHint}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#27272A] px-4 py-2.5 text-gray-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
              placeholder="aaaa@gmail.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#27272A] px-4 py-2.5 text-gray-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#8B5CF6] text-white py-2.5 font-semibold hover:bg-[#7C3AED] active:bg-[#6D28D9] transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPanel;
