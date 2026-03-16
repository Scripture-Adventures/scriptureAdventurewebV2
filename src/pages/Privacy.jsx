import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="container animate-fade-in delay-100" style={{ paddingBottom: '30px' }}>
      <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '20px', gap: '15px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '22px', margin: 0 }}>Privacy Policy</h2>
      </div>

      <div className="glass-card" style={{ padding: '20px', lineHeight: '1.6', fontSize: '15px' }}>
        <h3>1. Information We Collect</h3>
        <p>
          We collect personal information such as name and email, your meditation entries, and usage data to improve our services.
        </p>

        <h3>2. How We Use Your Information</h3>
        <p>
          To provide and improve the App, communicate with you, analyze user experience, and maintain a safe environment.
        </p>

        <h3>3. Sharing Your Information</h3>
        <p>
          We will not sell, rent, or share your personal information with third parties except with your consent, for legal reasons, or with explicit service providers.
        </p>

        <h3>4. Data Security</h3>
        <p>
          We implement reasonable security measures to protect your information, though no system is impenetrable.
        </p>

        <h3>5. Your Choices</h3>
        <p>
          You may access/update your data and opt-out of promotional communications at any time.
        </p>

        <h3>6. Children's Privacy</h3>
        <p>
          Our App is not intended for use by children under the age of 13.
        </p>

        <h3>7. Changes to This Privacy Policy</h3>
        <p>
          We may update this policy periodically. Any changes will be posted here.
        </p>

        <h3>8. Contact Us</h3>
        <p>
          If you have any questions, please contact us via the Support section.
        </p>
      </div>
    </div>
  );
}
