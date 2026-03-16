import React from 'react';

export default function BibleSearch() {
  const bibleGatewayHtml = `
    <form action="https://www.biblegateway.com/quicksearch/" target="_blank" style="display:flex; flex-direction:column; align-items:center; width:100%;">
      <div style="background-color: var(--primary); color: white; padding: 10px; width: 100%; text-align: center; border-radius: 8px 8px 0 0; font-family: var(--font-heading); font-weight: bold;">
        Lookup a word or passage in the Bible
      </div>
      <div style="background-color: var(--surface); padding: 20px; width: 100%; display: flex; flex-direction: column; align-items: center; border: 1px solid var(--surface-elevated); border-radius: 0 0 8px 8px; box-shadow: var(--shadow-sm);">
        <input 
          type="text" 
          name="quicksearch" 
          placeholder="e.g. John 3:16" 
          style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 15px; font-size: 16px;" 
        />
        <button 
          type="submit" 
          style="background-color: var(--primary); color: white; padding: 12px 20px; border: none; border-radius: 8px; font-weight: bold; font-size: 16px; cursor: pointer; width: 100%;"
        >
          Search BibleGateway
        </button>
        <div style="margin-top: 20px; text-align: center;">
          <a href="https://www.biblegateway.com/" target="_blank" style="text-decoration: none;">
            <img src="https://www.biblegateway.com/assets/images/logos/bglogo_sm.gif" alt="BibleGateway.com" style="max-width: 150px; opacity: 0.8;" />
          </a>
        </div>
      </div>
    </form>
  `;

  return (
    <div className="container animate-fade-in delay-100" style={{ paddingBottom: '20px' }}>
      <div className="flex-center" style={{ marginBottom: '20px', backgroundColor: 'var(--primary)', color: 'white', padding: '15px', borderRadius: 'var(--radius-md)' }}>
        <h2 style={{ fontSize: '20px', margin: 0 }}>Bible Search</h2>
      </div>

      <div 
        className="glass-card" 
        style={{ padding: '0', overflow: 'hidden', border: 'none' }}
        dangerouslySetInnerHTML={{ __html: bibleGatewayHtml }}
      />
    </div>
  );
}
