// Public fleet snapshot. Only the dedicated, restricted-column RPC is used.
(() => {
    'use strict';
    const endpoint = 'https://eqbaezhcwnjlcnvtfxho.supabase.co/rest/v1/rpc/get_public_fleet_status';
    const publicKey = 'sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW';
    const $ = id => document.getElementById(id);
    const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const descriptions = {
        AVAILABLE:['AVAILABLE','Available for service.'],
        TECH_HOLD:['TECH HOLD','Unavailable — awaiting technical inspection and release.'],
        AWAITING_RELEASE:['AWAITING RELEASE','Unavailable — awaiting management release.'],
        MAINTENANCE:['MAINTENANCE','Unavailable — undergoing maintenance.'],
        NOT_IN_SERVICE:['NOT IN SERVICE','Unavailable — not currently in service.']
    };
    const classes = {BEATING_HEART:'Beating Heart',PIONEER:'Pioneer',FOUNDRY:'Foundry',TECH_OPS:'Technical Operations'};
    let rows = [], busy = false, lastSuccess = 0, timer;
    const render = () => {
        const term = $('fsSearch').value.trim().toLowerCase();
        const status = $('fsStatus').value;
        const group = $('fsClass').value;
        const shown = rows.filter(r => (!group || r.fleet_class === group)
            && (!status || (status === 'UNAVAILABLE' ? r.operational_status !== 'AVAILABLE' : r.operational_status === status))
            && [r.registration,r.aircraft_type,r.aircraft_name,r.current_location].some(v => String(v || '').toLowerCase().includes(term)));
        $('fsTotal').textContent = rows.length;
        $('fsAvailable').textContent = rows.filter(r=>r.operational_status === 'AVAILABLE').length;
        $('fsUnavailable').textContent = rows.filter(r=>r.operational_status !== 'AVAILABLE').length;
        $('fsCount').textContent = `${shown.length} of ${rows.length} current aircraft`;
        $('fsGrid').innerHTML = shown.length ? shown.map(r=>{
            const [statusLabel,explanation] = descriptions[r.operational_status] || ['STATUS UNKNOWN','Availability could not be confirmed. Check with Operations.'];
            return `<article class="fs-card"><span class="fs-badge ${r.operational_status === 'AVAILABLE' ? 'available' : 'unavailable'}">${escape(statusLabel)}</span><h3>${escape(r.registration)}</h3><p><strong>${escape(r.aircraft_type)}</strong></p><p class="fs-name">${escape(r.aircraft_name || '—')}</p><p>${escape(classes[r.fleet_class] || 'Other fleet')}</p><p>Location: <strong>${escape(r.current_location || 'Not recorded')}</strong></p><p class="fs-explanation">${escape(explanation)}</p></article>`;
        }).join('') : `<p class="fs-empty">${rows.length ? 'No aircraft match your filters.' : 'No current aircraft are listed.'}</p>`;
    };
    function unavailable(text) {
        rows = [];
        lastSuccess = 0;
        $('fsNotice').textContent = text;
        $('fsGrid').innerHTML = '<p class="fs-empty">Fleet status unavailable. Please refresh or check with Operations.</p>';
        ['fsTotal','fsAvailable','fsUnavailable'].forEach(id=>$(id).textContent='—');
        $('fsCount').textContent = '';
        $('fsUpdated').textContent = 'Status not confirmed';
    }
    async function refresh() {
        if (busy) return;
        busy = true;
        $('fsRefresh').disabled = true;
        $('fsGrid').setAttribute('aria-busy','true');
        const controller = new AbortController();
        const timeout = setTimeout(()=>controller.abort(),15000);
        try {
            const response = await fetch(endpoint,{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:controller.signal});
            if (!response.ok) throw new Error('Status request failed');
            const data = await response.json();
            if (!Array.isArray(data) || data.some(r=>!r || typeof r.registration !== 'string' || typeof r.operational_status !== 'string')) throw new Error('Invalid fleet response');
            rows = data;
            lastSuccess = Date.now();
            $('fsNotice').textContent = '';
            $('fsUpdated').textContent = `Last checked ${new Date(lastSuccess).toLocaleTimeString('en-GB',{timeZone:'UTC'})} UTC`;
            render();
        } catch {
            unavailable('We couldn’t retrieve the latest fleet status. Availability is not confirmed until the next successful refresh.');
        } finally {
            clearTimeout(timeout);
            busy = false;
            $('fsRefresh').disabled = false;
            $('fsGrid').setAttribute('aria-busy','false');
        }
    }
    ['fsSearch','fsStatus','fsClass'].forEach(id=>$(id).addEventListener('input',()=>{if(lastSuccess) render();}));
    $('fsRefresh').addEventListener('click',refresh);
    function startTimer() {
        clearInterval(timer);
        timer = setInterval(()=>{ if (!document.hidden) refresh(); },60000);
    }
    document.addEventListener('visibilitychange',()=>{
        if(document.hidden) clearInterval(timer);
        else { if(lastSuccess && Date.now()-lastSuccess>120000) unavailable('The previous snapshot has expired. Checking the latest fleet status…'); refresh(); startTimer(); }
    });
    window.addEventListener('offline',()=>unavailable('You are offline. Reconnect and refresh to confirm aircraft availability.'));
    window.addEventListener('online',refresh);
    refresh(); startTimer();
})();
