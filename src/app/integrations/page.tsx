'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Save, CheckCircle, AlertCircle, Search, RefreshCw, Trash2, Send } from 'lucide-react';
import { WebhookPayload } from '@/lib/types';

export default function IntegrationsPage() {
    const { config, setConfig, isLoaded } = useStore();

    const [baseUrl, setBaseUrl] = useState('');
    const [apiToken, setApiToken] = useState('');
    const [dealField, setDealField] = useState('');
    const [customFieldId, setCustomFieldId] = useState('');

    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [resolveResult, setResolveResult] = useState<{ success: boolean; message: string } | null>(null);
    const [loadingTest, setLoadingTest] = useState(false);
    const [loadingResolve, setLoadingResolve] = useState(false);

    const [webhookPayloads, setWebhookPayloads] = useState<WebhookPayload[]>([]);
    const [loadingWebhooks, setLoadingWebhooks] = useState(false);

    useEffect(() => {
        if (isLoaded) {
            setBaseUrl(config.activeCampaign.baseUrl);
            setApiToken(config.activeCampaign.apiToken);
            setDealField(config.activeCampaign.dealField);
            setCustomFieldId(config.activeCampaign.customFieldId || '');
        }
    }, [isLoaded, config]);

    const handleSave = () => {
        setConfig({
            ...config,
            activeCampaign: {
                baseUrl,
                apiToken,
                dealField,
                customFieldId
            }
        });
        alert('Configurações salvas!');
    };

    const handleTestCredentials = async () => {
        setLoadingTest(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/active-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'test',
                    config: { baseUrl, apiToken }
                })
            });
            const data = await res.json();
            if (res.ok) {
                setTestResult({ success: true, message: 'Conexão bem-sucedida (200 OK)' });
            } else {
                setTestResult({ success: false, message: `Erro: ${data.error}` });
            }
        } catch (e) {
            setTestResult({ success: false, message: 'Erro de rede' });
        } finally {
            setLoadingTest(false);
        }
    };

    const handleResolveFieldId = async () => {
        setLoadingResolve(true);
        setResolveResult(null);
        try {
            const res = await fetch('/api/active-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'resolveField',
                    fieldName: dealField,
                    config: { baseUrl, apiToken }
                })
            });
            const data = await res.json();
            if (res.ok && data.id) {
                setCustomFieldId(data.id);
                const typeMsg = data.fieldType ? ` (Tipo: ${data.fieldType})` : '';
                const warning = data.fieldType === 'datetime' || data.fieldType === 'date' ? ' ⚠️ CUIDADO: Campo do tipo Data/Hora não aceita números!' : '';

                setResolveResult({ success: true, message: `Encontrado ID: ${data.id}${typeMsg}${warning}` });
                // Auto save
                setConfig({
                    ...config,
                    activeCampaign: {
                        baseUrl,
                        apiToken,
                        dealField,
                        customFieldId: data.id
                    }
                });
            } else {
                setResolveResult({ success: false, message: `Não encontrado: ${data.error || 'Campo não existe'}` });
            }
        } catch (e) {
            setResolveResult({ success: false, message: 'Erro de rede' });
        } finally {
            setLoadingResolve(false);
        }
    };

    const fetchWebhooks = async () => {
        setLoadingWebhooks(true);
        try {
            const res = await fetch('/api/webhook/active');
            const data = await res.json();
            if (Array.isArray(data)) {
                setWebhookPayloads(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingWebhooks(false);
        }
    };

    const handleClearWebhooks = async () => {
        await fetch('/api/webhook/active', { method: 'DELETE' });
        fetchWebhooks();
    };

    const handleSimulateWebhook = async () => {
        await fetch('/api/webhook/active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                regiao: 'Nordeste',
                convidados: 150,
                investimento: 30000,
                dealId: 'SIMULATED-' + Date.now()
            })
        });
        fetchWebhooks();
    };

    useEffect(() => {
        fetchWebhooks();
        const interval = setInterval(fetchWebhooks, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!isLoaded) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gold-600">Integrações</h2>

            {/* ActiveCampaign Config */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gold-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuração ActiveCampaign</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded focus:ring-gold-500 focus:border-gold-500"
                            placeholder="https://suaconta.api-us1.com"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                        <input
                            type="password"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-gold-500 focus:border-gold-500"
                            placeholder="****************"
                            value={apiToken}
                            onChange={(e) => setApiToken(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Campo no Deal</label>
                            <input
                                className="w-full p-2 border border-gray-300 rounded focus:ring-gold-500 focus:border-gold-500"
                                value={dealField}
                                onChange={(e) => setDealField(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Field ID</label>
                            <input
                                className="w-full p-2 border border-gray-300 rounded focus:ring-gold-500 focus:border-gold-500"
                                value={customFieldId}
                                onChange={(e) => setCustomFieldId(e.target.value)}
                                placeholder="ID ou clique em Resolver"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-gold-500 text-white rounded hover:bg-gold-600 flex items-center cursor-pointer"
                        >
                            <Save className="w-4 h-4 mr-2" /> Salvar Config
                        </button>

                        <button
                            onClick={handleTestCredentials}
                            disabled={loadingTest}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center cursor-pointer"
                        >
                            {loadingTest ? 'Testando...' : 'Testar Credenciais'}
                        </button>

                        <button
                            onClick={handleResolveFieldId}
                            disabled={loadingResolve}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center cursor-pointer"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            {loadingResolve ? 'Buscando...' : 'Resolver Field ID'}
                        </button>
                    </div>

                    {/* Results */}
                    {testResult && (
                        <div className={`p-2 rounded text-sm ${testResult.success ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                            {testResult.message}
                        </div>
                    )}
                    {resolveResult && (
                        <div className={`p-2 rounded text-sm ${resolveResult.success ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                            {resolveResult.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Webhook Debug */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gold-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Webhook Debug</h3>
                    <div className="flex gap-2">
                        <button onClick={handleSimulateWebhook} className="text-sm text-blue-600 hover:underline flex items-center cursor-pointer">
                            <Send className="w-3 h-3 mr-1" /> Simular
                        </button>
                        <button onClick={fetchWebhooks} className="text-sm text-gray-600 hover:underline flex items-center cursor-pointer">
                            <RefreshCw className="w-3 h-3 mr-1" /> Atualizar
                        </button>
                        <button onClick={handleClearWebhooks} className="text-sm text-red-600 hover:underline flex items-center cursor-pointer">
                            <Trash2 className="w-3 h-3 mr-1" /> Limpar
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
                    <p className="text-sm text-gray-600 font-mono break-all">
                        POST {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/active
                    </p>
                </div>

                <div className="space-y-4">
                    {webhookPayloads.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">Nenhum webhook recebido ainda.</p>
                    ) : (
                        webhookPayloads.map((payload) => (
                            <div key={payload.id} className="border border-gray-200 rounded p-3 bg-white text-sm">
                                <div className="flex justify-between text-gray-500 text-xs mb-2">
                                    <span>ID: {payload.id}</span>
                                    <span>{new Date(payload.receivedAt).toLocaleString()}</span>
                                </div>
                                <pre className="bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(payload.data, null, 2)}
                                </pre>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
