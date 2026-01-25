import React from 'react';
import { LicenseRequestForm } from '../components/LicenseRequestForm';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto py-6 md:py-10 px-4 md:px-0">
      <div className="flex flex-col space-y-4 md:space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">License Application</h1>
          <p className="text-muted-foreground">
            Complete the form below to request a license for your machine.
          </p>
        </div>
        <LicenseRequestForm />
      </div>
    </div>
  );
};

export default Home;