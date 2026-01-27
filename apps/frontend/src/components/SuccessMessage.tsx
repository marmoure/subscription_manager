import { useState } from "react";
import { CheckCircle, Copy, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SuccessMessageProps {
  licenseKey: string;
}

export function SuccessMessage({ licenseKey }: SuccessMessageProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy license key:", err);
    }
  };

  return (
    <Alert
      className="border-green-500 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-800 dark:text-green-300 font-semibold mb-2">
        License Generated Successfully!
      </AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          Congratulations! Your license key has been generated.
        </p>

        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <code className="block w-full rounded bg-green-100 dark:bg-green-900 px-3 py-2 font-mono text-sm font-bold tracking-wider text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
              {licenseKey}
            </code>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            className="h-9 w-9 border-green-200 hover:bg-green-100 hover:text-green-900 dark:border-green-800 dark:hover:bg-green-900 dark:hover:text-green-100"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy license key</span>
          </Button>
        </div>

        <p className="text-sm text-green-700 dark:text-green-400">
          Please save this license key in a safe place.
        </p>
      </AlertDescription>
    </Alert>
  );
}
