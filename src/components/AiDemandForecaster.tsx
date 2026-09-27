import React, { useState, useEffect } from 'react';
import { useAvanyx } from '../context/AvanyxContext';
import {
  TrendingUp, Sparkles, Clock, AlertTriangle, BarChart2, Zap, Package, Info
} from 'lucide-react';
import { getApiUrl } from '../lib/apiConfig';

export const AiDemandForecaster: React.FC = () => {
  const {
    products,
    brainMetrics,
    activeBusiness,
    currency,
    setCurrentModule,
    salesHistory,
    tenantId,
    userId,
    getAuthHeaders
  } = useAvanyx();

  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const businessContext = {
          products,
          salesHistory: (salesHistory || []).filter(s => s.status !== 'cancelled'),
          activeBusiness,
          brainMetrics
        };
        
        const res = await fetch(getApiUrl('/api/ai/forecast'), {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify({ businessContext, tenantId, userId })
        });
        
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setForecast(data);
          } else {
            setError(data.error || 'Failed to generate forecast');
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Connection error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchForecast();
    return () => { isMounted = false; };
  }, [products, salesHistory, activeBusiness, brainMetrics, tenantId, userId]);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-10 space-y-4">
        <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
        <div className="text-slate-600 dark:text-slate-400 font-medium">Avanyx Brain is analyzing ledger for forecasts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center p-10">
        <div className="text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/30 px-4 py-2 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  if (!forecast || forecast.hasEnoughData === false) {
    return (
      <div className="w-full bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-[#0B1220] rounded-2xl flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Not enough data to forecast yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          {forecast?.reason || 'Avanyx Brain requires more historical sales data (minimum 3 real transactions) to accurately predict demand and calculate stockout risks. We do not invent fake numbers.'}
        </p>
      </div>
    );
  }

  const { forecastDays = [], projectedOutcome = {}, hourlyRush = [], stockoutRisks = [] } = forecast;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-[#06B6D4]" />
            Avanyx Brain Forecast
          </h3>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
            Data-driven demand predictions based purely on your actual historical ledger.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-5 shadow-2xs flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">7-Day Revenue Forecast</h4>
          </div>
          
          <div className="flex items-end gap-2 sm:gap-4 h-[200px] mt-auto pb-2 border-b border-slate-100 dark:border-[#1F2E4D]/50 relative">
            {forecastDays.map((f: any, idx: number) => {
              const maxRev = Math.max(...forecastDays.map((d: any) => d.expectedRevenue), 1);
              const heightPct = Math.max(10, Math.round((f.expectedRevenue / maxRev) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end group">
                  <div 
                    className="w-full max-w-[40px] bg-blue-500 dark:bg-[#06B6D4] rounded-t-lg transition-all duration-300 group-hover:opacity-80"
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <div className="text-[10px] font-bold text-slate-600 dark:text-[#94A3B8] mt-2 truncate w-full text-center">
                    {f.day.slice(0, 3)}
                  </div>
                  <div className="absolute top-0 opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] px-2 py-1 rounded shadow pointer-events-none transition-opacity z-10 whitespace-nowrap">
                    {currency || '$'}{f.expectedRevenue?.toLocaleString() || 0}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-4 mt-6 rounded-2xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium">Projected 30-Day Revenue</div>
              <div className="text-base font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                {currency || '$'}{projectedOutcome.projectedRev?.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium">Estimated Margin</div>
              <div className="text-base font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                {projectedOutcome.projectedMargin || 0}%
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-[#06B6D4]" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">Verified Peak Activity</h4>
            </div>

            <div className="space-y-2.5 mt-2">
              {hourlyRush.length > 0 ? hourlyRush.map((rush: any, idx: number) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700 dark:text-[#F8FAFC] font-medium">
                    <span>{rush.time} ({rush.label})</span>
                    <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{rush.probability}% vol</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[#0B1220] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 dark:bg-[#06B6D4] h-full rounded-full transition-all duration-500"
                      style={{ width: `${rush.probability}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="text-xs text-slate-500">No established peak patterns yet.</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">Calculated Stockout Risk</h4>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {stockoutRisks.length > 0 ? (
                stockoutRisks.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-[#F8FAFC] truncate max-w-[150px]">{item.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-[#94A3B8]">
                        {item.stock} units left
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                        ~{item.daysRemaining} days left
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-500 dark:text-[#94A3B8] bg-slate-50 dark:bg-[#0B1220] rounded-2xl font-medium">
                  ? All stock levels are safely above projected demand.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
