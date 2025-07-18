import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';

const StatusIndicator = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Connected':
        return {
          icon: CheckCircle,
          color: 'text-success-600',
          bgColor: 'bg-success-100',
          label: 'Connected',
          description: 'Real-time updates active'
        };
      case 'Connecting':
        return {
          icon: Loader2,
          color: 'text-primary-600',
          bgColor: 'bg-primary-100',
          label: 'Connecting',
          description: 'Establishing connection...',
          animate: true
        };
      case 'Disconnected':
        return {
          icon: WifiOff,
          color: 'text-warning-600',
          bgColor: 'bg-warning-100',
          label: 'Disconnected',
          description: 'No real-time updates'
        };
      case 'Error':
        return {
          icon: XCircle,
          color: 'text-danger-600',
          bgColor: 'bg-danger-100',
          label: 'Error',
          description: 'Connection failed'
        };
      case 'Failed':
        return {
          icon: XCircle,
          color: 'text-danger-600',
          bgColor: 'bg-danger-100',
          label: 'Failed',
          description: 'Could not connect'
        };
      default:
        if (status?.includes('Reconnecting')) {
          return {
            icon: Loader2,
            color: 'text-warning-600',
            bgColor: 'bg-warning-100',
            label: 'Reconnecting',
            description: status,
            animate: true
          };
        }
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-2">
      <motion.div
        className={`p-2 rounded-full ${config.bgColor}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Icon 
          className={`h-4 w-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`}
        />
      </motion.div>
      
      <div className="hidden sm:block">
        <div className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </div>
        <div className="text-xs text-gray-500">
          {config.description}
        </div>
      </div>
    </div>
  );
};

export default StatusIndicator; 