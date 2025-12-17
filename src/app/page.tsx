'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { calculateScore, formatBRL, parseBRL } from '@/lib/logic';
import { CalculationResult } from '@/lib/types';
import { Send, Calculator as CalcIcon, CheckCircle, XCircle, AlertCircle, Network } from 'lucide-react';

export default function CalculatorPage() {
  const { regions, thresholds, config } = useStore();

  const [regionName, setRegionName] = useState('');
  const [guestsStr, setGuestsStr] = useState('');
  const [investmentStr, setInvestmentStr] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [dealId, setDealId] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load session state
  useEffect(() => {
    const saved = sessionStorage.getItem('sw_calculator_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.regionName) setRegionName(parsed.regionName);
        if (parsed.guestsStr) setGuestsStr(parsed.guestsStr);
        if (parsed.investmentStr) setInvestmentStr(parsed.investmentStr);
        if (parsed.dealId) setDealId(parsed.dealId);
        if (parsed.result) setResult(parsed.result);
      } catch (e) {
        console.error('Failed to load session state', e);
      }
    }
  }, []);

  // Save session state
  useEffect(() => {
    const state = { regionName, guestsStr, investmentStr, dealId, result };
    sessionStorage.setItem('sw_calculator_state', JSON.stringify(state));
  }, [regionName, guestsStr, investmentStr, dealId, result]);

  const handleCalculate = () => {
    const guests = parseInt(guestsStr);
    const investment = parseBRL(investmentStr);

    if (!regionName) {
      alert('Selecione uma região');
      return;
    }
    if (isNaN(guests) || guests <= 0) {
      alert('Número de convidados inválido');
      return;
    }
    if (isNaN(investment) || investment <= 0) {
      alert('Investimento inválido');
      return;
    }

    const res = calculateScore(regionName, guests, investment, regions, thresholds, config.cutoffScore);
    setResult(res);
    setSendResult(null); // Reset previous send result
  };

  const handleSendToActive = async () => {
    if (!dealId) {
      alert('Informe o Deal ID');
      return;
    }
    if (!result) return;

    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/active-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          score: result.scoreFinal,
          config: config.activeCampaign
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSendResult({ success: true, message: `Sucesso! ID: ${data.id} (${data.method})` });
      } else {
        setSendResult({ success: false, message: `Erro: ${data.error || 'Falha desconhecida'}` });
      }
    } catch (error) {
      setSendResult({ success: false, message: 'Erro de conexão' });
    } finally {
      setSending(false);
    }
  };

  const handleInvestmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setInvestmentStr('');
      return;
    }
    const val = parseFloat(raw) / 100;
    setInvestmentStr(formatBRL(val));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  const handleDealKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendToActive();
    }
  };

  return (
    <div className="space-y-8">
      {/* Calculator Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gold-100">
        <h2 className="text-2xl font-bold text-gold-600 mb-6 flex items-center">
          <CalcIcon className="mr-2" /> Calculadora
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Região</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-gold-500 focus:border-gold-500"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              onKeyDown={handleKeyDown}
            >
              <option value="">Selecione...</option>
              {regions.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Convidados</label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 rounded focus:ring-gold-500 focus:border-gold-500"
              value={guestsStr}
              onChange={(e) => setGuestsStr(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: 100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Investimento (BRL)</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-gold-500 focus:border-gold-500"
              value={investmentStr}
              onChange={handleInvestmentChange}
              onKeyDown={handleKeyDown}
              placeholder="R$ 0,00"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleCalculate}
            className="w-full md:w-auto px-6 py-3 bg-gold-500 text-white font-bold rounded hover:bg-gold-600 transition-colors shadow-md cursor-pointer"
          >
            Calcular Score
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gold-100 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Resultado</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Valor por Convidado:</span>
                <span className="font-medium">{formatBRL(result.valorPorConvidado)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Peso Região ({regionName}):</span>
                <span className="font-medium">{result.pesoRegiao}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">
                  Peso Valor
                  {result.thresholdApplied ? ` (Threshold: > ${formatBRL(result.thresholdApplied)})` : ' (< Mínimo)'}:
                </span>
                <span className="font-medium">{result.pesoValor}</span>
              </div>
              <div className="flex justify-between pt-2 text-lg font-bold text-gold-700">
                <span>Score Final:</span>
                <span>{result.scoreFinal}</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-100">
              {result.aprovado ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
                  <span className="text-2xl font-bold text-green-600">Aprovado</span>
                  <span className="text-sm text-gray-500">Score &ge; {config.cutoffScore}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-red-500 mb-2" />
                  <span className="text-2xl font-bold text-red-600">Reprovado</span>
                  <span className="text-sm text-gray-500">Score &lt; {config.cutoffScore}</span>
                </>
              )}
            </div>
          </div>

          {/* ActiveCampaign Integration */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Network className="w-5 h-5 mr-2 text-gold-500" />
              Enviar para ActiveCampaign
            </h4>

            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-grow w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal ID</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-gold-500 focus:border-gold-500"
                  value={dealId}
                  onChange={(e) => setDealId(e.target.value)}
                  onKeyDown={handleDealKeyDown}
                  placeholder="Ex: 12345"
                />
              </div>
              <button
                onClick={handleSendToActive}
                disabled={sending}
                className="w-full md:w-auto px-6 py-2 bg-gray-800 text-white font-medium rounded hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {sending ? 'Enviando...' : <><Send className="w-4 h-4 mr-2" /> Enviar para Active</>}
              </button>
            </div>

            {sendResult && (
              <div className={`mt-4 p-3 rounded text-sm flex items-start ${sendResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {sendResult.success ? <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                <div>
                  <p className="font-bold">{sendResult.success ? 'Sucesso' : 'Erro'}</p>
                  <p>{sendResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
