import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, config, dealId, score, fieldName } = body;
        const { baseUrl, apiToken, customFieldId } = config || {};

        if (!baseUrl || !apiToken) {
            return NextResponse.json({ error: 'Configuração incompleta' }, { status: 400 });
        }

        const headers = {
            'Api-Token': apiToken,
            'Content-Type': 'application/json'
        };

        // 1. Test Credentials
        if (action === 'test') {
            const res = await fetch(`${baseUrl}/api/3/users/me`, { headers });
            if (res.ok) {
                return NextResponse.json({ ok: true });
            } else {
                return NextResponse.json({ error: `Status ${res.status}` }, { status: res.status });
            }
        }

        // 2. Resolve Field ID
        if (action === 'resolveField') {
            const res = await fetch(`${baseUrl}/api/3/dealCustomFieldMeta?limit=100`, { headers });
            if (!res.ok) return NextResponse.json({ error: 'Erro ao buscar campos' }, { status: res.status });

            const data = await res.json();
            const fields = data.dealCustomFieldMeta || [];

            // Find all matches (case-insensitive)
            const matches = fields.filter((f: any) => f.fieldLabel.toLowerCase() === fieldName.toLowerCase());

            if (matches.length === 0) {
                return NextResponse.json({ error: 'Campo não encontrado' }, { status: 404 });
            }

            // Prioritize types that accept our data (text, textarea, currency, number)
            // Avoid 'date', 'datetime'
            const preferredTypes = ['text', 'textarea', 'currency', 'number'];

            // Sort matches: preferred types first, then by ID descending (newest first)
            matches.sort((a: any, b: any) => {
                const aIsPreferred = preferredTypes.includes(a.fieldType);
                const bIsPreferred = preferredTypes.includes(b.fieldType);
                if (aIsPreferred && !bIsPreferred) return -1;
                if (!aIsPreferred && bIsPreferred) return 1;
                return parseInt(b.id) - parseInt(a.id); // Newest first
            });

            const target = matches[0];

            // Return debug info about other matches if any
            const debugMsg = matches.map((m: any) => `[ID: ${m.id}, Tipo: ${m.fieldType}]`).join('; ');

            return NextResponse.json({
                id: target.id,
                fieldType: target.fieldType,
                debug: `Encontrados: ${debugMsg}`
            });
        }

        // 3. Send Score (Default)
        if (!dealId || score === undefined) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        if (!customFieldId) {
            return NextResponse.json({ error: 'Custom Field ID não configurado' }, { status: 400 });
        }

        // Check if value exists
        const checkUrl = `${baseUrl}/api/3/dealCustomFieldData?filters[dealId]=${dealId}&filters[customFieldId]=${customFieldId}`;
        const checkRes = await fetch(checkUrl, { headers });
        const checkData = await checkRes.json();

        const existingEntry = checkData.dealCustomFieldData && checkData.dealCustomFieldData.length > 0
            ? checkData.dealCustomFieldData[0]
            : null;

        let shouldCreateNewEntry = !existingEntry;
        const existingEntryId = existingEntry ? existingEntry.id : null;

        if (existingEntry) {
            // PUT
            const updateUrl = `${baseUrl}/api/3/dealCustomFieldData/${existingEntry.id}`;
            const updateBody = {
                dealCustomFieldDatum: {
                    fieldValue: score.toString()
                }
            };
            const updateRes = await fetch(updateUrl, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updateBody)
            });

            if (updateRes.ok) {
                shouldCreateNewEntry = false;
                return NextResponse.json({ ok: true, id: existingEntry.id, method: 'PUT' });
            } else {
                // If 422 (Unprocessable Entity), it might be a type mismatch (old data was date, new is text).
                // Try to DELETE the old entry and create a new one.
                if (updateRes.status === 422) {
                    await fetch(`${baseUrl}/api/3/dealCustomFieldData/${existingEntry.id}`, {
                        method: 'DELETE',
                        headers
                    });
                    shouldCreateNewEntry = true; // Proceed to create new
                } else {
                    const err = await updateRes.text();
                    return NextResponse.json({
                        error: `Falha ao atualizar (Field ID: ${customFieldId}, Entry ID: ${existingEntry.id}): ${err}`
                    }, { status: updateRes.status });
                }
            }
        }

        if (shouldCreateNewEntry) {
            // POST
            const createUrl = `${baseUrl}/api/3/dealCustomFieldData`;
            const createBody = {
                dealCustomFieldDatum: {
                    dealId: dealId,
                    customFieldId: customFieldId,
                    fieldValue: score.toString()
                }
            };
            const createRes = await fetch(createUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(createBody)
            });

            if (createRes.ok) {
                const data = await createRes.json();
                return NextResponse.json({ ok: true, id: data.dealCustomFieldDatum?.id, method: 'POST' });
            } else {
                const err = await createRes.text();
                return NextResponse.json({ error: `Falha ao criar (Field ID: ${customFieldId}): ${err}` }, { status: createRes.status });
            }
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
