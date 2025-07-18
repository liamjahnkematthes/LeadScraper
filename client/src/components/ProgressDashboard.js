import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Search, 
  Mail, 
  CheckCircle, 
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react';

const ProgressDashboard = ({ stats, isRunning }) => {
  const {
    totalQueries = 0,
    processedQueries = 0,
    totalEmails = 0,
    uniqueEmails = 0,
    estimatedTime = 0,
    startTime,
    currentQuery = ''
  } = stats;

  const progress = totalQueries > 0 ? (processedQueries / totalQueries) * 100 : 0;
  const remainingQueries = totalQueries - processedQueries;
  
  // Calculate elapsed time
  const elapsedTime = startTime ? Math.floor((new Date() - new Date(startTime)) / 1000) : 0;
  const estimatedRemaining = remainingQueries > 0 && processedQueries > 0 
    ? Math.floor((elapsedTime / processedQueries) * remainingQueries)
    : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatQuery = (query) => {
    return query.replace(/\+/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Progress Dashboard</span>
        </h3>
      </div>

      <div className="card-body space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Query Progress
            </span>
            <span className="text-sm text-gray-500">
              {processedQueries} of {totalQueries} completed
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="font-medium">{Math.round(progress)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Current Status */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-800">
                Currently Processing
              </span>
            </div>
            {currentQuery && (
              <p className="text-sm text-blue-700">
                {formatQuery(currentQuery)}
              </p>
            )}
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Search className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{remainingQueries}</div>
            <div className="text-xs text-gray-600">Remaining</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-900">{processedQueries}</div>
            <div className="text-xs text-green-600">Completed</div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-900">{totalEmails}</div>
            <div className="text-xs text-blue-600">Total Emails</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-900">{uniqueEmails}</div>
            <div className="text-xs text-purple-600">Unique Emails</div>
          </div>
        </div>

        {/* Time Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-xs text-gray-600">Elapsed</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-sm font-medium text-gray-900">
              {isRunning ? formatTime(estimatedRemaining) : '--:--'}
            </div>
            <div className="text-xs text-gray-600">Estimated Remaining</div>
          </div>
        </div>

        {/* Performance Metrics */}
        {processedQueries > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Performance</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Avg. time per query:</span>
                <span className="ml-2 font-medium">
                  {formatTime(Math.floor(elapsedTime / processedQueries))}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Emails per query:</span>
                <span className="ml-2 font-medium">
                  {processedQueries > 0 ? Math.round(totalEmails / processedQueries) : 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard; 