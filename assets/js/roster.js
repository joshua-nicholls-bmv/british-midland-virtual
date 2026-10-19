(() => {
    'use strict';
    const endpoint = 'https://eqbaezhcwnjlcnvtfxho.supabase.co/rest/v1/public_pilot_roster';
    const publicKey = 'sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW';
    const fields = ['pilot_number', 'display_name', 'rank', 'status', 'completed_flights', 'flight_hours', 'last_flight', 'vatsim_flights'];
    const labels = ['Pilot number', 'Display name', 'Rank', 'Status', 'Completed flights', 'Flight hours', 'Last flight', 'VATSIM flights'];
    const body = document.getElementById('roster-body');
    const message = document.getElementById('roster-message');
    const retry = document.getElementById('roster-retry');
    const search = document.getElementById('roster-search');
    const status = document.getElementById('roster-status');
    const table = document.getElementById('roster-table');
    let pilots = [];
    let loading = false;
    const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });
    const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    function format(value, field) {
        if (field === 'vatsim_flights' && value === null) return 'Not available';
        if (field === 'last_flight') return value ? date.format(new Date(value + 'T00:00:00Z')) : 'No recorded flight';
        if (field === 'rank') return value || '—';
        if (['completed_flights', 'flight_hours', 'vatsim_flights'].includes(field)) return number.format(value);
        return String(value ?? '—');
    }
    function render() {
        const term = search.value.trim().toLocaleLowerCase('en-GB');
        const rows = pilots.filter(p => (!status.value || p.status === status.value) &&
            `${p.pilot_number} ${p.display_name}`.toLocaleLowerCase('en-GB').includes(term));
        body.replaceChildren();
        for (const pilot of rows) {
            const row = document.createElement('tr');
            fields.forEach((field, index) => {
                const cell = document.createElement(index === 0 ? 'th' : 'td');
                if (index === 0) cell.scope = 'row';
                cell.dataset.label = labels[index];
                const value = document.createElement('span');
                value.textContent = format(pilot[field], field);
                if (field === 'status') value.className = 'roster-badge';
                cell.append(value);
                row.append(cell);
            });
            body.append(row);
        }
        table.hidden = rows.length === 0;
        message.textContent = rows.length ? `${rows.length} ${rows.length === 1 ? 'pilot' : 'pilots'} shown` :
            pilots.length ? 'No pilots match your search.' : 'No pilots are currently listed.';
    }
    async function load() {
        if (loading) return;
        loading = true;
        retry.hidden = true;
        table.hidden = true;
        pilots = [];
        body.replaceChildren();
        search.disabled = status.disabled = true;
        message.textContent = 'Loading pilot roster…';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            // Page to the end, even when the API's row cap is below our requested size.
            let offset = 0;
            while (true) {
                const url = new URL(endpoint);
                url.search = new URLSearchParams({ select: fields.join(','), order: 'pilot_number.asc', limit: '500', offset: String(offset) });
                const response = await fetch(url, { headers: { apikey: publicKey }, credentials: 'omit', cache: 'no-store', signal: controller.signal });
                if (!response.ok) throw new Error('Roster unavailable');
                const page = await response.json();
                if (!Array.isArray(page)) throw new Error('Unexpected response');
                if (!page.length) break;
                pilots.push(...page);
                offset += page.length;
            }
            search.disabled = status.disabled = false;
            render();
        } catch {
            pilots = [];
            body.replaceChildren();
            table.hidden = true;
            message.textContent = 'The pilot roster is temporarily unavailable. Please try again.';
            retry.hidden = false;
        } finally {
            clearTimeout(timeout);
            loading = false;
        }
    }
    search.addEventListener('input', render);
    status.addEventListener('change', render);
    retry.addEventListener('click', load);
    setInterval(() => { if (!document.hidden) load(); }, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
    load();
})();
