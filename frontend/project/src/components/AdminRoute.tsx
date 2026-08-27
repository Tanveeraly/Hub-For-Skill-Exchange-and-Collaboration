import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

interface Props {
  children: ReactNode;
}

const AdminRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (user?.role !== 'ADMIN') return <Navigate to="/home" replace />;

  return <>{children}</>;
};

export default AdminRoute;
