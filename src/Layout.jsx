import React from 'react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="font-heebo" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Rubik:wght@300;400;500;600;700;800;900&family=Assistant:wght@300;400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Heebo', sans-serif;
        }
        
        :root {
          --background: 24 10% 10%;
          --foreground: 0 0% 95%;
          --card: 24 10% 12%;
          --card-foreground: 0 0% 95%;
          --popover: 24 10% 12%;
          --popover-foreground: 0 0% 95%;
          --primary: 24 100% 50%;
          --primary-foreground: 24 10% 10%;
          --secondary: 24 10% 20%;
          --secondary-foreground: 0 0% 95%;
          --muted: 24 10% 20%;
          --muted-foreground: 24 10% 60%;
          --accent: 24 100% 50%;
          --accent-foreground: 24 10% 10%;
          --destructive: 0 62% 30%;
          --destructive-foreground: 0 0% 95%;
          --border: 24 10% 25%;
          --input: 24 10% 25%;
          --ring: 24 100% 50%;
        }
        
        body {
          background-color: hsl(24 10% 10%);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: hsl(24 10% 15%);
        }
        
        ::-webkit-scrollbar-thumb {
          background: hsl(24 10% 30%);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: hsl(24 100% 50%);
        }
      `}</style>
      {children}
    </div>
  );
}