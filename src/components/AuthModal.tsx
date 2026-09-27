import React from 'react';
import { AuthPortal } from './AuthPortal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'phone' | 'staff' | 'demo';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <AuthPortal
        isOpenModal={true}
        onClose={onClose}
        onSuccess={onClose}
        initialMode={initialMode}
      />
    </div>
  );
};
