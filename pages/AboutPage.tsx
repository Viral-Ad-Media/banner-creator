import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-white">About Social Studio</h1>
      <p className="text-muted mt-5 leading-relaxed">
        Social Studio is a focused SaaS product for campaign teams that need to create and publish social visual content
        quickly. It combines strategy generation, AI image workflows, and editing tools in one interface so teams can
        move from idea to published creative without tool-hopping.
      </p>
      <p className="text-muted mt-4 leading-relaxed">
        The platform is built with a React frontend, a Supabase-backed Express API, and server-side AI integrations.
        This architecture keeps sensitive keys out of the browser while maintaining fast product iteration.
      </p>
    </div>
  );
};
