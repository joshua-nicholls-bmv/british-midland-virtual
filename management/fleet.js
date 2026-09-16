// BMV Phase 1: manual technical operations using the existing Supabase RPCs.
// Database authorisation is required; browser checks are only a UX gate.
(() => {
    'use strict';
    const client = window.supabase.createClient(
        'https://eqbaezhcwnjlcnvtfxho.supabase.co',
        'sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW'
    );
    const $ = id => document.getElementById(id);
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const label = value => String(value || 'Unknown').replaceAll('_', ' ');
    const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('en-GB', {timeZone:'UTC'}) + ' UTC' : '—';
    const canHold = row => row.lifecycle_status === 'CURRENT' && row.operational_status === 'AVAILABLE';
    const canRelease = row => row.lifecycle_status === 'CURRENT' && ['TECH_HOLD','AWAITING_RELEASE'].includes(row.operational_status);
    let fleet = [], manager = null, selected = null, busy = false, loading = false, historyRequest = 0;
    const redirect = () => window.location.replace('/management/');
    function message(text, error = false) {
        $('pageMessage').textContent = text;
        $('pageMessage').className = error ? 'error' : '';
    }
    async function authorise() {
        const {data:auth, error:authError} = await client.auth.getUser();
        if (authError || !auth.user) throw new Error('Your session could not be verified. Please sign in again.');
        const {data, error} = await client.from('management_users').select('display_name, role, active').eq('user_id',auth.user.id).eq('active',true).maybeSingle();
        if (error) throw new Error('Unable to verify management access. Please try again.');
        if (!data) throw new Error('Active management access is required.');
        manager = {...data, userId:auth.user.id};
        $('managementName').textContent = data.display_name || auth.user.id;
        $('managementRole').textContent = data.role || 'Management';
        return manager;
    }
    function badge(value) {
        const style = ['AVAILABLE','TECH_HOLD','AWAITING_RELEASE'].includes(value) ? value.toLowerCase() : '';
        return `<span class="badge ${style}">${escape(label(value))}</span>`;
    }
    function pirepLink(id) {
        return id == null ? 'None' : `<a href="pirep.html?id=${encodeURIComponent(id)}">PIREP #${escape(id)}</a>`;
    }
    function render() {
        const current = fleet.filter(r => r.lifecycle_status === 'CURRENT');
        $('currentCount').textContent = current.length;
        $('availableCount').textContent = current.filter(canHold).length;
        $('holdCount').textContent = current.filter(canRelease).length;
        $('otherCount').textContent = current.filter(r => !canHold(r) && !canRelease(r)).length;
        const search = $('searchInput').value.trim().toLowerCase();
        const rows = fleet.filter(r => (!$('lifecycleFilter').value || r.lifecycle_status === $('lifecycleFilter').value)
            && (!$('statusFilter').value || r.operational_status === $('statusFilter').value)
            && [r.registration,r.aircraft_type,r.aircraft_name,r.current_location,r.fleet_class].some(v => String(v || '').toLowerCase().includes(search)));
        $('resultCount').textContent = `${rows.length} aircraft shown · ${fleet.length} in register`;
        $('fleetList').innerHTML = rows.length ? rows.map(row => `<article class="aircraft-card ${canRelease(row) ? 'on-hold' : ''}">
            <div class="aircraft-top"><div><h4>${escape(row.registration)} · ${escape(row.aircraft_type)}</h4><p>${escape(row.aircraft_name || 'Unnamed aircraft')}</p><p class="muted">${escape(label(row.fleet_class))} · Location: <strong>${escape(row.current_location || 'Not recorded')}</strong></p></div>
            <div class="badges">${badge(row.lifecycle_status)}${badge(row.operational_status)}</div></div>
            ${row.tech_hold_reason || canRelease(row) ? `<div class="tech-details"><p class="reason">${escape(row.tech_hold_reason || 'No technical hold reason recorded.')}</p><p>Placed: ${escape(date(row.tech_hold_at))} · By: ${escape(row.tech_hold_by || 'Not recorded')}</p><p>${pirepLink(row.tech_hold_pirep_id)}</p></div>` : ''}
            ${row.returned_to_service_at ? `<p class="muted">Last released: ${escape(date(row.returned_to_service_at))} · ${escape(row.returned_to_service_by || 'Not recorded')}</p>` : ''}
            <div class="aircraft-actions">${canHold(row) ? `<button class="fleet-button danger" data-action="hold" data-reg="${escape(row.registration)}">PLACE ON TECH HOLD</button>` : ''}
            ${canRelease(row) ? `<button class="fleet-button primary" data-action="release" data-reg="${escape(row.registration)}">RETURN TO SERVICE</button>` : ''}
            <button class="fleet-button" data-action="history" data-reg="${escape(row.registration)}">HOLD HISTORY</button></div></article>`).join('')
            : '<p class="empty-state">No aircraft match these filters.</p>';
    }
    async function loadFleet() {
        if (loading) return false;
        loading = true;
        $('refreshButton').disabled = true;
        $('fleetList').setAttribute('aria-busy','true');
        try {
            await authorise();
            // Fetch all pages rather than silently truncating at the API row limit.
            const rows = [];
            for (let start = 0; ; start += 500) {
                const {data,error} = await client.from('fleet').select('*').order('registration').range(start,start + 499);
                if (error) throw error;
                rows.push(...(data || []));
                if (!data || data.length < 500) break;
            }
            fleet = rows;
            render();
            $('updatedAt').textContent = `UPDATED ${date(new Date().toISOString())}`;
            return true;
        } catch (error) {
            fleet = [];
            $('fleetList').innerHTML = '<p class="empty-state">Fleet unavailable. Use Refresh Fleet to try again.</p>';
            ['currentCount','availableCount','holdCount','otherCount'].forEach(id => $(id).textContent = '—');
            $('resultCount').textContent = '';
            $('updatedAt').textContent = 'REFRESH REQUIRED';
            message(`Unable to load fleet. ${error.message || 'Check your connection and database permissions.'}`,true);
            return false;
        } finally {
            loading = false;
            $('refreshButton').disabled = false;
            $('fleetList').setAttribute('aria-busy','false');
        }
    }
    function openAction(action,row) {
        if (busy || loading || (action === 'hold' ? !canHold(row) : !canRelease(row))) return;
        selected = {action, registration:row.registration};
        $('actionForm').reset();
        $('actionError').textContent = '';
        const hold = action === 'hold';
        $('actionTitle').textContent = hold ? 'Place on Tech Hold' : 'Return to Service';
        $('actionAircraft').textContent = `${row.registration} · ${row.aircraft_type} · ${label(row.operational_status)}`;
        $('holdFields').hidden = !hold;
        $('holdFields').disabled = !hold;
        $('releaseNote').hidden = hold;
        $('holdLocation').value = row.current_location || '';
        $('actorNote').textContent = `Recorded as ${manager.display_name || manager.userId}.`;
        $('confirmAction').textContent = hold ? 'PLACE ON TECH HOLD' : 'CONFIRM RETURN TO SERVICE';
        $('actionDialog').showModal();
        (hold ? $('holdLocation') : $('cancelAction')).focus();
    }
    async function submit(event) {
        event.preventDefault();
        if (busy || !selected) return;
        busy = true;
        $('confirmAction').disabled = $('cancelAction').disabled = true;
        $('actionError').textContent = '';
        let saved = false;
        try {
            const actor = await authorise();
            const {data:row,error:rowError} = await client.from('fleet').select('*').eq('registration',selected.registration).single();
            if (rowError) throw rowError;
            const hold = selected.action === 'hold';
            if (hold ? !canHold(row) : !canRelease(row)) throw new Error('This aircraft’s status has changed. Close this form and refresh the fleet.');
            let args = {p_registration:selected.registration};
            if (hold) {
                const location = $('holdLocation').value.trim().toUpperCase();
                const reason = $('holdReason').value.trim();
                const pirep = $('holdPirep').value.trim();
                if (!/^[A-Z]{3,4}$/.test(location)) throw new Error('Enter a three-letter IATA or four-letter ICAO location.');
                if (!reason || reason.length > 2000) throw new Error('Enter a reason of up to 2,000 characters.');
                if (pirep && (!/^[0-9]+$/.test(pirep) || BigInt(pirep) < 1n || BigInt(pirep) > 9223372036854775807n)) throw new Error('Enter a valid positive PIREP ID.');
                if (pirep) {
                    const {data:report,error} = await client.from('pireps').select('id, registration').eq('id',pirep).maybeSingle();
                    if (error) throw error;
                    if (!report || report.registration?.trim().toUpperCase() !== selected.registration) throw new Error('The PIREP must exist and belong to this aircraft.');
                }
                args = {...args,p_location:location,p_reason:reason,p_pirep_id:pirep || null,p_grounded_by:actor.display_name || actor.userId};
            } else args.p_released_by = actor.display_name || actor.userId;
            const {error} = await client.rpc(hold ? 'place_aircraft_on_tech_hold' : 'return_aircraft_to_service',args);
            if (error) throw error;
            saved = true;
            $('actionDialog').close();
            const confirmation = `${selected.registration} ${hold ? 'placed on Tech Hold' : 'returned to service'}.`;
            message(confirmation);
            if (!await loadFleet()) message(`${confirmation} The change was saved, but the fleet could not be refreshed. Refresh before taking further action.`,true);
        } catch (error) {
            $('actionError').textContent = `${error.message || 'Unable to save the change.'} If the connection was interrupted, close and refresh to check whether it was saved before retrying.`;
        } finally {
            busy = false;
            $('confirmAction').disabled = $('cancelAction').disabled = false;
            if (saved) selected = null;
        }
    }
    async function history(row) {
        const request = ++historyRequest;
        $('historyTitle').textContent = `${row.registration} · Hold history`;
        $('historyContent').textContent = 'Loading history…';
        $('historyDialog').showModal();
        try {
            const {data,error} = await client.from('tech_hold_history').select('*').eq('registration',row.registration).order('placed_on_hold_at',{ascending:false}).order('id',{ascending:false}).limit(50);
            if (error) throw error;
            if (request !== historyRequest) return;
            $('historyContent').innerHTML = data?.length ? '<p class="muted">Latest 50 records at most · All times UTC</p>' + data.map(h => `<article class="history-entry">${badge(h.status)}<p>${escape(h.location)} · ${pirepLink(h.pirep_id)}</p><p>${escape(h.reason)}</p><p class="muted">Placed: ${escape(date(h.placed_on_hold_at))}<br>By: ${escape(h.placed_on_hold_by || 'Not recorded')}</p>${h.released_at ? `<p class="muted">Released: ${escape(date(h.released_at))}<br>By: ${escape(h.released_by || 'Not recorded')}</p>` : ''}</article>`).join('') : '<p>No technical holds recorded.</p>';
        } catch (error) {
            if (request === historyRequest) $('historyContent').textContent = `History unavailable. ${error.message || 'Try again.'}`;
        }
    }
    $('fleetList').addEventListener('click',event => {
        const button = event.target.closest('button[data-action]');
        if (!button || busy || loading) return;
        const row = fleet.find(r => r.registration === button.dataset.reg);
        if (!row) return;
        if (button.dataset.action === 'history') history(row);
        else openAction(button.dataset.action,row);
    });
    ['searchInput','lifecycleFilter','statusFilter'].forEach(id => $(id).addEventListener('input',() => { if (!loading && fleet.length) render(); }));
    $('refreshButton').addEventListener('click',() => { message(''); loadFleet(); });
    $('actionForm').addEventListener('submit',submit);
    $('cancelAction').addEventListener('click',() => { if (!busy) $('actionDialog').close(); });
    $('actionDialog').addEventListener('cancel',event => { if (busy) event.preventDefault(); });
    $('closeHistory').addEventListener('click',() => $('historyDialog').close());
    $('historyDialog').addEventListener('close',() => { historyRequest++; });
    $('signOutButton').addEventListener('click',async () => {
        if (busy) return;
        $('signOutButton').disabled = true;
        try { const {error} = await client.auth.signOut(); if (error) throw error; redirect(); }
        catch { message('Unable to sign out. Please try again.',true); $('signOutButton').disabled = false; }
    });
    client.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') redirect(); });
    (async () => {
        try {
            await authorise();
            $('authGate').classList.add('hidden');
            $('dashboardApp').classList.remove('hidden');
            await loadFleet();
        } catch (error) { $('authMessage').textContent = error.message || 'Unable to verify access. Please sign in again.'; }
    })();
})();
