import Editor from '@/Editor';
import React from 'react';


const DevApp: React.FC = () => {

    return <Editor />
};

// Expose for debugging
declare global {
    interface Window {
        floorplanEditor: any;
    }
}

// For debugging in console
if (typeof window !== 'undefined') {
    window.floorplanEditor = {
        // This will be populated by the provider context
    };
}

export default DevApp;