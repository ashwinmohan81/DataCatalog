import { Navigate } from 'react-router-dom';

export function HomeRedirect({ homePath }: { homePath: string }) {
  return <Navigate to={homePath} replace />;
}
