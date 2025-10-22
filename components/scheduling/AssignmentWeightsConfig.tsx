'use client';

import React, { useState, useEffect } from 'react';
import { AssignmentWeights, DEFAULT_ASSIGNMENT_WEIGHTS } from '@/types/scheduling';
import { Settings, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface AssignmentWeightsConfigProps {
  weights: AssignmentWeights;
  onChange: (weights: AssignmentWeights) => void;
  disabled?: boolean;
}

export function AssignmentWeightsConfig({
  weights,
  onChange,
  disabled = false,
}: AssignmentWeightsConfigProps) {
  const [localWeights, setLocalWeights] = useState<AssignmentWeights>(weights);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate total weight
  const totalWeight = Object.values(localWeights).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(totalWeight - 1.0) < 0.01;

  // Update local weights when props change
  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  const handleWeightChange = (factor: keyof AssignmentWeights, value: number) => {
    const newWeights = { ...localWeights, [factor]: value };
    setLocalWeights(newWeights);
  };

  const handleApply = () => {
    if (isValid) {
      onChange(localWeights);
    }
  };

  const handleReset = () => {
    setLocalWeights(DEFAULT_ASSIGNMENT_WEIGHTS);
    onChange(DEFAULT_ASSIGNMENT_WEIGHTS);
  };

  const weightFactors: Array<{
    key: keyof AssignmentWeights;
    label: string;
    description: string;
  }> = [
    {
      key: 'workloadEquity',
      label: 'Workload Equity',
      description: 'Fair distribution of courses across faculty',
    },
    {
      key: 'facultyPreference',
      label: 'Faculty Preferences',
      description: 'Match faculty preferred teaching times',
    },
    {
      key: 'courseTypeMatch',
      label: 'Course Expertise',
      description: 'Match faculty expertise to course type',
    },
    {
      key: 'historicalConsistency',
      label: 'Historical Consistency',
      description: 'Keep assignments consistent with past semesters',
    },
    {
      key: 'timeEfficiency',
      label: 'Time Efficiency',
      description: 'Minimize schedule gaps for faculty',
    },
    {
      key: 'roomProximity',
      label: 'Room Proximity',
      description: 'Minimize room changes for faculty',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Assignment Factor Weights</h3>
            <p className="text-sm text-gray-600">
              Configure how the algorithm balances different factors
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isValid && (
            <span className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Must sum to 1.0
            </span>
          )}
          <span className={`text-sm font-mono px-3 py-1 rounded ${
            isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            Total: {totalWeight.toFixed(2)}
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-200">
          <div className="pt-4 space-y-6">
            {/* Weight Sliders */}
            {weightFactors.map(({ key, label, description }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">{label}</label>
                    <p className="text-xs text-gray-600">{description}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={localWeights[key].toFixed(2)}
                    onChange={(e) => handleWeightChange(key, parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className="w-20 px-3 py-1 text-sm font-mono text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(localWeights[key] * 100)}
                    onChange={(e) => handleWeightChange(key, parseInt(e.target.value) / 100)}
                    disabled={disabled}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                  />
                  <div
                    className="absolute top-0 left-0 h-2 bg-blue-600 rounded-lg pointer-events-none"
                    style={{ width: `${localWeights[key] * 100}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Status Message */}
            <div className={`p-4 rounded-lg ${
              isValid
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                {isValid ? (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isValid ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    {isValid
                      ? 'Weights are balanced and ready to use'
                      : `Weights must sum to 1.00 (currently ${totalWeight.toFixed(2)})`}
                  </p>
                  {!isValid && (
                    <p className="text-xs text-yellow-700 mt-1">
                      Adjust the sliders so the total equals 1.00
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleApply}
                disabled={!isValid || disabled}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Apply Weights
              </button>
              <button
                onClick={handleReset}
                disabled={disabled}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </button>
            </div>

            {/* Default Values Reference */}
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer hover:text-gray-900 font-medium">
                Show default weights
              </summary>
              <div className="mt-2 space-y-1 pl-4">
                {weightFactors.map(({ key, label }) => (
                  <div key={key} className="flex justify-between font-mono">
                    <span>{label}:</span>
                    <span className="font-semibold">{DEFAULT_ASSIGNMENT_WEIGHTS[key].toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
