import { AlertCircle, X, Clock, ShieldAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface AppError {
  message: string;
  type?: 'validation' | 'rate_limit' | 'server' | 'captcha';
  details?: Record<string, string[] | string>;
  retryAfter?: number;
}

interface ErrorMessageProps {
  error: AppError | string | null;
  onDismiss?: () => void;
}

const SUPPORT_EMAIL = "support@vibe-kanban.com";

export function ErrorMessage({ error, onDismiss }: ErrorMessageProps) {
  if (!error) return null;

  const errorObj: AppError = typeof error === 'string'
    ? { message: error, type: 'server' }
    : error;

  const { message, type = 'server', details, retryAfter } = errorObj;

  const getIcon = () => {
    switch (type) {
      case 'rate_limit': return <Clock className="h-4 w-4" />;
      case 'captcha': return <ShieldAlert className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'validation': return "Validation Error";
      case 'rate_limit': return "Too Many Requests";
      case 'captcha': return "Security Check Failed";
      case 'server': return "Server Error";
      default: return "Error";
    }
  };

  return (
    <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 pr-12 relative border-red-500/50 text-red-600 dark:border-red-500/30 dark:text-red-400">
      {getIcon()}
      <AlertTitle className="font-semibold">{getTitle()}</AlertTitle>
      <AlertDescription className="mt-2 space-y-2 text-sm opacity-90">
        <p>{message}</p>

        {type === 'rate_limit' && retryAfter && (
          <p className="font-medium">
            Please try again in {retryAfter} seconds.
          </p>
        )}

        {type === 'validation' && details && (
          <ul className="list-disc pl-4 space-y-1 text-xs">
            {Object.entries(details).map(([field, msgs]) => (
              <li key={field}>
                <span className="font-semibold capitalize">{field.replace(/_/g, ' ')}:</span>{' '}
                {Array.isArray(msgs) ? msgs.join(', ') : msgs}
              </li>
            ))}
          </ul>
        )}

        {type === 'server' && (
          <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-900/50 text-xs">
            <p>
              If this persists, please contact support at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-red-900 dark:hover:text-red-200 font-medium">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        )}
      </AlertDescription>

      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 text-red-500 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-200"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      )}
    </Alert>
  );
}
