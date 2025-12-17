import { RegionRule, ThresholdRule, CalculationResult } from './types';

export function calculateScore(
    regionName: string,
    guests: number,
    investment: number,
    regions: RegionRule[],
    thresholds: ThresholdRule[],
    cutoff: number
): CalculationResult {
    const valorPorConvidado = guests > 0 ? investment / guests : 0;

    // Region Weight
    // If "Outro" and not in table, weight = 0.
    // Actually, if regionName is in table, use it. If not, 0.
    const regionRule = regions.find(r => r.name.toLowerCase() === regionName.toLowerCase());
    const pesoRegiao = regionRule ? regionRule.weight : 0;

    // Value Weight
    // Sort thresholds ascending
    const sortedThresholds = [...thresholds].sort((a, b) => a.value - b.value);

    let pesoValor = 0;
    let thresholdApplied = null;

    // Find the largest threshold <= valorPorConvidado
    // We iterate. If val >= t.value, we take it.
    // Since sorted, we keep taking until we find one that is too big, or we finish.
    // Actually, simpler: iterate backwards? No, iterate forwards and update.

    for (const t of sortedThresholds) {
        if (valorPorConvidado >= t.value) {
            pesoValor = t.weight;
            thresholdApplied = t.value;
        } else {
            // Current threshold is > value. Stop.
            // The previous one (if any) remains the selected one.
            break;
        }
    }

    const scoreFinal = pesoRegiao + pesoValor;
    const aprovado = scoreFinal >= cutoff;

    return {
        valorPorConvidado,
        pesoRegiao,
        pesoValor,
        thresholdApplied,
        scoreFinal,
        aprovado
    };
}

export function parseBRL(value: string): number {
    if (!value) return 0;
    // Remove currency symbol and whitespace
    let clean = value.replace(/R\$\s?/gi, '').trim();

    // If format is like 1.234,56
    if (clean.includes(',')) {
        // Remove all dots (thousands)
        clean = clean.replace(/\./g, '');
        // Replace comma with dot
        clean = clean.replace(',', '.');
    } else {
        // No comma.
        // Assume dots are thousands separators.
        clean = clean.replace(/\./g, '');
    }

    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

export function formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}
