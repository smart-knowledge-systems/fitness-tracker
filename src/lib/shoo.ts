"use client";

import type { ShooAuthClient, StartSignInOptions } from "@shoojs/react";
import { createShooAuth } from "@shoojs/react";
import { useCallback, useEffect, useRef, useState } from "react";

// Lazy singleton — only created in the browser (inside useEffect / event handlers).
// This avoids the `deriveRedirectUri must be called in a browser environment` error
// that occurs when createShooAuth runs at module scope during Next.js SSR.
let _client: ShooAuthClient | null = null;

function getClient(): ShooAuthClient {
  if (!_client) {
    _client = createShooAuth({ callbackPath: "/", requestPii: true });
  }
  return _client;
}

export function useShooAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const client = getClient();
    client.handleCallback().finally(() => {
      setIsAuthenticated(client.getIdentity().userId !== null);
      setIsLoading(false);
    });
  }, []);

  const fetchAccessToken = useCallback(
    async () => getClient().getIdentity().token ?? null,
    [],
  );

  return { isLoading, isAuthenticated, fetchAccessToken };
}

export async function signIn(opts?: StartSignInOptions) {
  await getClient().startSignIn(opts);
}

export function signOut() {
  getClient().clearIdentity();
  window.location.reload();
}
