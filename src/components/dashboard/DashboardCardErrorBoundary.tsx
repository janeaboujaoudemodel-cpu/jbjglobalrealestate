import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { logClientError } from '@/utils/clientErrorLogger';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
}

class DashboardCardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logClientError(`DashboardCard:${this.props.fallbackTitle ?? 'unnamed'}`, error, {
      componentStack: errorInfo.componentStack ?? undefined,
    });
    console.error('Dashboard card error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border border-border bg-card">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {this.props.fallbackTitle || 'Unable to load this section'}
            </p>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default DashboardCardErrorBoundary;
