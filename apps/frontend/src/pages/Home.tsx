import React from 'react';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Terminal } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Home / License Application</h1>
      <p className="text-muted-foreground">Welcome to the Vibe Subscription Manager.</p>
      
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          Tailwind CSS and shadcn/ui have been successfully configured.
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button>Default Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="destructive">Destructive Button</Button>
        <Button variant="outline">Outline Button</Button>
      </div>
    </div>
  );
};

export default Home;
