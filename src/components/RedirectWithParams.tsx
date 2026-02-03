import { Navigate, useParams } from "react-router-dom";

interface RedirectWithParamsProps {
  to: string;
}

/**
 * Redirect component that preserves URL params.
 * Usage: <Route path="/areas/:slug" element={<RedirectWithParams to="/area" />} />
 * Will redirect /areas/downtown-dubai to /area/downtown-dubai
 */
export const RedirectWithParams = ({ to }: RedirectWithParamsProps) => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`${to}/${slug}`} replace />;
};

export default RedirectWithParams;
