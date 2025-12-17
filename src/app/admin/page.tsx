'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Trash2, Plus, Save } from 'lucide-react';
import { formatBRL, parseBRL } from '@/lib/logic';

export default function AdminPage() {
    const { regions, thresholds, config, setRegions, setThresholds, setConfig, resetDefaults, isLoaded } = useStore();

    // Local state for new items
    const [newRegionName, setNewRegionName] = useState('');
    const [newRegionWeight, setNewRegionWeight] = useState('');
    const [newThresholdValue, setNewThresholdValue] = useState('');
    const [newThresholdWeight, setNewThresholdWeight] = useState('');
    const [cutoff, setCutoff] = useState('');

    // Sync cutoff when loaded
    useEffect(() => {
        if (isLoaded) {
            setCutoff(config.cutoffScore.toString());
        }
    }, [isLoaded, config.cutoffScore]);

    const handleAddRegion = () => {
        if (!newRegionName || !newRegionWeight) return;
        const weight = parseFloat(newRegionWeight);
        if (isNaN(weight) || weight < 0) return;

        setRegions([...regions, { id: Date.now().toString(), name: newRegionName, weight }]);
        setNewRegionName('');
        setNewRegionWeight('');
    };

    const handleDeleteRegion = (id: string) => {
        setRegions(regions.filter(r => r.id !== id));
    };

    const handleAddThreshold = () => {
        if (!newThresholdValue || !newThresholdWeight) return;
        const value = parseBRL(newThresholdValue);
        const weight = parseFloat(newThresholdWeight);

        if (isNaN(value) || value <= 0) return;
        if (isNaN(weight) || weight < 0) return;

        // Check duplicates
        if (thresholds.some(t => t.value === value)) {
            alert('Já existe um threshold com este valor');
            return;
        }

        setThresholds([...thresholds, { id: Date.now().toString(), value, weight }]);
        setNewThresholdValue('');
        setNewThresholdWeight('');
    };

    const handleDeleteThreshold = (id: string) => {
        setThresholds(thresholds.filter(t => t.id !== id));
    };

    const handleSaveCutoff = () => {
        const val = parseFloat(cutoff);
        if (isNaN(val)) return;
        setConfig({ ...config, cutoffScore: val });
        alert('Nota de corte salva!');
    };

    if (!isLoaded) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gold-600">Regras & Pesos</h2>
                <button onClick={resetDefaults} className="text-sm text-gray-500 hover:text-red-500 underline cursor-pointer">
                    Restaurar Padrões
                </button>
            </div>

            {/* Cutoff Score */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gold-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Nota de Corte</h3>
                <div className="flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo para Aprovação</label>
                        <input
                            type="number"
                            className="p-2 border border-gray-300 rounded focus:ring-gold-500 focus:border-gold-500"
                            value={cutoff}
                            onChange={(e) => setCutoff(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSaveCutoff}
                        className="px-4 py-2 bg-gold-500 text-white rounded hover:bg-gold-600 flex items-center cursor-pointer"
                    >
                        <Save className="w-4 h-4 mr-2" /> Salvar
                    </button>
                </div>
            </div>

            {/* Regions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gold-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Pesos por Região</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-600 text-sm">
                                <th className="pb-2">Região</th>
                                <th className="pb-2">Peso</th>
                                <th className="pb-2 w-20">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {regions.map(r => (
                                <tr key={r.id}>
                                    <td className="py-2">{r.name}</td>
                                    <td className="py-2">{r.weight}</td>
                                    <td className="py-2">
                                        <button onClick={() => handleDeleteRegion(r.id)} className="text-red-400 hover:text-red-600 cursor-pointer">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50">
                                <td className="py-2 pr-2">
                                    <input
                                        placeholder="Nome"
                                        className="w-full p-1 border border-gray-300 rounded text-sm"
                                        value={newRegionName}
                                        onChange={(e) => setNewRegionName(e.target.value)}
                                    />
                                </td>
                                <td className="py-2 pr-2">
                                    <input
                                        type="number"
                                        placeholder="Peso"
                                        className="w-full p-1 border border-gray-300 rounded text-sm"
                                        value={newRegionWeight}
                                        onChange={(e) => setNewRegionWeight(e.target.value)}
                                    />
                                </td>
                                <td className="py-2">
                                    <button onClick={handleAddRegion} className="text-green-600 hover:text-green-700 cursor-pointer">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Thresholds */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gold-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Pesos por Valor (Thresholds)</h3>
                <p className="text-sm text-gray-500 mb-4">
                    O sistema aplica o peso do maior threshold que for menor ou igual ao valor por convidado.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-600 text-sm">
                                <th className="pb-2">Valor Mínimo (R$)</th>
                                <th className="pb-2">Peso</th>
                                <th className="pb-2 w-20">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[...thresholds].sort((a, b) => a.value - b.value).map(t => (
                                <tr key={t.id}>
                                    <td className="py-2">{formatBRL(t.value)}</td>
                                    <td className="py-2">{t.weight}</td>
                                    <td className="py-2">
                                        <button onClick={() => handleDeleteThreshold(t.id)} className="text-red-400 hover:text-red-600 cursor-pointer">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50">
                                <td className="py-2 pr-2">
                                    <input
                                        placeholder="Valor (ex: 2000)"
                                        className="w-full p-1 border border-gray-300 rounded text-sm"
                                        value={newThresholdValue}
                                        onChange={(e) => setNewThresholdValue(e.target.value)}
                                    />
                                </td>
                                <td className="py-2 pr-2">
                                    <input
                                        type="number"
                                        placeholder="Peso"
                                        className="w-full p-1 border border-gray-300 rounded text-sm"
                                        value={newThresholdWeight}
                                        onChange={(e) => setNewThresholdWeight(e.target.value)}
                                    />
                                </td>
                                <td className="py-2">
                                    <button onClick={handleAddThreshold} className="text-green-600 hover:text-green-700 cursor-pointer">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
