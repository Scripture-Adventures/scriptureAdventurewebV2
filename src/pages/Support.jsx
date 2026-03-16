import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Support() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ subject: '', body: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.body) return;
    
    const mailto = `mailto:scriptureadventures.app@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(formData.body)}`;
    window.location.href = mailto;
    
    // Slight delay before going back just in case
    setTimeout(() => {
        navigate(-1);
    }, 500);
  };

  return (
    <div className="container animate-fade-in delay-100">
      <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '20px', gap: '15px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '22px', margin: 0 }}>Contact Support</h2>
      </div>

      <form onSubmit={handleSend} className="flex-col" style={{ gap: '20px' }}>
        <div>
           <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>SUBJECT</label>
           <input 
             type="text"
             name="subject"
             className="input-field" 
             placeholder="Your subject here..." 
             value={formData.subject}
             onChange={handleChange}
             required
           />
        </div>

        <div>
           <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>CONCERN</label>
           <textarea 
             name="body"
             className="input-field" 
             placeholder="Tell us about your concern..." 
             value={formData.body}
             onChange={handleChange}
             rows={8}
             required
           />
        </div>

        <button type="submit" className="btn btn-primary flex-center" style={{ width: '100%', padding: '15px', gap: '10px' }}>
           <Send size={20} /> Send 
        </button>
      </form>
    </div>
  );
}
