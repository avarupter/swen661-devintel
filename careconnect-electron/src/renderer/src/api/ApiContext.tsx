import { createContext, useContext, type ReactNode } from 'react'
import type { CareConnectApi } from '../../../shared/api'

const ApiContext = createContext<CareConnectApi | null>(null)

/** Supplies the preload bridge (or a test double) to the component tree. */
export function ApiProvider({ api, children }: { api: CareConnectApi; children: ReactNode }): React.JSX.Element {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
}

export function useApi(): CareConnectApi {
  const api = useContext(ApiContext)
  if (!api) throw new Error('useApi() must be called inside <ApiProvider>')
  return api
}
