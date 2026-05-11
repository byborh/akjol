"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

/**
 * Wrapper TanStack Query côté client. Le QueryClient est créé dans un useState
 * pour ne PAS être partagé entre requêtes SSR (chaque page utilise sa propre
 * instance). Ça évite les fuites de cache entre utilisateurs en mode RSC/SSR.
 *
 * Defaults adaptés à AkJol :
 *  - staleTime 60s : on a peu d'écritures côté user, on évite les refetch dans
 *    la même session.
 *  - refetchOnWindowFocus false : pas de re-fetch chaque fois qu'on revient sur
 *    l'onglet — comportement par défaut bruyant en dev.
 *  - retry 1 : un échec → on tente une fois, puis on remonte l'erreur.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      ) : null}
    </QueryClientProvider>
  );
}
