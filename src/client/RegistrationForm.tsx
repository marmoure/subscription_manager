import { useForm } from 'react-hook-form';
import { useState } from 'react';

type FormData = {
  name: string;
  phoneNumber: string;
  shopName: string;
  address: string;
  numberOfCashiers: number;
};

export function RegistrationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register');
      }

      const result = await response.json();
      setLicenseKey(result.licenseKey);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setLicenseKey(null);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Registration</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Name</label>
          <input {...register('name', { required: 'Name is required' })} style={{ width: '100%', padding: '0.5rem' }} />
          {errors.name && <p style={{ color: 'red' }}>{errors.name.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Phone Number</label>
          <input {...register('phoneNumber', { required: 'Phone Number is required' })} style={{ width: '100%', padding: '0.5rem' }} />
          {errors.phoneNumber && <p style={{ color: 'red' }}>{errors.phoneNumber.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Shop Name</label>
          <input {...register('shopName', { required: 'Shop Name is required' })} style={{ width: '100%', padding: '0.5rem' }} />
          {errors.shopName && <p style={{ color: 'red' }}>{errors.shopName.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Address</label>
          <input {...register('address', { required: 'Address is required' })} style={{ width: '100%', padding: '0.5rem' }} />
          {errors.address && <p style={{ color: 'red' }}>{errors.address.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Number of Cashiers</label>
          <input type="number" {...register('numberOfCashiers', { required: 'Number of Cashiers is required', valueAsNumber: true })} style={{ width: '100%', padding: '0.5rem' }} />
          {errors.numberOfCashiers && <p style={{ color: 'red' }}>{errors.numberOfCashiers.message}</p>}
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Register</button>
      </form>
      {licenseKey && (
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid green', borderRadius: '8px' }}>
          <h3>Registration Successful!</h3>
          <p>Your License Key is:</p>
          <pre>{licenseKey}</pre>
        </div>
      )}
      {error && (
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid red', borderRadius: '8px' }}>
          <h3>Registration Failed</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
