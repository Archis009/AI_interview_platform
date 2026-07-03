"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  TooltipProps,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

export function DashboardCharts({ scoreHistory }: { scoreHistory: { name: string, score: number }[] }) {
  // Mock skills data for the radar chart
  const skillsData = [
    { subject: 'Technical Knowledge', A: 85, fullMark: 100 },
    { subject: 'Problem Solving', A: 90, fullMark: 100 },
    { subject: 'Communication', A: 75, fullMark: 100 },
    { subject: 'Confidence', A: 80, fullMark: 100 },
    { subject: 'Behavioral Skills', A: 85, fullMark: 100 },
    { subject: 'Leadership', A: 70, fullMark: 100 },
    { subject: 'Ownership', A: 85, fullMark: 100 },
    { subject: 'Adaptability', A: 90, fullMark: 100 },
    { subject: 'Critical Thinking', A: 85, fullMark: 100 },
    { subject: 'Learning Mindset', A: 95, fullMark: 100 },
  ];

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '0.5rem', borderRadius: '0.5rem' }}>
          <p style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{`${label} : ${payload[0]?.value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="charts-grid">
      {/* Score Trend Chart */}
      <div className="chart-card">
        <h3 className="chart-title">SCORE TREND</h3>
        <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={scoreHistory}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
              <RechartsTooltip content={CustomTooltip} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#2dd4bf" 
                strokeWidth={3} 
                dot={{ r: 6, fill: '#2dd4bf', strokeWidth: 2, stroke: '#0f172a' }} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skills Radar Chart */}
      <div className="chart-card">
        <h3 className="chart-title">SKILLS</h3>
        <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Candidate"
                dataKey="A"
                stroke="#a78bfa"
                fill="#818cf8"
                fillOpacity={0.4}
                dot={{ r: 3, fill: '#38bdf8' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
