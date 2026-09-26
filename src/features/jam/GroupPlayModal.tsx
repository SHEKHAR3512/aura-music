import React from 'react';
import { JamHubModal } from './components/JamHubModal';

/**
 * GroupPlayModal
 * Seamless drop-in wrapper ensuring backward compatibility for the new
 * Realtime Jam Listening Room architecture.
 */
export const GroupPlayModal: React.FC = () => {
  return <JamHubModal />;
};

export default GroupPlayModal;
